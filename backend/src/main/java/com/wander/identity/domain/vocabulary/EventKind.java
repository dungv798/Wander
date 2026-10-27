package com.wander.identity.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Loại sự kiện trong "Hoạt động gần đây" (BE-11). {@link #raisesAlert()} cho biết sự kiện làm bật cờ "chưa xem": chỉ khi có thiết bị
 * MỚI được thêm (ghép hoặc khôi phục), vì đó là điều chủ cần biết để thu hồi nếu không phải mình.
 */
public enum EventKind implements CodedValue {
    CREATED("created", false),
    CODE("code", false),
    PAIRED("paired", true),
    REVOKED("revoked", false),
    RECOVERED("recovered", true);

    private final String code;
    private final boolean raisesAlert;

    EventKind(String code, boolean raisesAlert) {
        this.code = code;
        this.raisesAlert = raisesAlert;
    }

    @Override
    public String code() {
        return code;
    }

    /** Sự kiện này có làm bật cờ "chưa xem" không. */
    public boolean raisesAlert() {
        return raisesAlert;
    }

    /** Loại theo mã trong dữ liệu; mã lạ trả rỗng. */
    public static Optional<EventKind> fromCode(String code) {
        return CodedValue.find(EventKind.class, code);
    }
}
