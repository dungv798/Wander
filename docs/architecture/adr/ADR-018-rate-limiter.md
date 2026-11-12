# ADR-018 — Rate limiting: a small in-memory fixed-window limiter, kept; what it costs and when to replace it

- **Status:** `ACCEPTED` — records and justifies the approach already approved as AD-6 in [ADR-006](ADR-006-huong-trien-khai-aws.md) ("keep in-memory counters, exactly one task during RG-1; Redis deferred"). No behaviour changes with this ADR; it adds the alternatives that were weighed, the measured evidence, and the conditions under which the decision should be revisited. Added in the portfolio upgrade of 12/11/2026.
- **Related:** ADR-006 (AD-6, deployment), ADR-017 (the `429` is an RFC 9457 problem with code `RATE_LIMITED`), [`docs/operations/observability.md`](../../operations/observability.md) (the rejection counter).

## Context

The API is anonymous by design (an identity is created without credentials), so the abuse surface is: creating identities, guessing recovery codes, pairing requests, writes, and scraping the public catalog. Eight limits protect these (`RateLimits`): identity creation and recovery per address per hour, approvals per session per hour, pairing and step-up requests per 10 minutes, API writes and catalog reads and pairing polls per minute. Limits are configuration (`wander.limits.*`), the client address comes from `ClientAddress` with an explicit number of trusted proxies (a spoofed `X-Forwarded-For` does not help an attacker; tested).

The deployment is one process (Render free: one instance, 512 MiB; the AWS target in ADR-006 is also one task during the first stage).

## Decision

Keep `FixedWindowRateLimiter`: about 70 lines, a map from key (address, session or identity) to `(window start, count)`, one lock, expired windows pruned.

Properties worth stating:

- **Fixed window**: a caller can spend its budget at the end of one window and again at the start of the next, so a burst of up to 2× the limit across a boundary is possible. Accepted: the limits are abuse brakes (30 identities per hour), not billing meters, and a sliding window or token bucket does not change what an attacker can do at these magnitudes.
- **Bounded memory**: at most 10,000 tracked keys. When the table is full, a new key is refused (closed), except on the recovery channel, which falls into one shared overflow bucket with 20× the budget, so an attacker filling the table cannot lock every legitimate person out of recovery.
- **Per process**: counters live in memory, so a restart resets them and a second instance would count separately. This is the known limit, written in the class and in ADR-006.
- **Observable**: every refusal increments `wander_ratelimit_rejected_total{limiter}`, so tuning a limit starts from data. In a local traffic loop with the limits left at their defaults, the `identity` limiter did refuse (the dashboard curve in `docs/screenshots/grafana-dashboard.webp` is that run).
- **Fast**: the lock is held for a map update; it is not visible in the load results of [`docs/performance.md`](../../performance.md).

## Alternatives considered

| Option | Why not (now) |
|---|---|
| Bucket4j (in memory) | Gives token buckets and a tested library, but adds a dependency for algorithms the limits do not need; the fixed window is enough at these magnitudes. A reasonable choice if requirements grow (burst smoothing, per-plan quotas). |
| Resilience4j `RateLimiter` | Designed to protect outgoing calls (permits per refresh period), not to count per client key. |
| Shared store (Redis / ElastiCache) | The right answer when there is more than one instance. Today it would add a service to run and pay for, and a new failure mode (what does a request do when the limiter store is down?), to protect a single process. Deferred in ADR-006. |
| Edge limiting (WAF / CloudFront / Cloudflare) | Complements, does not replace: it cannot see sessions or identities, and several limits here are per identity or per session. Worth adding in front of the AWS target for volumetric abuse. |

## When to revisit

- A second instance is deployed (autoscaling, or the move from one Fargate task to more): counters must be shared, or each instance's limit must be divided, or limiting moves to an edge plus a shared store.
- A limit needs smoothing (no boundary burst) or different quotas for different callers.
- The rejection counter shows legitimate users being refused (many distinct addresses behind one NAT, for example): change the key or the budget, not the algorithm.

## Consequences

- No new dependency, no new infrastructure; the limiter is covered by unit tests (table full, overflow bucket, concurrent callers never exceed the budget, rejection counter per limiter) and by integration tests per limit (`RateLimitIT`, `LinkPollRateLimitIT`, `IdentityApprovalRateLimitIT`, `PoiRateLimitIT`).
- Switching later is contained: callers use `RateLimits.identity(...)`, `write(...)` and so on, never the limiter class itself.
