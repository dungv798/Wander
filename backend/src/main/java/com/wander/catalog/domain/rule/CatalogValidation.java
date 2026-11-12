package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.shared.kernel.util.Texts;
import java.util.Collection;

/** Editorial data checks shared by the catalog's domain classes (one place, to avoid repetition). */
public final class CatalogValidation {

    private CatalogValidation() {
    }

    /** Throws an error with the formatted message if the condition is false. */
    public static void require(boolean condition, String messageTemplate, Object... arguments) {
        if (!condition) throw new IllegalArgumentException(messageTemplate.formatted(arguments));
    }

    /** A required string with content; returns the trimmed string. */
    public static String requiredText(String value, String label) {
        require(!Texts.isNullOrBlank(value), CatalogMessages.FIELD_REQUIRED, label);
        return value.trim();
    }

    /** A required string with content and not longer than {@code maxLength}; returns the trimmed string. */
    public static String requiredText(String value, String label, int maxLength) {
        String trimmed = requiredText(value, label);
        require(trimmed.length() <= maxLength, CatalogMessages.FIELD_TOO_LONG, label, trimmed.length(), maxLength);
        return trimmed;
    }

    /** Every value is a month 1..12 (not null); otherwise throws an error with a message formatted by {@code owner}. */
    public static void requireMonths(Collection<Integer> months, String messageTemplate, String owner) {
        boolean allValid = months.stream().allMatch(CatalogValidation::isMonth);
        require(allValid, messageTemplate, owner);
    }

    /** The number is a valid month (1..12). */
    private static boolean isMonth(Integer month) {
        return month != null && month >= CatalogConstants.MONTH_MIN && month <= CatalogConstants.MONTH_MAX;
    }
}
