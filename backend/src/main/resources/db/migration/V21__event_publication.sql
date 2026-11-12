-- Transactional outbox of Spring Modulith (ADR-011): every published domain event is stored here, in the publishing transaction, once per
-- listener; a publication is completed (completion_date, status COMPLETED) when its listener succeeds and stays incomplete or FAILED otherwise,
-- so it can be redelivered. This is the v2 schema shipped with spring-modulith-events-jdbc 2.1.2 (completion-mode update: no archive table).
-- Schema initialization by Modulith is switched off (ddl-auto is validate); Flyway owns the schema.
CREATE TABLE event_publication
(
    id                     uuid                     NOT NULL,
    listener_id            text                     NOT NULL,
    event_type             text                     NOT NULL,
    serialized_event       text                     NOT NULL,
    publication_date       timestamp with time zone NOT NULL,
    completion_date        timestamp with time zone,
    status                 text,
    completion_attempts    integer,
    last_resubmission_date timestamp with time zone,
    PRIMARY KEY (id)
);
CREATE INDEX event_publication_serialized_event_hash_idx ON event_publication USING hash (serialized_event);
CREATE INDEX event_publication_by_completion_date_idx ON event_publication (completion_date);
