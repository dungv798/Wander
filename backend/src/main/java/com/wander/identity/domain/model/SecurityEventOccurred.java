package com.wander.identity.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain event: something security-relevant happened to an identity (it was created, got a recovery code, paired a device, had a session
 * revoked, was recovered). It is published inside the transaction of the action, stored by the transactional outbox, and recorded in the
 * identity's activity log after commit. Delivery is at-least-once, so {@code eventId} identifies the occurrence for idempotent handling.
 *
 * @param eventId    unique id of this occurrence, generated when the event is published
 * @param identityId the identity concerned
 * @param kind       code of the event kind ({@code created}, {@code code}, {@code paired}, {@code revoked}, {@code recovered})
 * @param deviceName self-declared device label (unverified), or null
 * @param occurredAt when the action happened
 */
public record SecurityEventOccurred(UUID eventId, UUID identityId, String kind, String deviceName, Instant occurredAt) {
}
