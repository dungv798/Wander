package com.wander.planning.domain.port;

import com.wander.planning.domain.vocabulary.TripInterest;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Cổng lưu sở thích theo danh tính (BE-10). Sở thích gắn với chủ (danh tính), không với một chuyến, để theo người dùng sang máy khác.
 * Planning không có khóa ngoại sang bảng danh tính (hai bounded context giữ dữ liệu riêng, ADR-003).
 */
public interface PreferencesStore {

    /** Thay toàn bộ sở thích của chủ bằng danh sách đã chuẩn hóa (rỗng = xóa). Idempotent. */
    void saveInterests(UUID ownerId, List<TripInterest> interests, Instant now);
}
