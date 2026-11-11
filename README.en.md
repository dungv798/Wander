# Wander: a Vietnamese trip-planning app (personal project)

Wander helps one organizer plan a domestic trip in Vietnam: pick places by swiping cards, turn the picks into a trip, arrange days, track costs, and send the plan to a group chat as an image. The UI is in Vietnamese.

It is a **personal learning project**, built to practise the stack I use at work (Java, Spring Boot, DDD, CQRS, PostgreSQL). It is **not released to real users**: the release gates for a real launch (threat model, operations readiness, session storage, real-device testing) are still open and tracked in `docs/implementation/decisions.md` section 3. Product direction after a strategy review is in [`docs/decisions/DR-037-huong-di-san-pham-10-11.md`](docs/decisions/DR-037-huong-di-san-pham-10-11.md) (in Vietnamese).

## What is interesting here

- **Anonymous identity with a designed recovery path.** No accounts, email, or phone number. Ownership of a trip is proven by a session on a trusted device or a self-kept recovery code. The design and its trade-offs are written up in [`docs/articles/recovery-design.md`](docs/articles/recovery-design.md).
- **Clean Architecture + DDD + CQRS in a modular monolith**, with the layering rules enforced as tests (ArchUnit).
- **Real-database tests.** Integration tests run the whole app against PostgreSQL in Testcontainers; end-to-end tests drive a real browser at phone size against the real backend.

## Stack

Java 21, Spring Boot 4.1, Spring Security (bearer sessions), JPA/Hibernate, PostgreSQL with Flyway migrations, MapStruct. Front end: React 19 and TypeScript, built with Vite. Map: MapLibre with OpenFreeMap tiles (no API key).

## Architecture in one picture

```
web/ (React + TypeScript)  --/api/*-->  backend/ (Spring Boot, modular monolith)
                                          identity   anonymous identity, sessions, device pairing, recovery
                                          planning   trips, days, items, costs, sharing, checklists
                                          catalog    editorial places and destinations, POI snapshots
                                          shared     kernel, web plumbing, rate limiting
                                        each module: api -> application -> domain <- infrastructure
                                                                       PostgreSQL
```

- `identity` and `planning` never import each other; they share only the `shared.kernel` package. A test enforces it.
- Write side: command handlers load an aggregate, call a domain method, save. Read side: query services return flat records from JPQL projections and never load aggregates.
- Optimistic locking (`@Version`) on `Trip` returns HTTP 409 instead of silently overwriting when two people edit; a pessimistic lock guards the recovery code so two concurrent recoveries with the same code have exactly one winner.

A guided tour of the code (request lifecycle, folder map, "concept -> where to look in the code") is in [`docs/architecture/README.md`](docs/architecture/README.md), in Vietnamese.

## Tests

As of 2026-11-09 (read from the build logs, not re-run for this README): 384 backend tests and 118 end-to-end tests passed. The end-to-end suite runs only on my machine; there is no CI yet.

## Run it locally (Windows, PowerShell)

Needs JDK 21, Docker Desktop (running), Node.js 24 or newer, and Edge or Chrome for the browser tests. The Vietnamese [`README.md`](README.md) has the full guide; the short version, from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 doctor      # check your machine
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 web-build   # build the front end
powershell -ExecutionPolicy Bypass -File tools\dev.ps1 run         # start PostgreSQL in Docker, then the backend
```

Open http://localhost:8787. Other commands: `backend-test`, `e2e`, `verify` (runs everything).

## Known limits

- The place catalogue is small and hand-curated: 20 destinations, about 700 places, and not every place has a photo or a price. Travel times are estimates (straight-line distance times a factor), not routing.
- No real-time sync between people: the second editor reloads to see changes.
- No offline mode yet, and the free hosting I tried sleeps when idle, so a cold start can take minutes.
- The session secret is kept in `localStorage` (release gate RG-6 is open).
