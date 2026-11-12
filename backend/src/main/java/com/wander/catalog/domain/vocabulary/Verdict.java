package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * An editorial label in place of a star score (DR-007): Wander's opinion, not a user rating.
 * There is no star number while there is no real data source (ADR-009).
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

    /** The Vietnamese label shown to the user. */
    public String label() {
        return label;
    }

    /** The label by short code in the data; an unknown code returns empty. */
    public static Optional<Verdict> fromCode(String code) {
        return CodedValue.find(Verdict.class, code);
    }
}
