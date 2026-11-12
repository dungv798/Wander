# API contract workflow

The contract of the backend API is **`backend/openapi.yaml`**, generated from the code (springdoc) and committed. The web client's
types are generated from it. Decision and rationale: [ADR-017](adr/ADR-017-typed-api-contract.md).

```
controllers + request/response records  ──springdoc──►  backend/openapi.yaml  ──openapi-typescript──►  web/src/shared/api/contract.generated.ts
                (source of truth)                          (committed)                                         (committed)
```

## Browsing it

Run the backend (`make run`) and open `http://localhost:8787/swagger-ui/index.html` (the raw document is at `/v3/api-docs` and
`/v3/api-docs.yaml`). The documentation endpoints are **off** under the `free` profile, which is what the public deployment uses.

## Changing the API

1. Change the controller / request or response record (and the command or view behind it).
2. `make gen-api` — regenerates `backend/openapi.yaml` (through `OpenApiContractIT`) and then the TypeScript types.
3. Commit the code, `backend/openapi.yaml` and `web/src/shared/api/contract.generated.ts` together.
4. Fix any web code the type check now rejects.

CI enforces it: `OpenApiContractIT` (part of `./gradlew check`) fails when `backend/openapi.yaml` is stale, and `web-ci` fails when
the generated TypeScript differs from what the committed spec produces.

## Conventions

- Request bodies are records in `<module>/api/request`; responses are records in `<module>/api/response`; controller methods never take or
  return a `Map` (ArchUnit rule `API-1`).
- A request field that may be omitted, set to `null`, or set to a value is a `Patch<T>`; an amount that may be a number or a digit string is a
  `FlexibleNumber`.
- A request component declares the error to report for a wrong JSON type with `@InputError(code, message[, field])`; the default is `MALFORMED`.
- Errors are RFC 9457 problems with a stable `code`; the OpenAPI document declares them once as the `Problem` schema on every operation.
- Operations that need no session are marked `@SecurityRequirements` (empty), everything else uses the `bearerAuth` scheme.
