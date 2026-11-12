// Shared deterministic helpers for /wander-autopilot (state CLI + PreToolUse guard).
// Zero dependencies (Node >= 18). Planning-only: this code never edits the master plan or product code.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(SCRIPT_DIR, '..', '..'); // <root>/.claude/scripts -> <root>
export const PLAN = 'docs/wander-master-plan.md';
export const RULE_CONTEXT = '.claude/rules/wander-product-context.md';
export const AP_DIR = '.claude/autopilot';
export const RUNS_DIR = '.claude/autopilot/runs';
export const LEASE = '.claude/autopilot/ACTIVE.json';
export const AUTH = '.claude/autopilot/authorizations.json';
export const CLI_REL = '.claude/scripts/autopilot.mjs';
export const GUARD_REL = '.claude/hooks/autopilot-guard.mjs';

export const ALLOWED_AGENTS = ['wander-product-analyst', 'wander-software-architect', 'wander-security-reviewer', 'wander-skeptic-qa'];
export const TOKENS = ['APPROVED', 'PROPOSED', 'OPEN', 'CONTRADICTION', 'INFERENCE', 'UNVERIFIED'];
export const DEFAULT_LIMITS = {
  max_review_rounds: 2,        // 1 parallel + 1 targeted
  max_agents_per_round: 4,
  max_agent_dispatches: 8,     // hook-enforced
  max_stage_attempts: 2,       // consecutive starts without success
  max_total_stage_starts: 25,
  max_resumes: 5,
  max_guard_denials: 3,        // stop when the guard denied this many calls in the run
  lease_hours: 8,
};
// Files that only the CLI/hook may write while a run is active (the model must not hand-edit them).
export const PROTECTED_NAMES = new Set(['checkpoint.json', 'active.json', 'dispatch.log', 'denials.log', 'authorizations.json']); // compared case-folded (NTFS / macOS are case-insensitive)
const MANIFEST_IGNORE_DIRS = new Set(['.git', 'node_modules', '.venv', 'dist', 'build', '.next', '__pycache__']);

export const STAGES = [
  { id: 'preflight', title: 'Preflight: plan hash/version, config, Git or manifest baseline, guard self-test', deps: [], kind: 'script' },
  { id: 'scope', title: 'Scope: read the section map, then only the plan sections the target needs; record IDs and status tokens', deps: ['preflight'], kind: 'read' },
  { id: 'route', title: 'Route: choose specialists with route-hint (wander-review/reference.md table)', deps: ['scope'], kind: 'synthesis' },
  { id: 'review-r1', title: 'Round 1: parallel independent specialist reviews', deps: ['route'], kind: 'agents' },
  { id: 'reconcile', title: 'Reconcile: cite-check, disagreement and evidence-gap list', deps: ['review-r1'], kind: 'synthesis' },
  { id: 'review-r2', title: 'Round 2 (optional, targeted rebuttal of material disagreements only)', deps: ['reconcile'], kind: 'agents', optional: true },
  { id: 'consolidate', title: 'Consolidate: decision records, options, recommendation (no promotion)', deps: ['reconcile', 'review-r2'], kind: 'synthesis' },
  { id: 'apply', title: 'Apply reversible documentation deliverables inside .claude/autopilot (optional)', deps: ['consolidate'], kind: 'write', optional: true },
  { id: 'report', title: 'Draft final report (Vietnamese) with decisions block', deps: ['consolidate', 'apply'], kind: 'write' },
  { id: 'validate', title: 'Validate: consistency, references, acceptance, diff', deps: ['report'], kind: 'script' },
];

