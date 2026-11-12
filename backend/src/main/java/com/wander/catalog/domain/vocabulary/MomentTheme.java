package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * The theme of a 'moment' in the destination photo library (DR-034): an atmosphere photo (market, food, people...),
 * that does not claim to be one specific place. An unknown code is NOT accepted: {@link #fromCode} returns empty and the adapter rejects the file.
 */
public enum MomentTheme implements CodedValue {
    MARKET("cho", "Chợ & phố"),
    FOOD("mon-an", "Món ăn"),
    PEOPLE("nguoi", "Con người"),
    FESTIVAL("le-hoi", "Lễ hội & văn hóa"),
    CRAFT("nghe", "Nghề & đời sống"),
    JOURNEY("hanh-trinh", "Hành trình");

    private final String code;
    private final String label;

    MomentTheme(String code, String label) {
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

    /** The theme by code in data and API; an unknown code returns empty. */
    public static Optional<MomentTheme> fromCode(String code) {
        return CodedValue.find(MomentTheme.class, code);
    }
}
