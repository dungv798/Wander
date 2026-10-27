package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Nhịp chuyến (Q11, DR-002): nhãn hiển thị, chọn một. Không có hành vi cảnh báo "ngày quá dày" (sẽ là gợi ý tự động, plan §7.2). */
public enum TripPace implements CodedValue {
    RELAXED("relaxed", "Thoải mái"),
    MODERATE("moderate", "Vừa"),
    PACKED("packed", "Dày");

    private final String code;
    private final String label;

    TripPace(String code, String label) {
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

    /** Nhịp theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<TripPace> fromCode(String code) {
        return CodedValue.find(TripPace.class, code);
    }
}