// ---------- generic helpers ----------
export const nowIso = () => new Date().toISOString();
export const sha256Str = (s) => crypto.createHash('sha256').update(s).digest('hex');
export const sha256File = (abs) => crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
export const posix = (p) => p.split(path.sep).join('/').replace(/\\/g, '/');
export const abs = (rel) => path.resolve(ROOT, rel);
export const exists = (rel) => fs.existsSync(abs(rel));
export function readText(rel) { return fs.readFileSync(abs(rel), 'utf8'); }
export function readJson(rel, fallback = undefined) {
  try { return JSON.parse(fs.readFileSync(abs(rel), 'utf8')); } catch { return fallback; }
}
export function writeJsonAtomic(rel, obj) {
  const target = abs(rel); fs.mkdirSync(path.dirname(target), { recursive: true });
  const tmp = `${target}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n'); fs.renameSync(tmp, target);
}
export function appendLine(rel, line) {
  const target = abs(rel); fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.appendFileSync(target, line + '\n');
}
export function norm(s) { return s.replace(/\s+/g, ' ').trim(); }

/** Resolve p against base and return a root-relative posix path, or null if it leaves the project root. */
export function relFromRoot(p, base = ROOT) {
  if (typeof p !== 'string' || !p) return null;
  let full = path.resolve(base, p);
  const real = fs.realpathSync.native || fs.realpathSync; // .native also expands Windows 8.3 short names
  try { if (fs.existsSync(full)) full = real(full); } catch { /* ignore */ }
  let root = ROOT; try { root = real(ROOT); } catch { /* ignore */ }
  const rel = path.relative(root, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return posix(rel);
}
export const isUnder = (rel, prefix) => rel === prefix.replace(/\/$/, '') || rel.startsWith(prefix.endsWith('/') ? prefix : prefix + '/');
/** Deny-side comparison form: forward slashes, no trailing dots/spaces per segment (Win32 strips them), lower case. */
export const fold = (rel) => String(rel).replace(/\\/g, '/').split('/').map((seg) => seg.replace(/[. ]+$/, '')).join('/').toLowerCase();
export const isPlan = (rel) => !!rel && fold(rel) === PLAN;

export function walk(relDir = '', out = []) {
  const dir = abs(relDir || '.');
  let entries = []; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const rel = relDir ? `${relDir}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!MANIFEST_IGNORE_DIRS.has(e.name)) walk(rel, out); }
    else if (e.isFile()) out.push(rel);
  }
  return out;
}
/** Manifest of every project file, excluding run outputs and the lease (those are the workflow's own state). */
export function manifest() {
  const m = {};
  for (const rel of walk('')) {
    if (isUnder(rel, RUNS_DIR) || rel === LEASE || /\.tmp-\d+$/.test(rel)) continue;
    try { m[rel] = sha256File(abs(rel)); } catch { m[rel] = 'UNREADABLE'; }
  }
  return m;
}
export function diffManifest(base, now) {
  const added = [], removed = [], modified = [];
  for (const k of Object.keys(now)) { if (!(k in base)) added.push(k); else if (base[k] !== now[k]) modified.push(k); }
  for (const k of Object.keys(base)) if (!(k in now)) removed.push(k);
  return { added: added.sort(), removed: removed.sort(), modified: modified.sort() };
}
export function watchedSet() {
  const w = {};
  const add = (rel) => { if (exists(rel)) w[rel] = sha256File(abs(rel)); };
  [PLAN, 'CLAUDE.md', '.claude/settings.json', AUTH, 'docs/agent-system.md'].forEach(add);
  for (const rel of walk('.claude')) if (/\.(md|json|mjs)$/.test(rel) && !rel.endsWith('.test.mjs')) add(rel);
  return w;
}

