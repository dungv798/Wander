# Performance

Measured on 12/11/2026, with commands you can re-run. Two questions: does the API scale with the data it returns (no N+1), and how does it behave under load, both on a developer machine and in the shape of the real deployment (Render free: 0.25 CPU, 512 MiB).

These numbers describe this code on this hardware. They are not a capacity promise for any deployment, and one run per configuration is not an average.

## 1. No N+1: statements per request do not grow with the data

`QueryCountIT` (part of `./gradlew check`) turns on Hibernate statistics, builds a small and a large data set, waits until the background outbox listener is idle, and compares the number of SQL statements prepared for the same request.

| Request | Small data | Large data | Statements |
|---|---|---|---|
| `GET /api/trips/{id}` | 1 item | 25 items | **6 and 6** |
| `GET /api/trips` | 1 trip | 12 trips (1 item each) | **2 and 2** |

The test also fails if one read exceeds 8 statements, so a loop over rows breaks the build. Mechanism: read-side queries are JPQL projections written for each screen (CQRS read model, no aggregate loading) and `hibernate.default_batch_fetch_size=64` for the remaining lazy loads.

## 2. Load: k6 scenario

`tools/perf/k6-trip-flow.js`: each virtual user opens the app (anonymous identity), creates a trip, adds three items, then reads the trip and the trip list five times each. The ramp is 20 s up, 60 s hold, 10 s down. The thresholds in the script (`http_req_failed < 1 %`, `p95 < 1 s`) are a regression guard.

How to run it (k6 from its official Docker image; the rate limits must be raised, otherwise the limiter correctly answers `429` to one machine creating hundreds of identities):

```
# a backend with the limits raised, against a scratch database
WANDER_LIMIT_IDENTITY=1000000 WANDER_LIMIT_WRITES=1000000 make run
make perf                      # k6, 20 virtual users, http://host.docker.internal:8787
```

### 2a. Developer machine (jar run directly)

Windows 11 laptop, 16 GB RAM, jar with `-Xmx512m`, default profile (G1, DB pool 10), Postgres 17 in Docker on the same machine, 20 virtual users.

| Metric | Result |
|---|---|
| Requests | 24,090 in 90 s (**267 req/s**), 1,606 complete iterations |
| Failed requests | **0 %** (all 24,090 checks passed) |
| Latency, all requests | avg 61.7 ms · median 54.8 ms · p95 **118.6 ms** · max 274.6 ms |
| Latency, `GET /api/trips/{id}` | median 56.0 ms · p95 **92.5 ms** |
| DB pool | 10 connections, 0 waiting at the end |
| JVM | 37 threads, heap about 170 MB used after the run |

### 2b. The shape of the real deployment

The production Docker image (root `Dockerfile`: profile `free`, `-Xmx256m`, SerialGC, tiered compilation stopped at C1) run with `--cpus=0.25 --memory=512m`, against Postgres in the same Docker network (so no Neon latency; Neon would add network time to every query).

| Load | Requests/s | Failed | p95, all requests | p95, `GET /api/trips/{id}` | Memory |
|---|---|---|---|---|---|
| 2 virtual users | **41.5** (3,735 requests) | 0 % | **99.8 ms** | 91.4 ms | |
| 10 virtual users | **16.5** (1,485 requests) | 0 % | **1.1 s** (threshold of 1 s exceeded) | 930 ms | 331 MiB of 512 MiB |

Reading: with a light load the free-tier shape answers in about 100 ms at p95. At 10 simultaneous users the single quarter of a CPU is saturated: throughput drops and queueing pushes latency above one second, with no errors and no restart. Server error log lines during the runs: 0. The honest summary for the demo deployment is "fine for a handful of people, CPU-bound beyond that"; the cold start at this CPU limit (70.9 s, see `docs/baseline.md`) matters more to a visitor than steady-state latency.

## 3. What this does not show

- No run against Render or Neon: network latency to Neon and Render's noisy neighbours are not included.
- One scenario, one run per configuration; no soak test, no failure injection, no concurrency on the same trip (that is covered for correctness by `ConcurrencyIT`, not for performance).
- Static files and photos are not part of the scenario.
