package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Nhãn biên tập thay cho điểm sao (DR-007): ý kiến của Wander, không phải đánh giá của người dùng.
 * Không có số sao khi chưa có nguồn dữ liệu thật (ADR-009).
 */
public enum Verdict implements CodedValue {
    MUST_SEE("must", "Nên ghé"),
    WORTH_IT("worth", "Đáng đi"),
    IF_CONVENIENT("ifconv", "Chỉ ghé nếu tiện");

    private final String code;
    private final String label;

    Verdict(String code, String label) {
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

    /** Nhãn theo mã ngắn trong dữ liệu; mã lạ trả rỗng. */
    public static Optional<Verdict> fromCode(String code) {
        return CodedValue.find(Verdict.class, code);
    }
}
