package com.wander.planning.application.query;

import java.time.Instant;
import java.util.UUID;

/** Dòng phẳng một thành viên. {@code identityId} chỉ để so sánh "chính mình" ở lớp ứng dụng, KHÔNG BAO GIỜ ra API. */
public record MemberRow(UUID id, UUID identityId, String role, String displayName, Instant joinedAt) {
}
