# Wander backend

Java 21, Spring Boot 4.1, Gradle (Kotlin DSL), PostgreSQL (Flyway), JPA/Hibernate, Spring Security, MapStruct.
A modular monolith: `catalog`, `identity`, `planning`, `rating` and a `shared` kernel under `com.wander`. See the
[root README](../README.md) for the architecture diagrams and [ADR-003](../docs/architecture/adr/ADR-003-modules-layers-cqrs.md) for the rules.

## Layout

```
src/main/java/com/wander/
  <module>/{api,application,domain,infrastructure}   api -> application -> domain <- infrastructure
  shared/{kernel,web}                                 errors, constants, utilities; error handling, rate limiting, request context
src/main/resources/
  db/migration/       Flyway migrations V1..V19 (never edit an applied one)
  catalog/            editorial destinations, places, guides (JSON) and WebP photos
  application.yml     defaults for local development; application-free.yml for the Render free tier
src/test/java/        unit tests, ArchitectureTest (ArchUnit), *IT integration tests (Testcontainers PostgreSQL)
```

Layer rules: the domain has no Spring/JPA imports; one transaction per use case in `application`; commands return ids and queries return
flat read models; JPA entities are separate from domain objects and mapped with MapStruct; `api` controllers stay thin. Modules do not
import each other. All of this is enforced by `ArchitectureTest`.

## Commands

Docker must be running (integration tests start PostgreSQL with Testcontainers).

```bash
sh ./gradlew test        # unit + integration tests
sh ./gradlew check       # tests + ArchUnit + Checkstyle (0 warnings) + JaCoCo thresholds
sh ./gradlew bootJar     # build/libs/wander-backend.jar
docker compose up -d postgres && sh ./gradlew bootRun   # local run on http://localhost:8787 (see environment below)
```

From the repository root the same things are available as `make test|check|run|e2e|verify`.

## Environment

Defaults work on a developer machine; the one required value is the recovery-code pepper.

| Variable | Default | Meaning |
|---|---|---|
| `WANDER_RECOVERY_PEPPER` | none, required | HMAC key (at least 32 bytes) for hashing recovery codes; the app does not start without it |
| `WANDER_DB_URL` / `WANDER_DB_USER` / `WANDER_DB_PASSWORD` | `jdbc:postgresql://localhost:5433/wander` / `wander` / `wander` | PostgreSQL connection (defaults are for local use only) |
| `PORT`, `WANDER_BIND_ADDRESS` | `8787`, `127.0.0.1` | HTTP listener |
| `WANDER_WEB_DIR` | empty | built front end to serve (empty = API only) |
| `WANDER_PHOTO_BASE_URL` | empty | serve catalog photos from this https origin instead of the classpath ([guide](../docs/operations/photos.md)) |
| `WANDER_TRUSTED_PROXY_HOPS` | `0` | trusted proxies in front of the app, used to find the client address |
| `WANDER_LIMIT_*` | see `application.yml` | per-client rate limits |
| `SPRING_PROFILES_ACTIVE` | empty (`free` in the Docker image) | `free` = small pools and timeouts for a 512 MiB single instance |

## API surface

Base paths: `/api` (identity, sessions, recovery, device pairing), `/api/trips`, `/api/preferences`, `/api/catalog`, `/api/places/{placeRef}`
(ratings). Errors are JSON: `{"error": {"code", "message", "field", "details"}}`. Health: `/actuator/health` (liveness and readiness probes
are enabled; nothing else is exposed).
