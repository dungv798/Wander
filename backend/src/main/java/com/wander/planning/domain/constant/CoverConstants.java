package com.wander.planning.domain.constant;

import java.util.Set;

/** Trip-cover constants at the feature tier, independent of the catalog (DR-031). */
public final class CoverConstants {
    /** Cover kind: a photo chosen from the catalog. */
    public static final String PHOTO = "photo";
    /** Cover kind: a built-in gradient. */
    public static final String GRADIENT = "gradient";
    /** Six fixed gradient codes, matching the UI tokens --cover-1..6. */
    public static final Set<String> GRADIENT_REFS = Set.of("cover-1", "cover-2", "cover-3", "cover-4", "cover-5", "cover-6");
    /** A photo slug: lowercase ASCII, digits and single hyphens; URLs/paths are not accepted. */
    public static final String PHOTO_REF_PATTERN = "[a-z0-9]+(?:-[a-z0-9]+)*";
    /** Maximum length of a photo id, in characters. */
    public static final int MAX_REF_LENGTH = 120;
    /** Length of the column: kind, separator and id. */
    public static final int COLUMN_LENGTH = 130;
    /** Separator of kind and id in the storage column. */
    public static final String SEPARATOR = ":";

    private CoverConstants() {
    }
}
