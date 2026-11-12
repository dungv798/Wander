# Portfolio upgrade report

Branch `portfolio-upgrade` (27 commits over `main`), 12/11/2026. Goal: turn Wander into something a backend interviewer can read in an
hour and verify. Every number below was produced by a command in this run; the commands are in the "How to check" column or in the
linked documents. Nothing was invented, and what was not verified says so.

Tags (all pushed): `pre-portfolio-cleanup`, `phase-1-done`, `phase-2a-done`, `phase-2b-done`, `phase-2c-done`, `phase-3-done`,
`phase-4-done`, `phase-5-done`, `phase-6-done`, `phase-7-done`.

## 1. What changed, phase by phase

| Phase | Change | Evidence |
|---|---|---|
| 0 | Baseline measured before touching anything | [`docs/baseline.md`](baseline.md) |
| 1 | Repository hygiene: one-off material archived outside the repo, `Makefile` + `tools/e2e.sh` as the single entry points, Docker pre-flight, a weekly full-history secret scan, an AI-assisted-workflow note | `make -n test`, [`docs/ai-assisted-workflow.md`](ai-assisted-workflow.md) |
| 2a/2b | Photo pipeline: content-hashed WebP at two sizes, one-year immutable cache, `PhotoUrls` (`WANDER_PHOTO_BASE_URL`), a signed uploader checked against AWS test vectors, CSP follows the photo origin | [ADR-016](architecture/adr/ADR-016-photo-delivery.md), [`photos.md`](operations/photos.md) |
| 2c | Git history rewrite **prepared, not published** (see section 5) | [`history-rewrite.md`](operations/history-rewrite.md) |
| 3 | English README, ADR summaries, backend/web READMEs; code comments, Javadoc and TSDoc translated to English (comments only) | `git diff --shortstat` per commit; typecheck/lint/tests unchanged |
| 4 | Typed request/response records, RFC 9457 errors, generated OpenAPI + TypeScript types | [ADR-017](architecture/adr/ADR-017-typed-api-contract.md) |
| 5 | Spring Modulith 2.1.2: module verification and a transactional outbox | [ADR-011](architecture/adr/ADR-011-spring-modulith-va-outbox.md), [`events.md`](architecture/events.md) |
| 6 | Request ids, JSON logs, Prometheus metrics, a local Prometheus + Grafana stack | [`observability.md`](operations/observability.md) |
| 7 | N+1 guard, k6 load scenario with results, rate-limiter ADR, CI workflows (e2e, CodeQL, Dependabot) | [`performance.md`](performance.md), [ADR-018](architecture/adr/ADR-018-rate-limiter.md) |

### Deviations from the plan

- **Phase 3 was split and reordered.** The English README/ADR work (3a) ran first; translating roughly 4,800 comment lines (3b) was done
  **after** Phases 4–6, so it did not translate code that those phases rewrote. `phase-3-done` is therefore tagged after Phase 7.
- Phase 5 found **no synchronous cross-module call** to turn into an event (the modules only depend on `shared`). The outbox's first use is
  an in-module decoupling of the security-event log from pessimistic-lock transactions. This is stated in the ADR and the README rather
  than dressed up as a cross-module saga.
- The new CI workflows (`e2e`, `codeql`) are valid YAML and `tools/e2e.sh` is green locally, but **they have not run on GitHub**.

## 2. Measured results

| Metric | Before (Phase 0) | After | Change | Command |
|---|---|---|---|---|
| Backend tests | 387 | 444 (443 passed, 1 skipped by design, 0 failed) | +57 | `./gradlew clean check`, JUnit XML |
| Coverage (JaCoCo) | 97.8 % line / 87.4 % branch | 97.6 % line / 87.3 % branch | -0.2 / -0.1 points | `jacocoTestReport.xml` |
| Web unit tests | 505 | 505 | 0 | `npm test` (typecheck, ESLint, stylelint, build also pass) |
| End-to-end scenarios | 126 | 126 passed | 0 | `tools/e2e.sh` |
| Photo data on disk | 261,159,915 B | 133,041,404 B | -49.1 % | `tools/catalog/optimize-photos.mjs` |
| Image bytes, Da Lat page | 7,542,897 B | 1,913,579 B | -74.6 % | browser resource timing, [`photos.md`](operations/photos.md) |
| Executable jar | 320,933,047 B | 208,777,841 B | -34.9 % (it was 193,790,547 B after Phase 2; Modulith, springdoc and Micrometer added about 15 MB) | `./gradlew bootJar` |
| Docker image (sum of layers) | 518.4 MiB | 411.5 MiB | -20.6 % | `docker history --human=false`, summed |
| Repository `.git` (rewritten clone, unpublished) | 465,062,965 B | 181,818,357 B | -60.9 % | `git count-objects`, [`history-rewrite.md`](operations/history-rewrite.md) |
| SQL statements, one trip read | not measured | 6 (same for 1 and 25 items) | n/a | `QueryCountIT` |
| SQL statements, trip list | not measured | 2 (same for 1 and 12 trips) | n/a | `QueryCountIT` |
| Throughput, developer machine, 20 virtual users | not measured | 267 req/s, p95 118.6 ms, 0 % errors (24,090 requests) | n/a | k6, [`performance.md`](performance.md) |
| Production-shaped container (0.25 CPU, 512 MiB) | not measured | 2 users: 41.5 req/s, p95 99.8 ms; 10 users: 16.5 req/s, p95 1.1 s, 0 % errors, 331 MiB | n/a | k6 against the production image |
| Cold start, 0.25 CPU | 70.9 s | not re-measured after Phase 2 (it was unchanged at the end of Phase 2) | n/a | [`baseline.md`](baseline.md) |

