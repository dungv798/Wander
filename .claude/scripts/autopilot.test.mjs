// Run: node --test .claude/scripts/autopilot.test.mjs
// Each test works on a throw-away copy of the project, never on the real .claude/autopilot state.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REAL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Only what the autopilot reads or watches: copying the whole project (gigabytes of local data) filled the disk. */
const SANDBOX_FILES = ['.claude', 'CLAUDE.md', 'docs/wander-master-plan.md', 'docs/agent-system.md'];
const sandboxes = [];
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wander-ap-'));
  sandboxes.push(dir);
  for (const rel of SANDBOX_FILES) {
    const from = path.join(REAL, rel);
    if (!fs.existsSync(from)) continue;
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.cpSync(from, path.join(dir, rel), { recursive: true, filter: (s) => !/\.claude[\\/]autopilot[\\/](runs|ACTIVE\.json)/.test(s) });
  }
  return dir;
}
after(() => { for (const dir of sandboxes) fs.rmSync(dir, { recursive: true, force: true }); });
const cli = (dir, ...args) => { const r = spawnSync(process.execPath, [path.join(dir, '.claude/scripts/autopilot.mjs'), ...args], { cwd: dir, encoding: 'utf8' }); let j = null; try { j = JSON.parse(r.stdout); } catch { /* */ } return { code: r.status, json: j, err: r.stderr }; };
const guard = (dir, payload) => { const r = spawnSync(process.execPath, [path.join(dir, '.claude/hooks/autopilot-guard.mjs')], { cwd: dir, input: typeof payload === 'string' ? payload : JSON.stringify({ cwd: dir, ...payload }), encoding: 'utf8' }); return { code: r.status, err: r.stderr }; };
const w = (dir, rel, txt) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), txt); };
const PLAN = 'docs/wander-master-plan.md';