// ---------- plan registry ----------
export function planInfo() {
  if (!exists(PLAN)) return null;
  const text = readText(PLAN);
  const lines = text.split(/\r?\n/);
  const sliceBetween = (startRe, endRe) => {
    const s = lines.findIndex((l) => startRe.test(l)); if (s < 0) return [];
    let e = lines.findIndex((l, i) => i > s && endRe.test(l)); if (e < 0) e = lines.length;
    return lines.slice(s, e);
  };
  const rows = (arr, re) => arr.map((l) => l.match(re)).filter(Boolean).map((m) => m[1]);
  const approvedD = new Set(rows(sliceBetween(/^### 14\.1/, /^### 14\.2/), /^\|\s*\**\s*(D\d+)\s*\**\s*\|/));
  const proposedP = new Set(rows(sliceBetween(/^### 14\.2/, /^### 14\.3/), /^\|\s*\**\s*(P\d+)\s*\**\s*\|/));
  const resolvedQ = new Set(rows(sliceBetween(/^### 15\.0/, /^### 15\.1/), /^\|\s*\**\s*(Q\d+)\s*\**\s*\|/));
  const sec15 = sliceBetween(/^## 15\./, /^## 16\./);
  const openQ = new Set(rows(sec15, /^\|\s*\**\s*(Q\d+)\s*\**\s*\|/).filter((q) => !resolvedQ.has(q)));
  const ids = new Set(text.match(/\b(?:[DQPRG]\d{1,2}|[AB]-\d{1,2})\b/g) || []);
  const headings = new Set(); // "14.1", "15", "0" ...
  for (const l of lines) { const m = l.match(/^#{1,6}\s+(\d+(?:\.\d+)*)\b/); if (m) headings.add(m[1]); }
  const vm = text.match(/Phiên bản:\*\*\s*(v[\d.]+)/);
  return { text, sha: sha256Str(text), version: vm ? vm[1] : null, approvedD, proposedP, resolvedQ, openQ, ids, headings };
}
export function registryHash() {
  if (!exists(RULE_CONTEXT)) return null;
  const m = readText(RULE_CONTEXT).match(/sha256\s+`([0-9a-f]{64})`/); return m ? m[1] : null;
}
export function authorizations() {
  const a = readJson(AUTH, null);
  return a && typeof a === 'object' ? a : { auto_resolve_classes: [], doc_write_allow: [] };
}

// ---------- lease / checkpoint ----------
export function loadLease() {
  if (!exists(LEASE)) return { state: 'none' };
  const lease = readJson(LEASE, null);
  if (!lease || !lease.run_id || !lease.expires) return { state: 'corrupt', lease: null };
  if (Date.parse(lease.expires) < Date.now()) return { state: 'expired', lease };
  return { state: 'active', lease };
}
export const runDir = (id) => `${RUNS_DIR}/${id}`;
export const cpPath = (id) => `${runDir(id)}/checkpoint.json`;
export function loadCheckpoint(id) { return readJson(cpPath(id), null); }
export function saveCheckpoint(cp) { cp.updated = nowIso(); writeJsonAtomic(cpPath(cp.run_id), cp); }
export function readLog(rel) {
  if (!exists(rel)) return [];
  return readText(rel).split(/\r?\n/).filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return { bad: l }; } });
}
export function dispatchesOf(id) { return readLog(`${runDir(id)}/dispatch.log`).filter((e) => !e.bad); }
export function denialsOf(id) { return readLog(`${runDir(id)}/denials.log`).filter((e) => !e.bad); }

// ---------- safe shell command parsing (active runs only allow the autopilot CLI) ----------
export function splitArgsSafe(cmd) {
  if (typeof cmd !== 'string' || !cmd.trim()) return { ok: false, why: 'empty' };
  const args = []; let cur = ''; let q = null; let has = false;
  for (const ch of cmd) {
    if (ch === '\n' || ch === '\r' || ch === '\0') return { ok: false, why: 'newline/NUL' };
    if (q === "'") { if (ch === "'") q = null; else cur += ch; continue; }
    if (q === '"') {
      if (ch === '"') q = null;
      else if (ch === '$' || ch === '`') return { ok: false, why: 'expansion inside double quotes' };
      else cur += ch;
      continue;
    }
    if (ch === "'" || ch === '"') { q = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (has || cur) { args.push(cur); cur = ''; has = false; } continue; }
    if (';&|<>`$(){}^'.includes(ch)) return { ok: false, why: `shell metacharacter "${ch}" outside quotes` };
    cur += ch;
  }
  if (q) return { ok: false, why: 'unterminated quote' };
  if (has || cur) args.push(cur);
  return { ok: true, args };
}
export function isAutopilotCli(cmd, base = ROOT) {
  const p = splitArgsSafe(cmd);
  if (!p.ok) return { ok: false, why: p.why };
  const [exe, script] = p.args;
  if (!exe || !/^node(\.exe)?$/i.test(path.basename(exe))) return { ok: false, why: 'only `node .claude/scripts/autopilot.mjs …` is allowed during a run' };
  if (!script) return { ok: false, why: 'no script' };
  const full = path.resolve(base, script).toLowerCase();
  return full === abs(CLI_REL).toLowerCase() ? { ok: true } : { ok: false, why: 'script is not the autopilot CLI' };
}

// ---------- guard policy (pure decision; the hook performs logging) ----------
const FILE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const PLAN_WRITE_RE = /(>|\btee\b|\bsed\b[^|;&\n]*\s-[a-zA-Z]*i|\bperl\b[^|;&\n]*\s-[a-zA-Z]*i|\bmv\b|\bcp\b|\brm\b|\bdel\b|\berase\b|\bmove\b|\bcopy\b|\btruncate\b|\bdd\b|Remove-Item|Set-Content|Add-Content|Out-File|Move-Item|Copy-Item|\bgit\s+(checkout|restore|apply|stash|reset|clean)\b|\bsponge\b|\bpython\d?\b|\bnode\b)/i;

export function evaluate(input) {
  const tool = input.tool_name || ''; const ti = input.tool_input || {};
  const base = input.cwd && path.isAbsolute(input.cwd) ? input.cwd : ROOT;
  const lease = loadLease();
  const active = lease.state === 'active' || lease.state === 'corrupt'; // corrupt lease => fail closed
  const deny = (code, reason) => ({ decision: 'deny', code, reason: `GUARD:${code} ${reason}`, active });
  const allow = (extra = {}) => ({ decision: 'allow', active, ...extra });

  if (FILE_TOOLS.has(tool)) {
    const p = ti.file_path ?? ti.notebook_path;
    const rel = relFromRoot(p, base);
    if (isPlan(rel)) return deny('PLAN_PROTECTED', 'docs/wander-master-plan.md is read-only. Propose a patch file under .claude/autopilot/ instead.');
    if (!active) return allow();
    if (rel === null) return deny('OUTSIDE_ROOT', 'writes outside the project are not allowed during an autopilot run.');
    if (PROTECTED_NAMES.has(path.posix.basename(fold(rel)))) return deny('STATE_FILE', `${rel} is managed by the autopilot CLI/hook; use \`node ${CLI_REL}\` commands.`);
    if (/\\|[. ](\/|$)/.test(rel)) return deny('ODD_NAME', `${rel} has a backslash or a segment ending in dot/space; use a plain forward-slash path.`);
    if (isUnder(rel, AP_DIR)) return allow();
    const auth = authorizations();
    const listed = (auth.doc_write_allow || []).some((e) => e && typeof e.path === 'string' && e.path.toLowerCase() === rel.toLowerCase() && !isUnder(rel, '.claude') && /\.md$/i.test(rel));
    if (listed) return allow();
    return deny('WRITE_SCOPE', `planning-only run: writes are limited to ${AP_DIR}/ (got ${rel}). Product code and other docs are out of scope.`);
  }

  if (tool === 'Bash' || tool === 'PowerShell') {
    const cmd = String(ti.command || '');
    if (/wander-master-plan/i.test(cmd) && PLAN_WRITE_RE.test(cmd)) {
      const safeRead = isAutopilotCli(cmd, base).ok; // our own CLI only reads/hashes the plan
      if (!safeRead) return deny('PLAN_PROTECTED', 'command references the master plan together with a write-capable operator.');
    }
    if (!active) return allow();
    const r = isAutopilotCli(cmd, base);
    return r.ok ? allow() : deny('BASH_SCOPE', `during a run only \`node ${CLI_REL} <command>\` is allowed (${r.why}). Use Read/Grep/Glob to read files.`);
  }

  if (tool === 'Agent' || tool === 'Task') {
    if (!active) return allow();
    if (input.agent_id) return deny('NO_NESTING', 'subagents must not spawn subagents.');
    const type = ti.subagent_type;
    if (!ALLOWED_AGENTS.includes(type)) return deny('AGENT_TYPE', `only ${ALLOWED_AGENTS.join(', ')} may be dispatched during a run (got ${type || 'default/general-purpose'}).`);
    if (lease.state === 'corrupt') return deny('LEASE_CORRUPT', 'ACTIVE.json is unreadable; run `autopilot.mjs status`.');
    const id = lease.lease.run_id; const cp = loadCheckpoint(id);
    if (!cp) return deny('NO_CHECKPOINT', `checkpoint for ${id} is missing.`);
    const open = (cp.rounds.history || []).find((r) => r.closed == null);
    if (!open) return deny('NO_OPEN_ROUND', `open a round first: node ${CLI_REL} round open --n <1|2> --agents <list>.`);
    if (!open.agents.includes(type)) return deny('AGENT_NOT_PLANNED', `${type} is not in round ${open.n}'s registered agents (${open.agents.join(', ')}).`);
    const log = dispatchesOf(id);
    if (log.length >= cp.limits.max_agent_dispatches) return deny('DISPATCH_LIMIT', `run already dispatched ${log.length} agents (max ${cp.limits.max_agent_dispatches}). STOP.`);
    const prior = log.filter((e) => e.round === open.n && e.agent === type);
    const saved = exists(`${runDir(id)}/agents/${type}-r${open.n}.md`);
    if (prior.length && saved) return deny('DUPLICATE_DISPATCH', `${type} already delivered a saved report in round ${open.n}; no re-dispatch.`);
    if (prior.length >= 2) return deny('DISPATCH_RETRY_LIMIT', `${type} was dispatched ${prior.length} times in round ${open.n} without a saved report; close the round with --missing instead of retrying.`);
    return allow({ log: { run_id: id, round: open.n, agent: type } });
  }
  return allow();
}
