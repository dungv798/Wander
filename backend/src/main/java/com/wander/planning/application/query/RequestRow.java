package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** A flat row of one deletion request. */
public record RequestRow(UUID id, UUID itemId, UUID requesterMemberId, String reason, String status, Instant requestedAt, Instant decidedAt) {
}
