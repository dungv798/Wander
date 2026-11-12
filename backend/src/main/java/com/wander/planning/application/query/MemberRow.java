package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** A flat row of one member. {@code identityId} is only for comparing 'myself' in the application layer and NEVER leaves through the API. */
public record MemberRow(UUID id, UUID identityId, String role, String displayName, Instant joinedAt) {
}
