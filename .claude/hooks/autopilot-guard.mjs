// PreToolUse guard for Wander planning runs. Deterministic, dependency-free, fail-closed.
// It can only RESTRICT: it never grants permission (exit 0 falls through to the normal permission system).
// Always on:    master plan is read-only (Write/Edit/MultiEdit/NotebookEdit and write-capable shell commands).
// During a run: (.claude/autopilot/ACTIVE.json lease is valid) writes limited to .claude/autopilot/, shell limited to the
//               autopilot CLI, subagents limited to the 4 wander reviewers with round/dispatch limits.
import fs from 'node:fs';
import { evaluate, loadLease, appendLine, runDir, nowIso } from '../scripts/autopilot-lib.mjs';

function readStdin() { try { return fs.readFileSync(0, 'utf8'); } catch { return ''; } }
function block(reason) { process.stderr.write(reason + '\n'); process.exit(2); }

let input;
try {
  const raw = readStdin();
  input = JSON.parse(raw);
} catch (e) {
  block('GUARD:BAD_INPUT could not parse hook input; failing closed.');
}
try {
  const r = evaluate(input);
  if (r.decision === 'deny') {
    const lease = loadLease();
    if (lease.state === 'active' && !process.env.WANDER_GUARD_SELFTEST) { // self-tests must not count as run denials
      try { appendLine(`${runDir(lease.lease.run_id)}/denials.log`, JSON.stringify({ ts: nowIso(), tool: input.tool_name, code: r.reason.split(' ')[0], session_id: input.session_id || null })); } catch { /* logging must not mask the denial */ }
    }
    block(r.reason);
  }
  if (r.log) {
    appendLine(`${runDir(r.log.run_id)}/dispatch.log`, JSON.stringify({ ts: nowIso(), run_id: r.log.run_id, round: r.log.round, agent: r.log.agent, source: 'hook', session_id: input.session_id || null, tool_use_id: input.tool_use_id || null }));
  }
  process.exit(0);
} catch (e) {
  block(`GUARD:INTERNAL_ERROR ${String(e && e.message || e).slice(0, 200)}; failing closed.`);
}
