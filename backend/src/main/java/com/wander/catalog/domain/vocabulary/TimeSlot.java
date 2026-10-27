package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Buổi trong ngày. Dùng cho gợi ý "nên đi buổi nào". */
public enum TimeSlot implements CodedValue {
    MORNING("sang"), NOON("trua"), AFTERNOON("chieu"), EVENING("toi");

    private final String code;

    TimeSlot(String code) {
        this.code = code;
    }

    @Override
    public String code() {
        return code;
    }

    /** Buổi theo mã ngắn trong dữ liệu; mã lạ trả rỗng. */
    public static Optional<TimeSlot> fromCode(String code) {
        return CodedValue.find(TimeSlot.class, code);
    }
}
