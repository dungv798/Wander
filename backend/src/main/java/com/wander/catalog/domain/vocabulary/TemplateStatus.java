package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * The content review state of a sample itinerary (DR-018 N-2): {@code draft} = a draft waiting for PO approval, {@code approved} = approved by the PO,
 * {@code reference} = a reference itinerary (DR-033): assembled from places whose location was checked, it states the starting point, the assumed vehicle and the pace, and promises no times.
 * An unknown code is NOT treated as approved: {@link #fromCode} returns empty and the adapter rejects the file.
 */
public enum TemplateStatus implements CodedValue {
    DRAFT("draft", "Bản nháp"),
    APPROVED("approved", "Đã duyệt"),
    REFERENCE("reference", "Lịch trình tham khảo");

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

    /** The Vietnamese label shown to the user. */
    public String label() {
        return label;
    }

    /** The state by code in data and API; an unknown code returns empty. */
    public static Optional<TemplateStatus> fromCode(String code) {
        return CodedValue.find(TemplateStatus.class, code);
    }
}
