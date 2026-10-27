---
name: wander-verify
description: Run Wander's real checks on the PO's Windows machine (tools/dev.ps1 — doctor, backend tests with Testcontainers, e2e, or the full verify) and report results read from .logs and JUnit XML, never from memory. Use after a code change, before a commit, or when asked "test có xanh không".
argument-hint: "[verify | backend-test | e2e | doctor | tools-check]  (default: backend-test)"
allowed-tools: Read Grep Glob Bash(powershell -NoProfile -ExecutionPolicy Bypass -File tools/dev.ps1 *) Bash(node tools/wander-status.mjs*)
---

# wander-verify

Command: **$ARGUMENTS** (empty → `backend-test`; UI changed → also `e2e`; before a commit or after dependency/config changes → `verify`).

Typical durations: doctor/tools-check < 1 min · backend-test ≈ 7 min (needs Docker running) · e2e ≈ 2 min · verify ≈ 10 min.

## Steps
1. **Run it.** Local Windows session: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/dev.ps1 <cmd>` with `run_in_background: true` for anything longer than a minute; you are re-invoked when it ends — do not poll in a loop. One command at a time (they share the database and port 8787).
   Cloud session linked to the PO's computer: the shell there cannot run Windows commands — use the VS Code task "Wander: <cmd>" (Terminal → Run Task) through computer use, then read the logs through the device shell. No way to run → say so; results stay `UNVERIFIED`.
2. **Read the result**, never guess: `.logs/<cmd>.status` (`RUNNING`/`PASS`/`FAIL`), the `RESULT:` line at the end of `.logs/<cmd>.log`, and `node tools/wander-status.mjs --tests` for counts and failing cases.
3. **On FAIL:** find the first real error in the log (Grep `FAILED|Exception|error:|BUILD FAILED`), then the failing test in `backend/build/test-results/test/TEST-*.xml`. Classify: environment (Docker off, JDK path, port in use) vs code. Environment → tell the PO the one action needed (e.g. "mở Docker Desktop"). Code → fix if this run belongs to a task you are implementing (≤ 3 verify-fix cycles per `planning-safety.md`), otherwise report.
4. **Report (Vietnamese, ≤ 6 lines):** command · PASS/FAIL with counts from the XML (e.g. "83/83 PASS: ArchUnit 7, domain 23, IT 53") · duration · failing tests with one-line cause · next action. Update the progress row in `docs/implementation/decisions.md` only when a full `verify` passed.

## Never
Claim a result you did not read in this session · edit tests to make them pass without saying so · run `docker system prune`, delete volumes, or change system settings · run several dev.ps1 commands in parallel.
