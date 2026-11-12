package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** A flat row of an invite link: NO code or hash. */
public record InviteRow(UUID id, Instant createdAt, Instant expiresAt, Instant revokedAt) {
}
