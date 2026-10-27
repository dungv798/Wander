#!/usr/bin/env node
// Wander autopilot state machine: checkpoint, resume verification, loop limits, validation.
// Writes ONLY under docs/autopilot/. Never edits the master plan or product code.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import * as L from './autopilot-lib.mjs';

const { ROOT, PLAN, AP_DIR, RUNS_DIR, LEASE, STAGES, ALLOWED_AGENTS, TOKENS } = L;

// ---------- output / args ----------
function out(obj, code = 0) { process.stdout.write(JSON.stringify(obj, null, 2) + '\n'); process.exit(code); }
function refuse(code, msg, extra = {}) { out({ ok: false, code, message: msg, ...extra }, 3); }
function parseArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) { const k = a.slice(2); const nxt = argv[i + 1]; if (nxt === undefined || nxt.startsWith('--')) opt[k] = true; else { opt[k] = nxt; i++; } }
    else pos.push(a);
  }
  return { pos, opt };
}
const csv = (s) => (typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);
const slug = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24) || 'run';
function stamp() { const d = new Date(); const p = (n) => String(n).padStart(2, '0'); return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}-${p(d.getUTCHours())}${p(d.getUTCMinutes())}`; }
function norm_(s) { return s.replace(/\s+/g, ' ').trim(); }

function currentRunId(opt) {
  if (typeof opt.run === 'string') return opt.run;
  const lease = L.loadLease();
  if (lease.lease?.run_id) return lease.lease.run_id;
  const runs = L.exists(RUNS_DIR) ? fs.readdirSync(L.abs(RUNS_DIR)).filter((d) => L.exists(L.cpPath(d))).sort() : [];
  const open = runs.filter((d) => ['running', 'blocked'].includes(L.loadCheckpoint(d)?.status));
  return open.length ? open[open.length - 1] : (runs[runs.length - 1] || null);
}
function mustCp(opt) {
  const id = currentRunId(opt); if (!id) refuse('NO_RUN', 'no run found; use `init` first.');
  const cp = L.loadCheckpoint(id); if (!cp) refuse('NO_CHECKPOINT', `checkpoint for ${id} missing or unreadable.`);
  return cp;
}
const getStage = (cp, id) => { const s = cp.stages.find((x) => x.id === id); if (!s) refuse('NO_STAGE', `unknown stage ${id}`); return s; };
const depsOk = (cp, s) => s.deps.every((d) => ['done', 'skipped'].includes(cp.stages.find((x) => x.id === d)?.status));
const hashMap = (paths) => { const m = {}; for (const p of paths) { const rel = L.relFromRoot(p); if (!rel || !L.exists(rel)) refuse('BAD_PATH', `path missing or outside project: ${p}`); m[rel] = L.sha256File(L.abs(rel)); } return m; };

// ---------- git (read-only) ----------
function gitInfo() {
  if (!L.exists('.git')) return { present: false, head: null, dirty: null };
  const run = (args) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: 20000 });
  const head = run(['rev-parse', 'HEAD']); const st = run(['status', '--porcelain']);
  if (head.error || st.error) return { present: true, error: String((head.error || st.error).message), head: null, dirty: null };
  return { present: true, head: head.status === 0 ? head.stdout.trim() : null, dirty: st.stdout.split(/\r?\n/).filter(Boolean) };
}

// ---------- preflight ----------
function agentTools(rel) { const m = L.exists(rel) ? L.readText(rel).match(/^tools:\s*(.+)$/m) : null; return m ? m[1].trim() : null; }
function guardSelfTest() {
  const payload = JSON.stringify({ tool_name: 'Edit', tool_input: { file_path: PLAN }, cwd: ROOT });
  const r = spawnSync(process.execPath, [L.abs(L.GUARD_REL)], { input: payload, encoding: 'utf8', timeout: 20000, env: { ...process.env, WANDER_GUARD_SELFTEST: '1' } });
  return r.status === 2 && /PLAN_PROTECTED/.test(r.stderr || '');
}
function preflightChecks() {
  const checks = []; const add = (id, status, msg) => checks.push({ id, status, msg });
  const plan = L.planInfo();
  if (!plan) { add('plan_present', 'FAIL', `${PLAN} not found`); return checks; }
  add('plan_present', 'PASS', `${PLAN} sha256=${plan.sha.slice(0, 12)}…`);
  const regVersion = ((L.exists(L.RULE_CONTEXT) ? L.readText(L.RULE_CONTEXT) : '').match(/Verified against .*?\*\*(v[\d.]+)\*\*/) || [])[1] || 'unknown';
  add('plan_version', plan.version === regVersion ? 'PASS' : 'WARN', `plan version ${plan.version}; registry in ${L.RULE_CONTEXT} is verified for ${regVersion}`);
  const reg = L.registryHash();
  add('registry_hash', reg === plan.sha ? 'PASS' : 'WARN', reg === plan.sha ? 'plan hash equals registry hash' : `plan hash differs from registry (${reg ? reg.slice(0, 12) : 'none'}…): registry may be STALE; re-verify before relying on it`);
  const must = ['CLAUDE.md', '.claude/rules/planning-safety.md', '.claude/rules/review-output.md', L.RULE_CONTEXT, '.claude/skills/wander-review/reference.md', '.claude/skills/wander-autopilot/SKILL.md', L.GUARD_REL, '.claude/settings.json', ...ALLOWED_AGENTS.map((a) => `.claude/agents/${a}.md`)];
  const missing = must.filter((m) => !L.exists(m));
  add('files_present', missing.length ? 'FAIL' : 'PASS', missing.length ? `missing: ${missing.join(', ')}` : `${must.length} required files present`);
  const bad = ALLOWED_AGENTS.filter((a) => agentTools(`.claude/agents/${a}.md`) !== 'Read, Grep, Glob');
  add('agents_read_only', bad.length ? 'FAIL' : 'PASS', bad.length ? `agents with tools != "Read, Grep, Glob": ${bad.join(', ')}` : 'all 4 specialists are Read/Grep/Glob only');
  const st = L.readJson('.claude/settings.json', {});
  const denyOk = (st.permissions?.deny || []).some((d) => /Edit\(\/docs\/wander-master-plan\.md\)/.test(d));
  add('settings_plan_deny', denyOk ? 'PASS' : 'FAIL', denyOk ? 'permissions.deny blocks Edit on the master plan' : 'permissions.deny for the master plan is missing');
  const hooks = JSON.stringify(st.hooks || {});
  add('settings_guard_hook', /autopilot-guard\.mjs/.test(hooks) && /"onFailure":"block"/.test(hooks) ? 'PASS' : 'FAIL', 'PreToolUse guard registered with onFailure=block (onFailure needs Claude Code >= 2.1.295; UNVERIFIED on your machine)');
  add('guard_selftest', L.exists(L.GUARD_REL) && guardSelfTest() ? 'PASS' : 'FAIL', 'guard denies a synthetic master-plan edit (exit 2)');
  const major = Number(process.versions.node.split('.')[0]);
  add('node_version', major >= 18 ? 'PASS' : 'FAIL', `node ${process.versions.node}`);
  const g = gitInfo();
  add('git_state', 'INFO', g.present ? `git present, HEAD=${(g.head || 'none').slice(0, 10)}, dirty=${g.dirty ? g.dirty.length : '?'} file(s)` : 'no .git directory: the file manifest (sha256 of every project file) is the diff baseline');
  const lease = L.loadLease();
  add('lease', lease.state === 'active' ? 'WARN' : 'PASS', `lease state: ${lease.state}${lease.lease ? ` (run ${lease.lease.run_id})` : ''}`);
  return checks;
}
const checksFail = (checks) => checks.filter((c) => c.status === 'FAIL');

const C = {};

// ---------- commands ----------
C.hash = ({ pos }) => { const rel = L.relFromRoot(pos[0] || ''); if (!rel || !L.exists(rel)) refuse('BAD_PATH', 'file missing'); out({ ok: true, path: rel, sha256: L.sha256File(L.abs(rel)) }); };

C.preflight = ({ opt }) => {
  const checks = preflightChecks(); const fails = checksFail(checks);
  if (opt.run || L.loadLease().state === 'active') {
    const cp = mustCp(opt); const s = getStage(cp, 'preflight');
    if (s.status === 'running') {
      if (fails.length) { s.status = 'failed'; s.note = fails.map((f) => f.id).join(','); }
      else { s.status = 'done'; s.finished = L.nowIso(); s.attempts = 0; s.inputs = hashMap([PLAN]); s.outputs = {}; s.note = 'preflight passed'; }
      L.saveCheckpoint(cp);
    }
  }
  out({ ok: !fails.length, checks }, fails.length ? 3 : 0);
};

C['dry-run'] = ({ opt }) => {
  const target = typeof opt.target === 'string' ? opt.target : '(none)';
  const checks = preflightChecks(); const plan = L.planInfo();
  const w = L.watchedSet(); const m = L.manifest();
  out({
    ok: !checksFail(checks).length, wrote_files: false, target,
    limits: L.DEFAULT_LIMITS, stages: STAGES.map(({ id, deps, optional, kind }) => ({ id, kind, deps, optional: !!optional })),
    preflight: checks, route_hint: routeHint(target),
    registry: plan ? { version: plan.version, sha256: plan.sha, approved_decisions: [...plan.approvedD].sort(), open_questions: [...plan.openQ].sort(), proposals: [...plan.proposedP].sort() } : null,
    fingerprint: { watched_files: Object.keys(w).length, manifest_files: Object.keys(m).length },
    lease: L.loadLease().state,
  }, checksFail(checks).length ? 3 : 0);
};

C.init = ({ opt }) => {
  const target = typeof opt.target === 'string' ? opt.target.trim() : '';
  if (target.length < 3) refuse('NO_TARGET', 'usage: init --target "<focused target>" [--run-id ID] [--executor claude-code|emulated]');
  const lease = L.loadLease();
  if (lease.state === 'active') refuse('LEASE_ACTIVE', `run ${lease.lease.run_id} holds a valid lease until ${lease.lease.expires}. Resume it (\`resume\`) or \`close --outcome aborted\` it first.`);
  const checks = preflightChecks(); const fails = checksFail(checks);
  if (fails.length) refuse('PREFLIGHT_FAILED', 'fix these before starting', { checks: fails });
  const plan = L.planInfo();
  const id = typeof opt['run-id'] === 'string' ? opt['run-id'].replace(/[^A-Za-z0-9_-]/g, '') : `${stamp()}-${slug(target)}`;
  if (L.exists(L.runDir(id))) refuse('RUN_EXISTS', `${L.runDir(id)} already exists`);
  const executor = opt.executor === 'emulated' ? 'emulated' : 'claude-code';
  const cp = {
    schema: 1, run_id: id, target, created: L.nowIso(), updated: L.nowIso(), status: 'running', executor,
    limits: { ...L.DEFAULT_LIMITS },
    baseline: { plan_sha256: plan.sha, plan_version: plan.version, registry_hash: L.registryHash(), watched: L.watchedSet(), manifest: L.manifest(), git: gitInfo() },
    stages: STAGES.map((s) => ({ ...s, status: 'pending', attempts: 0, starts: 0, inputs: {}, outputs: {}, started: null, finished: null, note: null, blocker: null })),
    rounds: { max: L.DEFAULT_LIMITS.max_review_rounds, history: [] },
    resume: { count: 0, history: [] },
    acceptance: [
      { id: 'AC1', text: 'Master plan unchanged (sha256 equals baseline)', checks: ['plan_unchanged'] },
      { id: 'AC2', text: 'Only files under docs/autopilot/ changed; no product code touched', checks: ['write_scope'] },
      { id: 'AC3', text: 'Review rounds <= 2, dispatches <= 8, stage attempts within limits', checks: ['limits'] },
      { id: 'AC4', text: 'Every stage is done/skipped, or blocked with a precise blocker', checks: ['stages_complete', 'outputs_integrity'] },
      { id: 'AC5', text: 'Every cited ID/section exists in the plan; every quote is verbatim', checks: ['id_references', 'quotes_verbatim', 'path_references'] },
      { id: 'AC6', text: 'No proposal/inference/open item promoted to APPROVED; approved decisions preserved', checks: ['decisions_block'] },
      { id: 'AC7', text: 'Every saved specialist report has a logged dispatch; evidence source is stated', checks: ['dispatch_evidence'] },
      { id: 'AC8', text: 'Final report has required sections', checks: ['report_sections'] },
      { id: 'AC9', text: 'Guard hook and plan deny are configured and the guard self-test passes', checks: ['guard_config'] },
    ],
  };
  const dir = L.runDir(id);
  for (const d of ['stages', 'agents', 'deliverables']) fs.mkdirSync(L.abs(`${dir}/${d}`), { recursive: true });
  L.saveCheckpoint(cp);
  L.writeJsonAtomic(LEASE, { run_id: id, started: L.nowIso(), expires: new Date(Date.now() + cp.limits.lease_hours * 3600e3).toISOString(), executor });
  out({ ok: true, run_id: id, run_dir: dir, executor, limits: cp.limits, stages: cp.stages.map((s) => s.id), preflight_warnings: checks.filter((c) => c.status === 'WARN') });
};

