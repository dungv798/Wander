# Baseline — measured before the portfolio-hardening phases

Measured on **2026-11-12**, commit `16eb57e` (branch `phase-0-baseline`, cut from `main`).
Every number below comes from a command run on that day; nothing is estimated.
Later phases compare against this file.

**Machine:** Windows 11, Intel Core i7-1065G7 (4 cores / 8 threads, 1.3 GHz base), 15.7 GiB RAM,
Docker Desktop 29.9.2 (VM with 7.6 GiB RAM), JDK 21.0.13, Node 24.17.0, npm 11.13.0, Gradle 9.8.1.
A laptop, so absolute times are indicative; use them for before/after comparison on the same machine.

## Backend

Command: `cd backend && ./gradlew clean check bootJar --console=plain` (Docker running; Testcontainers uses `postgres`).

| Metric | Value |
|---|---|
| Result | `BUILD SUCCESSFUL` (exit 0) |
| Tests executed | **387**, 0 failures, 0 errors, 0 skipped (63 suites; summed from `build/test-results/test/*.xml`) |
| Test methods in source | 386 (`@Test`/`@ParameterizedTest`/`@RepeatedTest`; parameterized runs account for the difference) |
| ArchUnit rules / `*IT` classes / Flyway migrations | 20 / 36 / 19 |
| Wall time, clean build + all tests + coverage gate + checkstyle + bootJar | **213 s** (Gradle: 3m 32s) |
| Sum of suite times | 148 s |
| JaCoCo, whole bundle | **line 97.8 %** (3993/4082), **branch 87.4 %** (1360/1556), instruction 97.5 %, method 96.6 % |
| Coverage gates in `build.gradle.kts` | bundle line ≥ 90 % / branch ≥ 70 %; each `*.domain.*` and `*.application.*` package line ≥ 90 % / branch ≥ 50 % — all pass |
| `wander-backend.jar` (bootJar) | **320,933,047 bytes (306 MiB)** |

Where the jar weight is: `src/main/resources/catalog/photos` = 602 JPGs, **261,159,915 bytes (249 MiB)**, i.e. ~81 % of the jar.

> Note on a false start: the first run of the same command, with Docker Desktop **not running**, ended with
> `387 tests completed, 220 failed` — all in Testcontainers ITs (`Could not find a valid Docker environment`).
> That was an environment problem, not a code defect; the numbers above are from the second run with Docker up.

## Docker image and cold start

Command: `docker build -t wander:baseline .` (root `Dockerfile`: web build → backend bootJar → JRE runtime).

| Metric | Value |
|---|---|
| Build wall time | 217 s (Docker layer-cache state not controlled) |
| Image size | **939,060,713 bytes (~896 MiB)** as reported by `docker image inspect` (uncompressed) |

Cold start: `docker run` on the compose network against an **empty** database (so Flyway applies all 19 migrations),
polling `GET /actuator/health/readiness` every 0.5 s until HTTP 200. Env as in `Dockerfile`
(`SPRING_PROFILES_ACTIVE=free`, `-Xmx256m`, `TieredStopAtLevel=1`, `SerialGC`). One run per shape, not averaged.

| Shape | `docker run` → readiness 200 | Spring "Started WanderApplication in" | Memory after ready |
|---|---|---|---|
| Unconstrained | **21.6 s** | 18.8 s | 297.7 MiB |
| `--cpus=0.25 --memory=512m` (Render free shape) | **70.9 s** | 63.2 s | 284.9 MiB / 512 MiB |

The 0.25-CPU figure agrees with the 65 s recorded in DR-037.

## Web

Commands from the repo root; Node 24.17.0.

| Command | Result | Time |
|---|---|---|
| `npm --prefix web run typecheck` | pass | 33 s |
| `npm --prefix web run lint` (eslint + stylelint) | pass | 87 s |
| `npm --prefix web test` (`node --test`) | **502 tests, 502 pass** | 13 s |
| `npm --prefix web run build` | pass; Vite warns that a chunk exceeds 500 kB | 34 s |

`web/dist`: **8,647,624 bytes in 724 files**; 5,926,110 bytes without the 589 map thumbnails.
Largest assets (raw / gzip -9): `maplibre-gl-*.js` 1,104,231 / 293,163 B · `index-*.js` 427,463 / 132,738 B · `index-*.css` 219,747 / 41,950 B.

## Repository

| Metric | Value |
|---|---|
| Tracked files (`git ls-files`) | **3,142** |
| Tracked content | **353,077,670 bytes (337 MiB)** |
| `git count-objects -vH` | `count: 6748`, `size: 338.48 MiB`, `in-pack: 0`, `packs: 0`, `size-pack: 0` — objects are all **loose**; the repo has never been `git gc`-ed (not run here, to leave the repo untouched) |
| Working tree excluding `.git` | ~6.7 GB on disk, of which **3.59 GB is `.logs/`** (git-ignored local run logs), `docs/` 1.04 GB and `backend/` 0.95 GB (includes ignored `build/`), `tools/` 0.77 GB (includes untracked local content). Tracked content is the meaningful figure |

Tracked bytes by area (top entries):

| Path | Bytes | Files |
|---|---|---|
| `backend/src` (≈ 261 MB of it is catalog photos) | 302,362,265 | 954 |
| `docs/research` | 17,769,992 | 236 |
| `docs/UI-sample` | 15,739,327 | 50 |
| `web/public` | 5,954,125 | 668 |
| `docs/ux` | 3,422,163 | 96 |
| `web/src` | 1,921,911 | 613 |
| `.taste-skill` | 1,410,452 | 22 |

Observation for Phase 1: the Phase 1 removal list (`docs/research`, `docs/UI-sample`, `.taste-skill`, …) is ~35 MB of the 353 MB tracked,
so it improves first impressions and file count but not repo weight; the weight is the catalog photos (Phase 2),
and since they live in history, removing them from HEAD will not shrink `.git`.

## Checks of the "verified facts" in the brief

All matched the source: 20 ArchUnit `@Test`; 36 `*IT.java`; 19 migrations; 21 main files using `Map<String, Object>`;
1 main class using a logger; 602 photo files; 589 map thumbnails; modules `catalog`, `identity`, `planning`, `rating`, `shared`.

## Reproduce

```bash
cd backend && ./gradlew clean check bootJar --console=plain     # Docker must be running
docker build -t wander:baseline .
npm --prefix web run typecheck && npm --prefix web run lint && npm --prefix web test && npm --prefix web run build
git ls-files | wc -l; git count-objects -vH
```