Honest readings of the table: coverage moved slightly down because new code (filter, recorder) is covered by integration tests that JaCoCo
counts, but not every branch; the jar grew after Phase 2 because three real dependencies were added; one quarter of a CPU is the limit
for the deployed shape, not memory.

## 3. Problems met and how they were handled

- Two e2e runs were killed by the harness because the 16 GB machine ran low on memory; they were not restarted unprompted. The e2e script
  now builds without a Gradle daemon, and the work after that ran one heavy process at a time.
- A first Docker figure (939 MB) double-counted layers on the containerd image store; the baseline was corrected to the sum of layer sizes.
- The autopilot test sandbox once filled the system drive (69.9 GB); it was fixed and the test now runs in 29 s.
- Phase 5: three tests failed on the first run because the log is now written after commit (the old tests read it immediately); the
  tests now wait for the outbox to drain instead of sleeping. A proxy-class pitfall in a test listener was fixed with static state.
- Phase 6: tests that compare two refusals byte for byte (anti-probing) broke because every error now carries a different `requestId`;
  they compare without it. One Checkstyle import-order failure was fixed.
- Phase 7: writing the rate-limiter ADR exposed that **no test covered window expiry**; a unit test was added.
- A safety check once flagged a harmless Makefile edit (`$$` in a recipe); it was redone with the editor tool, not worked around.
- `tools/catalog/data` was missing from the first Phase 1 commit (ignored by a pattern) and was fixed in a follow-up (`4953c4a`).

## 4. What can be claimed in an interview

Defensible, with the evidence above:

- Designed and tested concurrency control for single-use recovery codes (pessimistic row locks, parallel-request test) and optimistic
  locking on the trip aggregate.
- Typed API contract end to end: records, RFC 9457 errors, a generated and drift-checked OpenAPI document and generated client types.
- A transactional outbox with idempotent consumption, tested for rollback, duplicate delivery and failure/resubmission.
- Request-scoped observability (request id, JSON logs, Prometheus metrics) that was run and screenshotted, and a guard against N+1 queries.
- Measured performance in two shapes with the limits of the measurement stated; payload and image reductions with before/after numbers.
- Architecture enforced by 21 ArchUnit rules plus Modulith verification; Checkstyle with zero warnings; coverage floors in the build.

Not defensible, so not claimed:

- Production readiness or real users: the app has not been released (release gates RG-2, RG-5, RG-6, RG-7 are open).
- Horizontal scalability: the rate limiter is per process (ADR-018) and the outbox runs in one process.
- Performance on Render or Neon, a cross-module event-driven design, or CI results for `e2e` and `codeql` (never run on GitHub).

## 5. Actions that were deliberately NOT taken (hard stops)

These are listed for the owner to do; nothing below was done or attempted.

1. **A secret scanner flags two Google Maps keys in history; they are not yours (correction of an earlier version of this report).**
   The full-history scan found them in `docs/research/venue-candidates-20261107.json` (commit `480978dc76`, already on `origin/main`).
   Inspecting the context showed they are public browser keys embedded in the HTML of two hotel websites (the Sofitel Metropole Hanoi
   site and paoshotel.com) that the research step scraped into the file; they belong to those businesses, so there is nothing for you
   to rotate. They would still raise scanner alerts on a public repository, so drop the file from history before making the repo public
   (command in [`history-rewrite.md`](operations/history-rewrite.md), step 4). Other scraped research files may contain similar strings.
2. Create the Cloudflare R2 bucket, set `WANDER_PHOTO_BASE_URL`, run `tools/catalog/upload-photos.mjs` ([`photos.md`](operations/photos.md)).
3. Publish the rewritten history with a force push. The final prepared clone is `D:\wander-backup-20261112-rewritten-final`
   (132 commits, 9 `phase-*` tags, tip tree identical to `portfolio-upgrade` at commit `be723dd`, tree `258e8f3…`; the only later commit changes these two notes, so refresh the rewrite once more before publishing if you want it byte-identical). `D:\Wander-rewritten` is an older, stale
   preparation that this work could not delete (the tool blocks removal), so delete it yourself. Commands and the refresh step are in
   [`history-rewrite.md`](operations/history-rewrite.md). It is prepared, verified (tip tree identical, all suites green) and **not pushed**.
4. Open the pull request (`https://github.com/dungv798/Wander/pull/new/portfolio-upgrade`), merge it, redeploy Render by hand.
5. Make the repository public and set the GitHub About text and topics (`docs/github-about.md`).

Also for the owner: `.mcp.json` has an uncommitted local change that this work never touched; `tools/` still holds many one-off review
scripts that were not in the removal list; about 4.3 MB of non-image bytes on the Da Lat page deserve a later look; and `docs/design`
holds about 30 MB of PNGs in history that the rewrite did not cover.
