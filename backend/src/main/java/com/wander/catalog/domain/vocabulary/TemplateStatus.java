package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Trạng thái duyệt nội dung của một lịch mẫu (DR-018 N-2): {@code draft} = bản nháp chờ PO duyệt, {@code approved} = PO đã duyệt.
 * Mã lạ KHÔNG được coi là đã duyệt: {@link #fromCode} trả rỗng và adapter từ chối tệp.
 */
public enum TemplateStatus implements CodedValue {
    DRAFT("draft", "Bản nháp"),
    APPROVED("approved", "Đã duyệt");

    private final String code;
    private final String label;

    TemplateStatus(String code, String label) {
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

    /** Trạng thái theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<TemplateStatus> fromCode(String code) {
        return CodedValue.find(TemplateStatus.class, code);
    }
}