function nextInfo(cp) {
  const byId = Object.fromEntries(cp.stages.map((s) => [s.id, s]));
  const finished = (s) => ['done', 'skipped'].includes(s.status);
  const runnable = cp.stages.filter((s) => ['pending', 'stale', 'failed'].includes(s.status) && depsOk(cp, s) && s.attempts < cp.limits.max_stage_attempts).map((s) => s.id);
  const blocked = cp.stages.filter((s) => s.status === 'blocked' || (s.status === 'failed' && s.attempts >= cp.limits.max_stage_attempts)).map((s) => ({ id: s.id, blocker: s.blocker || s.note || 'retry limit reached' }));
  const waiting = cp.stages.filter((s) => ['pending', 'stale'].includes(s.status) && !depsOk(cp, s)).map((s) => ({ id: s.id, waiting_on: s.deps.filter((d) => !finished(byId[d])) }));
  const running = cp.stages.filter((s) => s.status === 'running').map((s) => s.id);
  let stop = null;
  const lease = L.loadLease();
  if (cp.status === 'complete' || cp.status === 'aborted') stop = 'RUN_CLOSED';
  else if (lease.state === 'expired' && lease.lease?.run_id === cp.run_id) stop = 'STOP_LEASE_EXPIRED';
  else if (L.denialsOf(cp.run_id).length >= cp.limits.max_guard_denials) stop = 'STOP_GUARD_DENIALS';
  else if (cp.stages.reduce((n, s) => n + s.starts, 0) >= cp.limits.max_total_stage_starts) stop = 'STOP_TOTAL_STARTS';
  else if (cp.stages.filter((s) => !s.optional).every(finished)) stop = 'READY_TO_CLOSE';
  else if (!runnable.length && !running.length) stop = 'STOP_BLOCKER';
  return { runnable, running, blocked, waiting, stop };
}
C.next = ({ opt }) => { const cp = mustCp(opt); out({ ok: true, run_id: cp.run_id, status: cp.status, ...nextInfo(cp), dispatches: L.dispatchesOf(cp.run_id).length, denials: L.denialsOf(cp.run_id).length }); };

