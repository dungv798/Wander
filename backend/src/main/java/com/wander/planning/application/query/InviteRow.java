package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** Dòng phẳng liên kết mời: KHÔNG có mã hay băm. */
public record InviteRow(UUID id, Instant createdAt, Instant expiresAt, Instant revokedAt) {
}
