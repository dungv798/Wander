# Domain events and the transactional outbox

How Wander publishes and handles domain events. Decision: [ADR-011](adr/ADR-011-spring-modulith-va-outbox.md).

## The mechanism

```
 request ──► service (one transaction)
               ├─ writes the aggregate            ─┐ same transaction:
               └─ publishEvent(SecurityEventOccurred) ─► event_publication row (listener, payload)  ─┘ commit
                                                                   │ after commit
                                                                   ▼
                                              @ApplicationModuleListener (async, own transaction)
                                                                   │ success → completion_date set, status COMPLETED
                                                                   │ failure → row stays, status FAILED
                                                                   ▼
                                       resubmit (restart, or FailedEventPublications.resubmit)
```

- The event is stored **with** the transaction that publishes it. If that transaction rolls back, there is no event (tested).
- After commit, each listener runs asynchronously in its own transaction (`@ApplicationModuleListener` = `@Async` + `@Transactional(REQUIRES_NEW)` + `@TransactionalEventListener`). A listener failure does not affect the user's request.
- One row per (event, listener). A failed listener leaves its own row `FAILED`; other listeners of the same event are not affected (tested).
- On startup, publications that were stored but never completed are delivered again (`republish-outstanding-events-on-restart`).

## Delivery is at-least-once, so consumers are idempotent

A publication can be delivered more than once (a crash after the listener's commit but before the completion mark, a resubmission). Every consumer must make that harmless.

`SecurityEventRecorder` does so with the event id: `SecurityEventOccurred.eventId` is generated when the event is published, `identity_events.event_id` is unique, and the insert is `ON CONFLICT (event_id) DO NOTHING`. Delivering the same event twice leaves one log entry (tested in `SecurityEventOutboxIT`).

Events carry ids and the minimum data, are named in the past tense, and the domain package stays free of Spring (the record is plain Java; publishing happens in the application layer).

## What is an event today

| Event | Published by | Handled by | Why an event |
|---|---|---|---|
| `SecurityEventOccurred` (`created`, `code`, `paired`, `revoked`, `recovered`) | `IdentityService`, `RecoveryService`, `DeviceLinkService` through `SecurityEventService.record` | `SecurityEventRecorder` appends to `identity_events` and prunes to the latest 50 | The recovery and pairing flows hold pessimistic row locks on the identity; writing and pruning the log inside that transaction lengthened the lock for no benefit, and a failing log write could fail a recovery. The log is also read after the fact ("recent activity"), so eventual consistency is acceptable. |

There is no other event. The modules (`catalog`, `identity`, `planning`, `rating`) did not call each other, so the first use is an in-module decoupling; a second module (for example notifications) would simply add another listener for the same event.

## Operating it

- Table `event_publication` (Flyway `V21`). `status` is `PUBLISHED`, `PROCESSING`, `COMPLETED`, `FAILED` or `RESUBMITTED`; `completion_attempts` counts tries.
- Failed or stuck publications: `FailedEventPublications.resubmit(...)` / `IncompleteEventPublications.resubmitIncompletePublications(...)` (Spring beans), or restart the application. A runnable example is in `SecurityEventOutboxIT`.
- Completed rows are kept (completion mode `update`) so they can be counted; a retention job (`CompletedEventPublications.deletePublicationsOlderThan`) is not scheduled yet. At the current event volume the table is small, but a retention job is the next step before real traffic.
- The listener pool has one worker thread (`spring.task.execution.pool`), so events are handled in publication order and memory stays small on the 512 MiB instance.

## Consequences for tests

The activity log is eventually consistent: after an action, the entry appears a moment later. `SecurityEventsApiIT` reads the log through a helper that waits until the outbox has delivered every pending recorder publication, instead of sleeping.

## Module structure

`ModulesTest` verifies the module structure (no cycles, business modules depend only on the open `shared` module) and regenerates the diagrams and module canvases in [`modules/`](modules/).