C.status = ({ opt }) => {
  const cp = mustCp(opt);
  out({ ok: true, run_id: cp.run_id, target: cp.target, status: cp.status, executor: cp.executor, lease: L.loadLease().state, stages: cp.stages.map(({ id, status, attempts, note, blocker }) => ({ id, status, attempts, note, blocker })), rounds: cp.rounds.history.map(({ n, kind, agents, opened, closed }) => ({ n, kind, agents, opened, closed })), dispatches: L.dispatchesOf(cp.run_id).map(({ round, agent, source }) => ({ round, agent, source })), denials: L.denialsOf(cp.run_id).length, resume: cp.resume.count, next: nextInfo(cp) });
};

C.stage = ({ pos, opt }) => {
  const [action, id] = pos; const cp = mustCp(opt); const s = getStage(cp, id);
  if (cp.status !== 'running') refuse('RUN_NOT_RUNNING', `run status is ${cp.status}`);
  const ni = nextInfo(cp);
  if (action === 'start' && ni.stop && !['READY_TO_CLOSE', 'STOP_BLOCKER'].includes(ni.stop)) refuse(ni.stop, `stop condition ${ni.stop}; checkpoint and report instead of continuing.`);
  if (action === 'start') {
    if (!['pending', 'stale', 'failed'].includes(s.status)) refuse('BAD_TRANSITION', `${id} is ${s.status}`);
    if (!depsOk(cp, s)) refuse('DEPS_NOT_DONE', `${id} waits on ${s.deps.filter((d) => !['done', 'skipped'].includes(cp.stages.find((x) => x.id === d).status)).join(', ')}`);
    if (s.attempts >= cp.limits.max_stage_attempts) { s.status = 'blocked'; s.blocker = `STOP_RETRY_LIMIT: ${s.attempts} attempts without success`; L.saveCheckpoint(cp); refuse('STOP_RETRY_LIMIT', `${id} already started ${s.attempts} times without success. Recorded as blocked; do not retry.`); }
    s.attempts++; s.starts++; s.status = 'running'; s.started = L.nowIso();
  } else if (action === 'done') {
    if (s.status !== 'running') refuse('BAD_TRANSITION', `${id} is ${s.status}, not running`);
    s.inputs = hashMap(csv(opt.inputs)); s.outputs = hashMap(csv(opt.outputs));
    s.status = 'done'; s.finished = L.nowIso(); s.attempts = 0; s.note = typeof opt.note === 'string' ? opt.note : null; s.blocker = null;
  } else if (action === 'fail') {
    if (s.status !== 'running') refuse('BAD_TRANSITION', `${id} is ${s.status}, not running`);
    s.status = 'failed'; s.note = typeof opt.reason === 'string' ? opt.reason : 'failed';
  } else if (action === 'block') {
    if (!['running', 'pending', 'stale', 'failed'].includes(s.status)) refuse('BAD_TRANSITION', `${id} is ${s.status}`);
    if (typeof opt.blocker !== 'string' || opt.blocker.length < 10) refuse('NEED_BLOCKER', 'give the precise blocker: --blocker "<what decision/evidence is missing>"');
    s.status = 'blocked'; s.blocker = opt.blocker;
  } else if (action === 'skip') {
    if (!s.optional) refuse('NOT_OPTIONAL', `${id} is not optional`);
    if (!['pending', 'stale'].includes(s.status)) refuse('BAD_TRANSITION', `${id} is ${s.status}`);
    if (typeof opt.reason !== 'string' || opt.reason.length < 10) refuse('NEED_REASON', 'give --reason');
    s.status = 'skipped'; s.note = opt.reason; s.finished = L.nowIso();
  } else refuse('USAGE', 'stage start|done|fail|block|skip <id>');
  L.saveCheckpoint(cp); out({ ok: true, stage: s.id, status: s.status, attempts: s.attempts });
};

