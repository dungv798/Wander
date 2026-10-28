package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** Dòng phẳng một đề nghị xóa. */
public record RequestRow(UUID id, UUID itemId, UUID requesterMemberId, String reason, String status, Instant requestedAt, Instant decidedAt) {
}
