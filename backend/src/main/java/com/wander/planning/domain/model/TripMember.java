package com.wander.planning.domain.model;

import com.wander.planning.domain.vocabulary.MemberRole;
import java.time.Instant;
import java.util.UUID;

/**
 * Một người trong chuyến. {@code id} là mã thành viên (công khai trong chuyến, dùng gắn mục "do ai thêm"); {@code identityId} là
 * danh tính ẩn danh và KHÔNG BAO GIỜ lộ ra API. {@code displayName} do người đó tự khai, chưa xác minh.
 */
public record TripMember(UUID id, UUID identityId, MemberRole role, String displayName, Instant joinedAt) {

    /** Bản sao với tên hiển thị mới. */
    public TripMember withDisplayName(String newName) {
        return new TripMember(id, identityId, role, newName, joinedAt);
    }
}
