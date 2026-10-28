package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Trạng thái một đề nghị xóa (H2): chờ duyệt, được đồng ý, bị từ chối (Q9: người đề nghị thấy "Đã từ chối", không lý do). Đổi mã phải kèm migration. */
public enum RequestStatus implements CodedValue {
    PENDING("pending"),
    APPROVED("approved"),
    REJECTED("rejected");

    private final String code;

    RequestStatus(String code) {
        this.code = code;
    }

    @Override
    public String code() {
        return code;
    }

    /** Trạng thái theo mã đã lưu; mã lạ thì trống. */
    public static Optional<RequestStatus> fromCode(String code) {
        return CodedValue.find(RequestStatus.class, code);
    }
}