// Re-record the hash of a finished stage's saved output after a small correction (e.g. a citation fix).
// Deterministic and logged; refuses state files, files outside the run folder, unchanged files, and more than 10 amendments.
C.amend = ({ opt }) => {
  const cp = mustCp(opt);
  if (cp.status !== 'running') refuse('RUN_NOT_RUNNING', `run status is ${cp.status}`);
  const file = typeof opt.file === 'string' ? opt.file.replace(/\\/g, '/') : '';
  if (!file) refuse('USAGE', 'amend --file <path under the run folder> --reason "<what changed and why, >= 15 chars>"');
  if (typeof opt.reason !== 'string' || opt.reason.length < 15) refuse('NEED_REASON', 'give --reason "<what changed and why>" (>= 15 characters)');
  if (!file.startsWith(`${L.runDir(cp.run_id)}/`) || /\.\.|[ .]$/.test(file)) refuse('OUTSIDE_RUN', 'only files inside this run folder can be amended');
  if (L.PROTECTED_NAMES.has(file.split('/').pop().replace(/[. ]+$/, '').toLowerCase())) refuse('STATE_FILE', 'state files are managed by the CLI and cannot be amended');
  if (!L.exists(file)) refuse('MISSING_FILE', `${file} does not exist`);
  if ((cp.amendments || []).length >= 10) refuse('STOP_AMEND_LIMIT', 'already 10 amendments; stop editing finished outputs and report');
  const stage = cp.stages.find((x) => x.status === 'done' && x.outputs && x.outputs[file]);
  const reports = cp.rounds.history.flatMap((r) => Object.values(r.reports || {})).filter((x) => x && x.path === file);
  if (!stage && !reports.length) refuse('NOT_A_RECORDED_OUTPUT', `${file} is not a recorded output of a finished stage or round; just edit it before \`stage done\``);
  const now = L.sha256File(L.abs(file)); const old = stage ? stage.outputs[file] : reports[0].sha256;
  if (now === old) refuse('UNCHANGED', 'file hash equals the recorded hash; nothing to amend');
  if (stage) stage.outputs[file] = now;
  for (const r of reports) r.sha256 = now;
  (cp.amendments = cp.amendments || []).push({ at: L.nowIso(), by: 'orchestrator', file, what: opt.reason, old_sha256: old, new_sha256: now });
  L.saveCheckpoint(cp); out({ ok: true, file, amendments: cp.amendments.length });
};

C.round = ({ pos, opt }) => {
  const action = pos[0]; const cp = mustCp(opt); const hist = cp.rounds.history;
  if (action === 'open') {
    const n = Number(opt.n);
    if (hist.some((r) => r.closed == null)) refuse('ROUND_ALREADY_OPEN', 'close the open round first');
    if (n > cp.limits.max_review_rounds) refuse('STOP_ROUND_LIMIT', `round ${n} exceeds max ${cp.limits.max_review_rounds}. No third round: consolidate and report.`);
    if (n !== hist.length + 1) refuse('BAD_ROUND', `next round number is ${hist.length + 1}`);
    const agents = csv(opt.agents);
    if (!agents.length || agents.length > cp.limits.max_agents_per_round || new Set(agents).size !== agents.length || agents.some((a) => !ALLOWED_AGENTS.includes(a))) refuse('BAD_AGENTS', `agents must be unique, 1-${cp.limits.max_agents_per_round}, from: ${ALLOWED_AGENTS.join(', ')}`);
    const stageId = n === 1 ? 'review-r1' : 'review-r2';
    if (getStage(cp, stageId).status !== 'running') refuse('STAGE_NOT_RUNNING', `run \`stage start ${stageId}\` first`);
    let kind = 'parallel';
    if (n === 2) {
      kind = 'targeted';
      if (typeof opt.reason !== 'string' || opt.reason.length < 20) refuse('NEED_REASON', 'round 2 needs --reason naming the MATERIAL disagreement/evidence gap');
      const r1 = hist[0].agents; if (agents.some((a) => !r1.includes(a))) refuse('BAD_AGENTS', 'round 2 may only re-engage agents from round 1');
    }
    hist.push({ n, kind, agents, reason: typeof opt.reason === 'string' ? opt.reason : null, opened: L.nowIso(), closed: null, reports: {} });
    L.saveCheckpoint(cp); out({ ok: true, round: n, kind, agents, dispatch_budget_left: cp.limits.max_agent_dispatches - L.dispatchesOf(cp.run_id).length });
  } else if (action === 'close') {
    const n = Number(opt.n); const r = hist.find((x) => x.n === n && x.closed == null);
    if (!r) refuse('NO_OPEN_ROUND', `round ${n} is not open`);
    const log = L.dispatchesOf(cp.run_id).filter((e) => e.round === n);
    const missingAllowed = new Map(csv(opt.missing).map((x) => { const [a, ...why] = x.split(':'); return [a, why.join(':') || 'no reason']; }));
    const problems = [];
    for (const a of r.agents) {
      if (!log.some((e) => e.agent === a)) problems.push(`${a}: no logged dispatch`);
      const rel = `${L.runDir(cp.run_id)}/agents/${a}-r${n}.md`;
      if (L.exists(rel) && fs.statSync(L.abs(rel)).size > 0) r.reports[a] = { path: rel, sha256: L.sha256File(L.abs(rel)) };
      else if (missingAllowed.has(a)) r.reports[a] = { missing: missingAllowed.get(a) };
      else problems.push(`${a}: report ${rel} missing (save it, or pass --missing ${a}:<reason>)`);
    }
    if (problems.length) refuse('ROUND_INCOMPLETE', 'cannot close round', { problems });
    r.closed = L.nowIso(); L.saveCheckpoint(cp); out({ ok: true, round: n, reports: r.reports });
  } else refuse('USAGE', 'round open --n N --agents a,b [--reason "..."] | round close --n N [--missing agent:why]');
};

