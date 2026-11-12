package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Distinguishes a real service address from a dish idea; a coffee shop is not by default a meal. */
public enum VenueKind implements CodedValue {
    RESTAURANT("restaurant", "Quán ăn", PlaceCategory.AM),
    CAFE("cafe", "Quán cà phê", PlaceCategory.AM),
    BAR("bar", "Quán bar", PlaceCategory.AM),
    LODGING("lodging", "Chỗ ở", PlaceCategory.LUU);

    private final String code;
    private final String label;
    private final PlaceCategory category;

    VenueKind(String code, String label, PlaceCategory category) {
        this.code = code;
        this.label = label;
        this.category = category;
    }

    @Override
    public String code() { return code; }

    /** The kind label to display on the detail card. */
    public String label() { return label; }

    /** The matching discovery group; it creates no new place kind or module. */
    public PlaceCategory category() { return category; }

    /** An unknown service code is not silently turned into a restaurant. */
    public static Optional<VenueKind> fromCode(String code) { return CodedValue.find(VenueKind.class, code); }
}
