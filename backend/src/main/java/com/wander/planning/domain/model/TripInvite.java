package com.wander.planning.domain.model;

import java.time.Instant;
import java.util.UUID;

/** Liên kết mời của chuyến: chỉ giữ BĂM của mã (mã 256 bit chỉ hiện đúng một lần lúc tạo). */
public record TripInvite(UUID id, String codeHash, Instant createdAt, Instant expiresAt, Instant revokedAt) {

    /** Đã bị thu hồi? */
    public boolean isRevoked() {
        return revokedAt != null;
    }

    /** Còn dùng được tại thời điểm {@code now}: chưa thu hồi và chưa hết hạn. */
    public boolean isActiveAt(Instant now) {
        return !isRevoked() && now.isBefore(expiresAt);
    }

    /** Bản sao đã thu hồi tại {@code now} (giữ nguyên nếu đã thu hồi). */
    public TripInvite revoked(Instant now) {
        return isRevoked() ? this : new TripInvite(id, codeHash, createdAt, expiresAt, now);
    }
}