C['dispatch-manual'] = ({ opt }) => {
  const cp = mustCp(opt);
  if (cp.executor !== 'emulated') refuse('NOT_EMULATED', 'dispatch-manual is only for runs initialised with --executor emulated (real runs are logged by the hook).');
  const r = cp.rounds.history.find((x) => x.closed == null); if (!r) refuse('NO_OPEN_ROUND', 'open a round first');
  const agent = opt.agent;
  if (!r.agents.includes(agent)) refuse('AGENT_NOT_PLANNED', `${agent} not registered in round ${r.n}`);
  const log = L.dispatchesOf(cp.run_id);
  if (log.length >= cp.limits.max_agent_dispatches) refuse('STOP_DISPATCH_LIMIT', 'dispatch limit reached');
  if (log.some((e) => e.round === r.n && e.agent === agent)) refuse('DUPLICATE_DISPATCH', 'already dispatched in this round');
  L.appendLine(`${L.runDir(cp.run_id)}/dispatch.log`, JSON.stringify({ ts: L.nowIso(), run_id: cp.run_id, round: r.n, agent, source: 'emulated', note: typeof opt.note === 'string' ? opt.note : null }));
  out({ ok: true, round: r.n, agent, source: 'emulated' });
};

// ---------- routing hint (reads the single source of truth: wander-review/reference.md) ----------
function routeHint(target) {
  const ref = '.claude/skills/wander-review/reference.md';
  if (!L.exists(ref)) return { matched: null, note: 'reference.md missing' };
  const rows = L.readText(ref).split(/\r?\n/).filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l) && !/Target type/.test(l));
  const idsOf = (s) => (s.match(/\b(?:[DQPRG]\d{1,2}|[AB]-\d{1,2})\b/gi) || []).map((x) => x.toUpperCase());
  const wordsOf = (s) => new Set(s.toLowerCase().match(/[a-zà-ỹ]{4,}/g) || []);
  const tIds = new Set(idsOf(target)); const tWords = wordsOf(target);
  let best = null;
  for (const row of rows) {
    const cells = row.split('|').map((c) => c.trim()); cells.shift(); cells.pop();
    if (cells.length < 2) continue;
    const score = idsOf(cells[0]).filter((i) => tIds.has(i)).length * 5 + [...wordsOf(cells[0])].filter((w) => tWords.has(w)).length;
    if (score > 0 && (!best || score > best.score)) best = { score, row_label: cells[0], agents: cells[1].split(',').map((a) => 'wander-' + a.trim()).filter((a) => ALLOWED_AGENTS.includes(a)), add_only_if: cells[2] || '' };
  }
  return best ? { matched: best.row_label, round1_agents: best.agents, add_only_if: best.add_only_if, score: best.score, note: 'hint only; the orchestrator confirms with a one-line justification' } : { matched: null, note: 'no routing row matched; justify a minimal set explicitly' };
}
C['route-hint'] = ({ opt }) => out({ ok: true, ...routeHint(typeof opt.target === 'string' ? opt.target : '') });

// ---------- cite-check ----------
function citeIssues(files, plan) {
  const issues = [];
  for (const rel of files) {
    const text = L.readText(rel);
    const clean = text.replace(/```json autopilot-decisions[\s\S]*?```/g, ' ').replace(/\bDRAFT-\d+\b|\bDR-\d+\b/g, ' ');
    const ids = new Set(clean.match(/\b(?:[DQPRG]\d{1,2}|[AB]-\d{1,2})\b/g) || []);
    for (const id of ids) if (!plan.ids.has(id)) issues.push({ file: rel, kind: 'id', ref: id });
    for (const m of clean.matchAll(/§\s?(\d+(?:\.\d+)*)/g)) if (!plan.headings.has(m[1])) issues.push({ file: rel, kind: 'section', ref: `§${m[1]}` });
  }
  return { issues };
}
C['cite-check'] = ({ pos, opt }) => {
  const plan = L.planInfo(); const files = (pos.length ? pos : csv(opt.files)).map((p) => L.relFromRoot(p)).filter(Boolean).filter(L.exists);
  const r = citeIssues(files, plan);
  out({ ok: !r.issues.length, files, issues: r.issues, note: 'unknown IDs/sections must be removed or marked UNVERIFIED' }, r.issues.length ? 3 : 0);
};

// ---------- diff ----------
function runDiff(cp) {
  const d = L.diffManifest(cp.baseline.manifest, L.manifest());
  return { ...d, outside_scope: [...d.added, ...d.removed, ...d.modified].filter((p) => !L.isUnder(p, AP_DIR)), git: gitInfo() };
}
C.diff = ({ opt }) => { const cp = mustCp(opt); out({ ok: true, run_id: cp.run_id, ...runDiff(cp) }); };

