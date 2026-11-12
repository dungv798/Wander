-- Security events are now recorded from domain events through the transactional outbox (ADR-011): delivery is at-least-once, so the
-- recorder must be idempotent. The event id (generated when the event is published) is unique; rows written before this migration have none.
ALTER TABLE identity_events ADD COLUMN event_id uuid;
ALTER TABLE identity_events ADD CONSTRAINT identity_events_event_id_key UNIQUE (event_id);
