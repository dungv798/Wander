package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.CatalogConstants;
import java.text.Normalizer;
import java.util.Locale;

/** Normalizes a string for searching that ignores case and Vietnamese accents (the query 'ha giang' matches the accented name of Ha Giang). */
public final class SearchText {

    private static final char D_STROKE_LOWER = 'đ';
    private static final char D_STROKE_UPPER = 'Đ';

    private SearchText() {
    }

    /** The comparison form of a string: accents removed, the Vietnamese d-with-stroke becomes d, lowercase, trimmed; null becomes an empty string. */
    public static String normalize(String text) {
        if (text == null) return "";
        String trimmed = text.trim().replace(D_STROKE_LOWER, 'd').replace(D_STROKE_UPPER, 'D');
        return Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll(CatalogConstants.COMBINING_MARKS_REGEX, "")
                .toLowerCase(Locale.ROOT);
    }
}