// ---------- resume ----------
C.resume = ({ opt }) => {
  const id = typeof opt.run === 'string' ? opt.run : currentRunId({}); if (!id) refuse('NO_RUN', 'nothing to resume');
  const cp = L.loadCheckpoint(id); if (!cp) refuse('NO_CHECKPOINT', `checkpoint for ${id} missing or unreadable (do not guess; start a new run with init).`);
  if (cp.status === 'complete' || cp.status === 'aborted') out({ ok: true, run_id: id, status: cp.status, note: 'run is closed; nothing to resume. Start a new run with init if the target changed.' });
  const lease = L.loadLease();
  if (lease.state === 'active' && lease.lease.run_id !== id) refuse('LEASE_OTHER_RUN', `run ${lease.lease.run_id} holds the lease`);
  if (cp.resume.count >= cp.limits.max_resumes) refuse('STOP_RESUME_LIMIT', `already resumed ${cp.resume.count} times`);
  const plan = L.planInfo();
  const hard = [];
  if (!plan || plan.sha !== cp.baseline.plan_sha256) hard.push({ code: 'STOP_PLAN_CHANGED', detail: `plan hash ${plan ? plan.sha.slice(0, 12) : 'missing'}… != baseline ${cp.baseline.plan_sha256.slice(0, 12)}…. Statuses may have changed, so earlier results are not trustworthy. Start a new run (init) after you re-verify the registry.` });
  const gNow = gitInfo(); const gBase = cp.baseline.git;
  const git = { present: gNow.present, head_changed: !!(gBase.present && gNow.present && gBase.head !== gNow.head) };
  if (!gBase.present && gNow.present) git.note = 'a .git directory appeared after the run started';
  const staleIds = new Set(); const reasons = {};
  const cur = (p) => (L.exists(p) ? L.sha256File(L.abs(p)) : null);
  for (const s of cp.stages) {
    if (s.status !== 'done') continue;
    for (const [p, h] of Object.entries(s.inputs || {})) if (cur(p) !== h) { staleIds.add(s.id); (reasons[s.id] ||= []).push(`input changed: ${p}`); }
    for (const [p, h] of Object.entries(s.outputs || {})) if (cur(p) !== h) { staleIds.add(s.id); (reasons[s.id] ||= []).push(`output ${cur(p) ? 'modified' : 'missing'}: ${p}`); }
  }
  // reviewer-context / policy files (CLAUDE.md, rules, agents, wander-review skill, authorizations) shape every finding: any change invalidates all finished stages except preflight.
  const wNow = L.watchedSet(); const wBase = cp.baseline.watched || {};
  const changedW = [...new Set([...Object.keys(wNow), ...Object.keys(wBase)])].filter((k) => k !== PLAN && wNow[k] !== wBase[k]);
  const isCtx = (p) => p === 'CLAUDE.md' || p === L.AUTH || /^\.claude\/(rules|agents)\//.test(p) || p.startsWith('.claude/skills/wander-review/');
  const ctxChanged = changedW.filter(isCtx); const toolingChanged = changedW.filter((p) => !isCtx(p));
  if (ctxChanged.length) for (const s of cp.stages) {
    if (s.id === 'preflight') continue;
    if (s.status === 'done') { staleIds.add(s.id); (reasons[s.id] ||= []).push(`review context changed: ${ctxChanged.join(', ')}`); }
    else if (s.status === 'skipped') { s.status = 'pending'; s.note = null; }
  }
  const pfNow = preflightChecks().filter((c) => c.status === 'FAIL');
  if (pfNow.length) hard.push({ code: 'STOP_PREFLIGHT_FAILED', detail: `current configuration fails: ${pfNow.map((c) => c.id).join(', ')}` });
  cp.baseline.watched = wNow; // acknowledged: later resumes compare against the state this resume validated
  let grew = true;
  while (grew) { grew = false; for (const s of cp.stages) if (!staleIds.has(s.id) && s.deps.some((d) => staleIds.has(d)) && ['done', 'skipped', 'running'].includes(s.status)) { staleIds.add(s.id); (reasons[s.id] ||= []).push('upstream stage is stale'); grew = true; } }
  for (const s of cp.stages) {
    if (staleIds.has(s.id)) { s.status = 'stale'; s.attempts = 0; s.finished = null; }
    else if (s.status === 'running') { s.status = 'failed'; s.note = 'interrupted before completion (resume)'; }
  }
  // an open round stays open across a resume: re-dispatch only agents that have no saved report (hook enforces; dispatch budget still applies)
  const d = runDiff(cp);
  const drift = [...d.added, ...d.removed, ...d.modified].filter((p) => !L.isUnder(p, AP_DIR));
  cp.resume.count++; cp.resume.history.push({ at: L.nowIso(), stale: [...staleIds], hard: hard.map((h) => h.code), git_head_changed: git.head_changed });
  if (hard.length) { cp.status = 'blocked'; L.saveCheckpoint(cp); out({ ok: false, run_id: id, hard_stop: hard, stale: [...staleIds], reasons, drift_outside_autopilot: drift, review_context_changed: ctxChanged, tooling_changed: toolingChanged, git }, 4); }
  cp.status = 'running'; L.saveCheckpoint(cp);
  L.writeJsonAtomic(LEASE, { run_id: id, started: L.nowIso(), expires: new Date(Date.now() + cp.limits.lease_hours * 3600e3).toISOString(), executor: cp.executor });
  out({ ok: true, run_id: id, reuse: cp.stages.filter((s) => ['done', 'skipped'].includes(s.status)).map((s) => s.id), redo: cp.stages.filter((s) => ['stale', 'failed'].includes(s.status)).map((s) => ({ id: s.id, why: reasons[s.id] || [s.note] })), drift_outside_autopilot: drift, review_context_changed: ctxChanged, tooling_changed: toolingChanged, git, resumes: cp.resume.count, next: nextInfo(cp) });
};