test('guard: master plan is protected without any run', () => {
  const d = sandbox();
  for (const t of ['Edit', 'Write', 'MultiEdit', 'NotebookEdit']) assert.equal(guard(d, { tool_name: t, tool_input: { file_path: PLAN } }).code, 2, t);
  assert.equal(guard(d, { tool_name: 'Write', tool_input: { file_path: 'docs/../docs/Wander-Master-Plan.md' } }).code, 2);
  assert.equal(guard(d, { tool_name: 'Write', tool_input: { file_path: path.join(d, PLAN) } }).code, 2);
  assert.equal(guard(d, { tool_name: 'Bash', tool_input: { command: 'echo x >> docs/wander-master-plan.md' } }).code, 2);
  assert.equal(guard(d, { tool_name: 'Bash', tool_input: { command: 'sed -i s/a/b/ docs/wander-master-plan.md' } }).code, 2);
  assert.equal(guard(d, { tool_name: 'Bash', tool_input: { command: 'sha256sum docs/wander-master-plan.md' } }).code, 0);
  assert.equal(guard(d, { tool_name: 'Write', tool_input: { file_path: 'docs/notes.md' } }).code, 0, 'no run: other files unrestricted');
  assert.equal(guard(d, 'not json').code, 2, 'fails closed on garbage');
  assert.equal(guard(d, { tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose' } }).code, 0, 'no run: agents unrestricted');
});

test('dry-run writes nothing and routes Q16', () => {
  const d = sandbox(); const before = fs.existsSync(path.join(d, '.claude/autopilot/runs'));
  const r = cli(d, 'dry-run', '--target', 'Q16 auth and recovery');
  assert.equal(r.code, 0); assert.equal(r.json.wrote_files, false);
  assert.deepEqual(r.json.route_hint.round1_agents.sort(), ['wander-security-reviewer', 'wander-skeptic-qa', 'wander-software-architect']);
  assert.ok(r.json.registry.open_questions.includes('Q16')); assert.ok(r.json.registry.approved_decisions.includes('D15'));
  assert.equal(fs.existsSync(path.join(d, '.claude/autopilot/runs')), before); assert.equal(fs.existsSync(path.join(d, '.claude/autopilot/ACTIVE.json')), false);
});

test('state machine: order, retry limit, round limit, single lease', () => {
  const d = sandbox();
  const init = cli(d, 'init', '--target', 'Q16 test', '--executor', 'emulated', '--run-id', 't1'); assert.equal(init.code, 0, JSON.stringify(init.json));
  assert.equal(cli(d, 'init', '--target', 'another').json.code, 'LEASE_ACTIVE');
  assert.equal(cli(d, 'stage', 'start', 'scope').json.code, 'DEPS_NOT_DONE');
  assert.equal(cli(d, 'stage', 'start', 'preflight').code, 0);
  assert.equal(cli(d, 'preflight').code, 0);
  assert.equal(cli(d, 'next').json.denials, 0, 'guard self-test inside preflight must not count as a run denial');
  cli(d, 'stage', 'start', 'scope'); cli(d, 'stage', 'fail', 'scope', '--reason', 'x');
  cli(d, 'stage', 'start', 'scope'); cli(d, 'stage', 'fail', 'scope', '--reason', 'y');
  const third = cli(d, 'stage', 'start', 'scope'); assert.equal(third.json.code, 'STOP_RETRY_LIMIT'); assert.equal(third.code, 3);
  assert.equal(cli(d, 'status').json.stages.find((s) => s.id === 'scope').status, 'blocked');
  assert.equal(cli(d, 'next').json.stop, 'STOP_BLOCKER');
  cli(d, 'close', '--outcome', 'aborted');
  cli(d, 'init', '--target', 'Q16 rounds', '--executor', 'emulated', '--run-id', 't2');
  const done = (id) => { cli(d, 'stage', 'start', id); const r = cli(d, 'stage', 'done', id, '--inputs', PLAN); assert.equal(r.code, 0, JSON.stringify(r.json)); };
  cli(d, 'stage', 'start', 'preflight'); cli(d, 'preflight'); done('scope'); done('route');
  cli(d, 'stage', 'start', 'review-r1');
  assert.equal(cli(d, 'round', 'open', '--n', '1', '--agents', 'wander-skeptic-qa,general-purpose').json.code, 'BAD_AGENTS');
  assert.equal(cli(d, 'round', 'open', '--n', '1', '--agents', 'wander-skeptic-qa,wander-security-reviewer').code, 0);
  assert.equal(cli(d, 'round', 'close', '--n', '1').json.code, 'ROUND_INCOMPLETE');
  for (const a of ['wander-skeptic-qa', 'wander-security-reviewer']) { assert.equal(cli(d, 'dispatch-manual', '--agent', a).code, 0); w(d, `.claude/autopilot/runs/t2/agents/${a}-r1.md`, `report ${a}`); }
  assert.equal(cli(d, 'dispatch-manual', '--agent', 'wander-skeptic-qa').json.code, 'DUPLICATE_DISPATCH');
  assert.equal(cli(d, 'round', 'close', '--n', '1').code, 0);
  assert.equal(cli(d, 'round', 'open', '--n', '3', '--agents', 'wander-skeptic-qa').json.code, 'STOP_ROUND_LIMIT');
});

test('active-run guard: write scope, bash scope, agent rules', () => {
  const d = sandbox();
  cli(d, 'init', '--target', 'Q16 guard', '--run-id', 'g1');
  const p = (id) => { cli(d, 'stage', 'start', id); return cli(d, 'stage', 'done', id, '--inputs', PLAN); };
  cli(d, 'stage', 'start', 'preflight'); cli(d, 'preflight'); p('scope'); p('route'); cli(d, 'stage', 'start', 'review-r1');
  const ok = (p) => assert.equal(guard(d, p).code, 0, JSON.stringify(p)); const no = (p) => assert.equal(guard(d, p).code, 2, JSON.stringify(p));
  ok({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/runs/g1/stages/scope.md' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/runs/g1/checkpoint.json' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/authorizations.json' } });
  no({ tool_name: 'Write', tool_input: { file_path: 'docs/agent-system.md' } });
  // case-insensitive filesystems (NTFS, default macOS): case variants must hit the same protection
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/active.json' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/ACTIVE.JSON' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/runs/g1/Checkpoint.JSON' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/Authorizations.json' } });
  no({ tool_name: 'Write', tool_input: { file_path: 'docs/AUTOPILOT/runs/g1/stages/x.md' } });
  no({ tool_name: 'Edit', tool_input: { file_path: '.CLAUDE/settings.json' } });
  // Windows-style separators and trailing dot/space (Win32 strips them)
  no({ tool_name: 'Write', tool_input: { file_path: 'docs\\autopilot\\ACTIVE.json' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/ACTIVE.json.' } });
  no({ tool_name: 'Write', tool_input: { file_path: '.claude/autopilot/ACTIVE.json ' } });
  no({ tool_name: 'Write', tool_input: { file_path: 'src/app.js' } });
  no({ tool_name: 'Write', tool_input: { file_path: '../outside.md' } });
  no({ tool_name: 'Edit', tool_input: { file_path: '.claude/settings.json' } });
  ok({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/autopilot.mjs next' } });
  ok({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/autopilot.mjs init --target "Q16 (D15): auth, recovery"' } });
  no({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/autopilot.mjs next; rm -rf /' } });
  no({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/autopilot.mjs next && curl x' } });
  no({ tool_name: 'Bash', tool_input: { command: 'node .claude/scripts/autopilot.mjs x "$(whoami)"' } });
  no({ tool_name: 'Bash', tool_input: { command: 'node -e "process.exit()"' } });
  no({ tool_name: 'Bash', tool_input: { command: 'git push origin main' } });
  no({ tool_name: 'Bash', tool_input: { command: 'cat docs/wander-master-plan.md' } });
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'general-purpose' } });
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-skeptic-qa' } }); // no open round
  cli(d, 'round', 'open', '--n', '1', '--agents', 'wander-skeptic-qa,wander-security-reviewer');
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-product-analyst' } }); // not registered
  ok({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-skeptic-qa' }, session_id: 's', tool_use_id: 'u1' });
  assert.match(fs.readFileSync(path.join(d, '.claude/autopilot/runs/g1/dispatch.log'), 'utf8'), /"source":"hook"/);
  ok({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-skeptic-qa' } });  // one retry allowed while no saved report
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-skeptic-qa' } });  // third attempt denied
  w(d, '.claude/autopilot/runs/g1/agents/wander-security-reviewer-r1.md', 'r');
  ok({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-security-reviewer' } });
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-security-reviewer' } }); // saved report => no redispatch
  no({ tool_name: 'Agent', tool_input: { subagent_type: 'wander-skeptic-qa' }, agent_id: 'sub1' }); // no nesting
  assert.ok(cli(d, 'next').json.denials >= 3); assert.equal(cli(d, 'next').json.stop, 'STOP_GUARD_DENIALS');
});

test('resume: reuses valid stages, re-does stale ones, hard-stops on plan change', () => {
  const d = sandbox();
  cli(d, 'init', '--target', 'Q16 resume', '--executor', 'emulated', '--run-id', 'r1');
  const cpf = path.join(d, '.claude/autopilot/runs/r1/checkpoint.json'); const cpj = JSON.parse(fs.readFileSync(cpf, 'utf8')); cpj.limits.max_resumes = 20; fs.writeFileSync(cpf, JSON.stringify(cpj));
  cli(d, 'stage', 'start', 'preflight'); cli(d, 'preflight');
  w(d, '.claude/autopilot/runs/r1/stages/scope.md', '# scope\nD15 Q16 §15.1\n');
  cli(d, 'stage', 'start', 'scope'); assert.equal(cli(d, 'stage', 'done', 'scope', '--inputs', PLAN, '--outputs', '.claude/autopilot/runs/r1/stages/scope.md').code, 0);
  cli(d, 'stage', 'start', 'route'); cli(d, 'stage', 'fail', 'route', '--reason', 'interrupted');
  let r = cli(d, 'resume'); assert.equal(r.code, 0, JSON.stringify(r.json));
  assert.deepEqual(r.json.reuse, ['preflight', 'scope']); assert.ok(r.json.redo.some((x) => x.id === 'route'));
  fs.appendFileSync(path.join(d, '.claude/autopilot/runs/r1/stages/scope.md'), 'edited\n');
  r = cli(d, 'resume'); assert.ok(r.json.redo.some((x) => x.id === 'scope' && /output modified/.test(x.why.join())));
  assert.deepEqual(r.json.reuse, ['preflight']);
  w(d, 'docs/unrelated.md', 'x'); r = cli(d, 'resume'); assert.ok(r.json.drift_outside_autopilot.includes('docs/unrelated.md'));
  fs.appendFileSync(path.join(d, '.claude/agents/wander-skeptic-qa.md'), '\n<!-- tweak -->\n');
  r = cli(d, 'resume'); assert.deepEqual(r.json.review_context_changed, ['.claude/agents/wander-skeptic-qa.md']); assert.deepEqual(r.json.reuse, ['preflight'], 'agent definition changed => all reviews/scope must be redone');
  fs.appendFileSync(path.join(d, '.claude/hooks/autopilot-guard.mjs'), '\n// tweak\n');
  r = cli(d, 'resume'); assert.deepEqual(r.json.tooling_changed, ['.claude/hooks/autopilot-guard.mjs']);
  fs.appendFileSync(path.join(d, PLAN), '\n<!-- changed -->\n');
  r = cli(d, 'resume'); assert.equal(r.code, 4); assert.equal(r.json.hard_stop[0].code, 'STOP_PLAN_CHANGED');
  assert.equal(cli(d, 'validate').json.checks.find((c) => c.id === 'plan_unchanged').status, 'FAIL');
});

function minimalRun(d, id, report) {
  cli(d, 'init', '--target', 'Q16 validate', '--executor', 'emulated', '--run-id', id);
  const run = `.claude/autopilot/runs/${id}`;
  cli(d, 'stage', 'start', 'preflight'); cli(d, 'preflight');
  for (const s of ['scope', 'route']) { w(d, `${run}/stages/${s}.md`, `# ${s}\nD15, Q16, §15.1\n`); cli(d, 'stage', 'start', s); cli(d, 'stage', 'done', s, '--inputs', PLAN, '--outputs', `${run}/stages/${s}.md`); }
  cli(d, 'stage', 'start', 'review-r1'); cli(d, 'round', 'open', '--n', '1', '--agents', 'wander-skeptic-qa');
  cli(d, 'dispatch-manual', '--agent', 'wander-skeptic-qa'); w(d, `${run}/agents/wander-skeptic-qa-r1.md`, 'Q16 vẫn OPEN theo §15.1');
  cli(d, 'round', 'close', '--n', '1'); cli(d, 'stage', 'done', 'review-r1', '--outputs', `${run}/agents/wander-skeptic-qa-r1.md`);
  w(d, `${run}/stages/reconcile.md`, '# reconcile\nkhông có bất đồng trọng yếu\n'); cli(d, 'stage', 'start', 'reconcile'); cli(d, 'stage', 'done', 'reconcile', '--outputs', `${run}/stages/reconcile.md`);
  cli(d, 'stage', 'skip', 'review-r2', '--reason', 'không có bất đồng trọng yếu cần vòng 2');
  w(d, `${run}/stages/consolidate.md`, '# consolidate\n'); cli(d, 'stage', 'start', 'consolidate'); cli(d, 'stage', 'done', 'consolidate', '--outputs', `${run}/stages/consolidate.md`);
  cli(d, 'stage', 'skip', 'apply', '--reason', 'không có deliverable cần tạo');
  w(d, `${run}/report.md`, report); cli(d, 'stage', 'start', 'report'); const rr = cli(d, 'stage', 'done', 'report', '--outputs', `${run}/report.md`); assert.equal(rr.code, 0, JSON.stringify(rr.json));
  cli(d, 'stage', 'start', 'validate'); return run;
}
const REPORT = (blockJson) => `# Báo cáo\n## 1. Công việc đã hoàn thành\nx\n## 3. Quyết định chưa giải quyết\n\n\`\`\`json autopilot-decisions\n${blockJson}\n\`\`\`\n## 5. File đã thay đổi\n<!-- autopilot:files:start -->\n<!-- autopilot:files:end -->\n## 6. Kết quả kiểm tra\n<!-- autopilot:validation:start -->\n<!-- autopilot:validation:end -->\n## 8. Ranh giới\nx\n`;

test('validate: rejects silent promotion, unknown ids, downgraded approved decisions', () => {
  const d = sandbox();
  minimalRun(d, 'v1', REPORT('[{"id":"Q16","status":"APPROVED"},{"id":"D15","status":"PROPOSED"},{"id":"P2","status":"APPROVED"},{"id":"Q99","status":"OPEN"},{"id":"Q16","status":"PROPOSED"}]'));
  const v = cli(d, 'validate'); assert.equal(v.code, 3);
  const msg = v.json.checks.find((c) => c.id === 'decisions_block').msg;
  assert.match(msg, /Q16: only plan D-decisions may be APPROVED/); assert.match(msg, /D15: approved decision must stay APPROVED/);
  assert.match(msg, /P2: only plan D-decisions/); assert.match(msg, /Q99: not in plan/); assert.match(msg, /OPEN question cannot be PROPOSED/);
});

test('validate: CONTRADICTION needs verbatim quotes from the plan; fabricated quotes fail', () => {
  const d = sandbox();
  minimalRun(d, 'v4', REPORT('[{"id":"DRAFT-1","status":"CONTRADICTION","quotes":["Cơ chế xác thực cụ thể **chưa chốt**","this sentence was invented by the model"]}]'));
  const msg = cli(d, 'validate').json.checks.find((c) => c.id === 'quotes_verbatim').msg;
  assert.match(msg, /invented by the model/); assert.doesNotMatch(msg, /Cơ chế xác thực/);
});

test('validate + close: honest report passes; close writes script-generated blocks and releases lease', () => {
  const d = sandbox();
  const run = minimalRun(d, 'v2', REPORT('[{"id":"D15","status":"APPROVED"},{"id":"Q16","status":"OPEN","source":"§15.1"},{"id":"DRAFT-1","status":"PROPOSED","about":"Q16"}]'));
  const v = cli(d, 'validate'); assert.equal(v.code, 0, JSON.stringify(v.json.checks.filter((c) => c.status === 'FAIL')));
  assert.equal(v.json.checks.find((c) => c.id === 'dispatch_evidence').status, 'WARN', 'emulated dispatches are flagged UNVERIFIED');
  const c = cli(d, 'close', '--outcome', 'complete'); assert.equal(c.code, 0, JSON.stringify(c.json));
  const rep = fs.readFileSync(path.join(d, run, 'report.md'), 'utf8');
  assert.match(rep, /\| plan_unchanged \| PASS/); assert.match(rep, /\.claude\/autopilot\/runs\/v2\//);
  assert.equal(fs.existsSync(path.join(d, '.claude/autopilot/ACTIVE.json')), false);
  assert.equal(guard(d, { tool_name: 'Write', tool_input: { file_path: 'src/a.js' } }).code, 0, 'guard relaxes after close');
  assert.equal(cli(d, 'resume', '--run', 'v2').json.status, 'complete');
  const again = cli(d, 'validate'); assert.notEqual(again.json.overall, 'FAIL', 're-validating a closed run must not fail on its own validation.json: ' + JSON.stringify(again.json.checks.filter((x) => x.status === 'FAIL')));
});

test('validate: write_scope catches product-code and plan changes; close refuses', () => {
  const d = sandbox();
  minimalRun(d, 'v3', REPORT('[{"id":"D15","status":"APPROVED"},{"id":"Q16","status":"OPEN"}]'));
  assert.equal(cli(d, 'validate').code, 0);
  w(d, 'src/app.js', 'console.log(1)'); fs.appendFileSync(path.join(d, PLAN), 'x');
  const v = cli(d, 'validate'); const by = Object.fromEntries(v.json.checks.map((c) => [c.id, c]));
  assert.equal(v.code, 3); assert.equal(by.write_scope.status, 'FAIL'); assert.match(by.write_scope.msg, /src\/app\.js/); assert.equal(by.plan_unchanged.status, 'FAIL');
  assert.equal(cli(d, 'close', '--outcome', 'complete').json.code, 'VALIDATION_FAILED');
  assert.equal(cli(d, 'close', '--outcome', 'blocked').json.status, 'blocked', 'a blocked close is still possible and records the failure');
  assert.equal(cli(d, 'status').json.status, 'blocked');
});

test('close refuses complete while a required stage is unfinished', () => {
  const d = sandbox();
  cli(d, 'init', '--target', 'Q16 early', '--executor', 'emulated', '--run-id', 'e1');
  assert.equal(cli(d, 'close', '--outcome', 'complete').json.code, 'STAGES_INCOMPLETE');
});

test('validate: fabricated section/ID references and missing paths are caught', () => {
  const d = sandbox();
  const run = minimalRun(d, 'v5', REPORT('[{"id":"D15","status":"APPROVED"}]'));
  fs.appendFileSync(path.join(d, run, 'stages/consolidate.md'), 'see Q42, D99 and §99.9 in `docs/does-not-exist.md`\n');
  const v = cli(d, 'validate'); const by = Object.fromEntries(v.json.checks.map((c) => [c.id, c]));
  assert.equal(by.id_references.status, 'FAIL'); assert.match(by.id_references.msg, /Q42/); assert.match(by.id_references.msg, /§99\.9/);
  assert.equal(by.path_references.status, 'FAIL'); assert.equal(by.outputs_integrity.status, 'FAIL', 'edited stage output after completion is detected');
});

test('resume limit: 6th resume is refused', () => {
  const d = sandbox();
  cli(d, 'init', '--target', 'Q16 loop', '--executor', 'emulated', '--run-id', 'rl');
  for (let i = 0; i < 5; i++) assert.equal(cli(d, 'resume').code, 0);
  const r = cli(d, 'resume'); assert.equal(r.code, 3); assert.equal(r.json.code, 'STOP_RESUME_LIMIT');
});

test('amend: re-records a finished output with a logged reason; refuses state files, outside paths, unchanged, unrecorded', () => {
  const d = sandbox();
  cli(d, 'init', '--target', 'Q16 amend', '--run-id', 'am1');
  cli(d, 'stage', 'start', 'preflight'); cli(d, 'preflight'); cli(d, 'stage', 'start', 'scope');
  const f = '.claude/autopilot/runs/am1/stages/scope.md'; w(d, f, 'Q16 scope\n');
  assert.equal(cli(d, 'stage', 'done', 'scope', '--inputs', PLAN, '--outputs', f).code, 0);
  assert.equal(cli(d, 'amend', '--file', f, '--reason', 'unchanged file should be refused').json.code, 'UNCHANGED');
  w(d, f, 'Q16 scope, citation fixed\n');
  assert.equal(cli(d, 'amend', '--file', f, '--reason', 'short').json.code, 'NEED_REASON');
  assert.equal(cli(d, 'amend', '--file', '.claude/autopilot/runs/am1/checkpoint.json', '--reason', 'try to rewrite state file').json.code, 'STATE_FILE');
  assert.equal(cli(d, 'amend', '--file', '.claude/autopilot/runs/am1/Checkpoint.JSON', '--reason', 'case variant of state file').json.code, 'STATE_FILE');
  assert.equal(cli(d, 'amend', '--file', PLAN, '--reason', 'attempt to touch the master plan').json.code, 'OUTSIDE_RUN');
  assert.equal(cli(d, 'amend', '--file', '.claude/autopilot/runs/am1/stages/../../x.md', '--reason', 'path traversal attempt here').json.code, 'OUTSIDE_RUN');
  w(d, '.claude/autopilot/runs/am1/stages/other.md', 'x'); assert.equal(cli(d, 'amend', '--file', '.claude/autopilot/runs/am1/stages/other.md', '--reason', 'file that no stage recorded').json.code, 'NOT_A_RECORDED_OUTPUT');
  const ok = cli(d, 'amend', '--file', f, '--reason', 'fixed a wrong section number in a citation');
  assert.equal(ok.code, 0); assert.equal(ok.json.amendments, 1);
  const cp = JSON.parse(fs.readFileSync(path.join(d, '.claude/autopilot/runs/am1/checkpoint.json'), 'utf8'));
  assert.equal(cp.amendments.length, 1); assert.equal(cp.amendments[0].file, f); assert.notEqual(cp.amendments[0].old_sha256, cp.amendments[0].new_sha256);
  assert.equal(cli(d, 'resume').json.ok, true, 'resume sees no stale output after a logged amendment');
});
