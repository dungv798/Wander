package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * "Ai đi" của chuyến (DR-018 F2, ADR-014): chọn một, có thể trống. Chỉ là nhãn, chưa phải danh sách thành viên (Q6–Q9 là 1b).
 * Thứ tự khai báo là thứ tự hiển thị. Đổi mã hoặc bỏ giá trị phải kèm migration dữ liệu cho cột {@code trips.kind}.
 */
public enum TripKind implements CodedValue {
    SOLO("solo", "Một mình"),
    FAMILY("family", "Gia đình"),
    FRIENDS("friends", "Bạn bè"),
    COUPLE("couple", "Cặp đôi"),
    WORK("work", "Công việc");

    private final String code;
    private final String label;

    TripKind(String code, String label) {
        this.code = code;
        this.label = label;
    }

    @Override
    public String code() {
        return code;
    }

    /** Nhãn tiếng Việt hiển thị cho người dùng. */
    public String label() {
        return label;
    }

    /** Kiểu theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<TripKind> fromCode(String code) {
        return CodedValue.find(TripKind.class, code);
    }
}