// ---------- validate ----------
function runValidation(cp) {
  const res = []; const add = (id, status, msg) => res.push({ id, status, msg });
  const plan = L.planInfo();
  const runRel = L.runDir(cp.run_id);
  const runFiles = L.walk(runRel).filter((p) => /\.md$/.test(p));
  const reportRel = `${runRel}/report.md`;
  add('plan_unchanged', plan && plan.sha === cp.baseline.plan_sha256 ? 'PASS' : 'FAIL', plan ? `plan sha256 ${plan.sha === cp.baseline.plan_sha256 ? 'equals' : 'DIFFERS from'} the run baseline` : 'plan missing');
  const d = runDiff(cp);
  const auth = L.authorizations(); const allowed = new Set((auth.doc_write_allow || []).map((e) => e.path));
  const all = [...d.added, ...d.modified, ...d.removed];
  const bad = d.outside_scope.filter((p) => !allowed.has(p)); const authTouched = all.filter((p) => p === L.AUTH);
  add('write_scope', bad.length || authTouched.length ? 'FAIL' : 'PASS', bad.length || authTouched.length ? `changed outside ${AP_DIR}/ (or authorizations.json touched): ${[...bad, ...authTouched].join(', ')}` : `${all.length} change(s), all inside ${AP_DIR}/ (plan and product code untouched)`);
  const disp = L.dispatchesOf(cp.run_id); const lim = cp.limits; const lp = [];
  if (cp.rounds.history.length > lim.max_review_rounds) lp.push(`rounds ${cp.rounds.history.length}`);
  if (disp.length > lim.max_agent_dispatches) lp.push(`dispatches ${disp.length}`);
  if (cp.stages.some((s) => s.attempts > lim.max_stage_attempts)) lp.push('stage attempts');
  add('limits', lp.length ? 'FAIL' : 'PASS', lp.length ? `exceeded: ${lp.join(', ')}` : `rounds ${cp.rounds.history.length}/${lim.max_review_rounds}, dispatches ${disp.length}/${lim.max_agent_dispatches}, resumes ${cp.resume.count}/${lim.max_resumes}`);
  const unfinished = cp.stages.filter((s) => !['done', 'skipped'].includes(s.status) && s.id !== 'validate');
  const noReason = unfinished.filter((s) => s.status !== 'blocked' || !s.blocker);
  add('stages_complete', noReason.length ? 'FAIL' : unfinished.length ? 'WARN' : 'PASS', noReason.length ? `unfinished without a recorded blocker: ${noReason.map((s) => s.id).join(', ')}` : unfinished.length ? `blocked with blocker: ${unfinished.map((s) => `${s.id} (${s.blocker})`).join('; ')}` : 'all stages done or skipped');
  const integ = [];
  for (const s of cp.stages) if (s.status === 'done') for (const [p, h] of Object.entries(s.outputs || {})) { if (p === reportRel) continue; const cur = L.exists(p) ? L.sha256File(L.abs(p)) : null; if (cur !== h) integ.push(`${s.id}:${p}`); }
  add('outputs_integrity', integ.length ? 'FAIL' : 'PASS', integ.length ? `outputs changed after stage completion: ${integ.join(', ')}` : 'recorded output hashes match');
  const cite = citeIssues(runFiles, plan);
  add('id_references', cite.issues.length ? 'FAIL' : 'PASS', cite.issues.length ? `unknown refs: ${cite.issues.map((i) => `${i.ref} in ${i.file}`).join('; ')}` : `${runFiles.length} markdown file(s): every D/Q/P/R/G/A/B ID and § section exists in the plan`);
  const missingPaths = [];
  for (const f of runFiles) for (const m of L.readText(f).matchAll(/`((?:docs|\.claude)\/[A-Za-z0-9_./-]+|CLAUDE\.md)`/g)) { const p = m[1]; if (/\*|<|>|\.\.\./.test(p)) continue; if (!L.exists(p.replace(/\/$/, ''))) missingPaths.push(`${p} (in ${f})`); }
  add('path_references', missingPaths.length ? 'FAIL' : 'PASS', missingPaths.length ? `paths that do not exist: ${[...new Set(missingPaths)].join('; ')}` : 'backticked repo paths exist');
  let block = null; let blockErr = null; let rep = null;
  if (L.exists(reportRel)) { rep = L.readText(reportRel); const m = rep.match(/```json autopilot-decisions\s*([\s\S]*?)```/); if (!m) blockErr = 'no ```json autopilot-decisions block in report.md'; else { try { block = JSON.parse(m[1]); } catch (e) { blockErr = `invalid JSON in decisions block: ${e.message}`; } } } else blockErr = 'report.md missing';
  const dErr = []; const quoteErr = [];
  if (block) {
    if (!Array.isArray(block)) dErr.push('block must be an array');
    else {
      const corpus = norm_(plan.text) + ' ' + runFiles.filter((f) => f !== reportRel).map((f) => norm_(L.readText(f))).join(' ');
      for (const e of block) {
        if (!e || typeof e.id !== 'string' || !TOKENS.includes(e.status)) { dErr.push(`bad entry ${JSON.stringify(e)}`); continue; }
        const { id, status } = e;
        const planId = /^(D|Q|P|R|G)\d+$|^[AB]-\d+$/.test(id); const draftId = /^(DR|DRAFT)-\d+$/.test(id);
        if (!planId && !draftId) { dErr.push(`${id}: unrecognised id form`); continue; }
        if (planId && !plan.ids.has(id)) dErr.push(`${id}: not in plan`);
        if (/^D\d+$/.test(id)) { if (!plan.approvedD.has(id)) dErr.push(`${id}: not an approved decision in §14.1`); else if (status !== 'APPROVED') dErr.push(`${id}: approved decision must stay APPROVED (got ${status})`); }
        else if (status === 'APPROVED') dErr.push(`${id}: only plan D-decisions may be APPROVED (silent promotion)`);
        else if (/^Q\d+$/.test(id) && plan.openQ.has(id) && status === 'PROPOSED') dErr.push(`${id}: an OPEN question cannot be PROPOSED; record the recommendation as a separate DRAFT-n entry`);
        else if (/^P\d+$/.test(id) && !plan.proposedP.has(id)) dErr.push(`${id}: not a proposal in §14.2`);
        if (status === 'CONTRADICTION' && (!Array.isArray(e.quotes) || e.quotes.length < 2)) dErr.push(`${id}: CONTRADICTION needs 2 verbatim quotes`);
        for (const q of e.quotes || []) if (!corpus.includes(norm_(String(q)))) quoteErr.push(`${id}: quote not found verbatim: "${String(q).slice(0, 60)}"`);
      }
    }
  }
  add('decisions_block', blockErr || dErr.length ? 'FAIL' : 'PASS', blockErr || (dErr.length ? dErr.join('; ') : `${block.length} entr${block.length === 1 ? 'y' : 'ies'} checked against §14.1/§14.2/§15: no promotion, approved decisions preserved`));
  add('quotes_verbatim', quoteErr.length ? 'FAIL' : 'PASS', quoteErr.length ? quoteErr.join('; ') : 'every quoted evidence string appears verbatim in the plan or a saved report');
  const ev = []; const srcs = new Set(disp.map((e) => e.source));
  const agentFiles = L.walk(`${runRel}/agents`).filter((p) => /-r\d+\.md$/.test(p));
  for (const f of agentFiles) { const m = f.match(/agents\/(.+)-r(\d+)\.md$/); if (m && !disp.some((e) => e.agent === m[1] && e.round === Number(m[2]))) ev.push(`${f} has no logged dispatch`); }
  const emul = srcs.has('emulated') || cp.executor === 'emulated';
  add('dispatch_evidence', ev.length ? 'FAIL' : emul ? 'WARN' : disp.length ? 'PASS' : 'WARN', ev.length ? ev.join('; ') : emul ? 'UNVERIFIED: dispatches are logged as "emulated" (stand-in subagents, NOT the registered wander-* agents)' : disp.length ? `${disp.length} dispatch(es) logged by the PreToolUse hook: ${disp.map((e) => `r${e.round}:${e.agent}`).join(', ')}` : 'no dispatches in this run');
  const need = [[/^##\s+.*Công việc đã hoàn thành/m, 'Công việc đã hoàn thành'], [/^##\s+.*Quyết định chưa giải quyết/m, 'Quyết định chưa giải quyết'], [/^##\s+.*File đã thay đổi/m, 'File đã thay đổi'], [/^##\s+.*Kết quả kiểm tra/m, 'Kết quả kiểm tra'], [/^##\s+.*Ranh giới/m, 'Ranh giới'], [/autopilot:files:start/, 'marker files'], [/autopilot:validation:start/, 'marker validation']];
  const miss = rep ? need.filter(([re]) => !re.test(rep)).map(([, n]) => n) : ['report.md'];
  add('report_sections', miss.length ? 'FAIL' : 'PASS', miss.length ? `missing: ${miss.join(', ')}` : 'all required sections and markers present');
  const gf = preflightChecks().filter((c) => ['settings_plan_deny', 'settings_guard_hook', 'guard_selftest', 'agents_read_only'].includes(c.id) && c.status === 'FAIL');
  add('guard_config', gf.length ? 'FAIL' : 'PASS', gf.length ? gf.map((c) => c.id).join(', ') : 'plan deny + guard hook configured; guard self-test passes; agents read-only');
  const acceptance = cp.acceptance.map((a) => { const rs = a.checks.map((c) => res.find((r) => r.id === c)?.status || 'MISSING'); return { id: a.id, text: a.text, result: rs.includes('FAIL') || rs.includes('MISSING') ? 'FAIL' : rs.includes('WARN') ? 'PASS_WITH_WARNINGS' : 'PASS' }; });
  const overall = res.some((r) => r.status === 'FAIL') ? 'FAIL' : res.some((r) => r.status === 'WARN') ? 'PASS_WITH_WARNINGS' : 'PASS';
  return { overall, checks: res, acceptance, diff: { added: d.added, modified: d.modified, removed: d.removed, outside_scope: d.outside_scope, git: d.git }, at: L.nowIso() };
}
C.validate = ({ opt }) => {
  const cp = mustCp(opt); const v = runValidation(cp);
  const rel = `${L.runDir(cp.run_id)}/validation.json`; L.writeJsonAtomic(rel, v);
  const s = cp.stages.find((x) => x.id === 'validate');
  if (s.status === 'running') {
    if (v.overall === 'FAIL') { s.status = 'failed'; s.note = v.checks.filter((c) => c.status === 'FAIL').map((c) => c.id).join(','); }
    else { s.status = 'done'; s.finished = L.nowIso(); s.attempts = 0; s.inputs = { [PLAN]: L.sha256File(L.abs(PLAN)) }; s.outputs = {}; /* validation.json is rewritten by every validate/close; it is derived, so it is not hash-locked */ s.note = v.overall; }
    L.saveCheckpoint(cp);
  }
  out({ ok: v.overall !== 'FAIL', overall: v.overall, checks: v.checks, acceptance: v.acceptance, validation_file: rel }, v.overall === 'FAIL' ? 3 : 0);
};

// ---------- close ----------
function replaceBlock(text, name, body) {
  const re = new RegExp(`(<!-- autopilot:${name}:start -->)[\\s\\S]*?(<!-- autopilot:${name}:end -->)`);
  return re.test(text) ? text.replace(re, (_m, a, b) => `${a}\n${body}\n${b}`) : text;
}
C.close = ({ opt }) => {
  const cp = mustCp(opt); const outcome = opt.outcome;
  if (!['complete', 'blocked', 'aborted'].includes(outcome)) refuse('USAGE', 'close --outcome complete|blocked|aborted');
  if (outcome === 'aborted') { cp.status = 'aborted'; L.saveCheckpoint(cp); try { fs.unlinkSync(L.abs(LEASE)); } catch { /* none */ } out({ ok: true, status: 'aborted' }); }
  const open = cp.rounds.history.find((r) => r.closed == null);
  if (open) refuse('ROUND_OPEN', `round ${open.n} is still open (\`round close --n ${open.n}\`)`);
  if (outcome === 'complete' && !cp.stages.filter((s) => !s.optional).every((s) => s.status === 'done')) refuse('STAGES_INCOMPLETE', 'outcome complete needs every non-optional stage done; use --outcome blocked and record blockers');
  const v = runValidation(cp);
  const reportRel = `${L.runDir(cp.run_id)}/report.md`; const d = v.diff;
  const filesBody = [`Cơ sở so sánh: ${cp.baseline.git.present ? 'Git (xem thêm `git status`)' : 'bảng băm sha256 của toàn bộ file dự án lúc bắt đầu (thư mục này không có Git)'}.`, '', ...d.added.map((p) => `- thêm: \`${p}\``), ...d.modified.map((p) => `- sửa: \`${p}\``), ...d.removed.map((p) => `- xóa: \`${p}\``), `- thêm: \`${L.runDir(cp.run_id)}/\` (checkpoint, báo cáo, bằng chứng của lần chạy này)`, '', `Ngoài \`${AP_DIR}/\`: ${d.outside_scope.length ? d.outside_scope.map((p) => `\`${p}\``).join(', ') : 'không có (mã sản phẩm và kế hoạch tổng thể không bị chạm)'}.`].join('\n');
  const valBody = [`Tổng: **${v.overall}** (lúc ${v.at})`, '', '| Kiểm tra | Kết quả | Chi tiết |', '|---|---|---|', ...v.checks.map((c) => `| ${c.id} | ${c.status} | ${String(c.msg).replace(/\|/g, '\\|')} |`), '', '| Tiêu chí nghiệm thu | Kết quả |', '|---|---|', ...v.acceptance.map((a) => `| ${a.id} ${a.text} | ${a.result} |`)].join('\n');
  if (L.exists(reportRel)) {
    let t = L.readText(reportRel); t = replaceBlock(t, 'files', filesBody); t = replaceBlock(t, 'validation', valBody);
    fs.writeFileSync(L.abs(reportRel), t);
    const rs = cp.stages.find((s) => s.id === 'report'); if (rs?.outputs && rs.outputs[reportRel]) rs.outputs[reportRel] = L.sha256File(L.abs(reportRel));
  }
  L.writeJsonAtomic(`${L.runDir(cp.run_id)}/validation.json`, v);
  if (outcome === 'complete' && v.overall === 'FAIL') { L.saveCheckpoint(cp); refuse('VALIDATION_FAILED', 'cannot close as complete; fix the FAIL checks or close as blocked', { checks: v.checks.filter((c) => c.status === 'FAIL') }); }
  cp.status = outcome === 'complete' ? 'complete' : 'blocked'; cp.closed = L.nowIso(); cp.final_validation = v.overall;
  L.saveCheckpoint(cp);
  if (L.loadLease().lease?.run_id === cp.run_id) try { fs.unlinkSync(L.abs(LEASE)); } catch { /* none */ }
  out({ ok: true, status: cp.status, validation: v.overall, report: reportRel, files_changed: { added: d.added.length, modified: d.modified.length, removed: d.removed.length } });
};

// ---------- main ----------
const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || !C[cmd]) out({ ok: false, usage: `node ${L.CLI_REL} <${Object.keys(C).join('|')}> [options]` }, 1);
try { C[cmd](parseArgs(rest)); } catch (e) { out({ ok: false, code: 'INTERNAL', message: String((e && e.stack) || e).slice(0, 600) }, 1); }
