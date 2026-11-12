package com.wander.shared.kernel.util;

/** Small string operations that several modules need (one single place so they are not rewritten). */
public final class Texts {

    private Texts() {
    }

    /** The string is null, empty or made only of whitespace. */
    public static boolean isNullOrBlank(String text) {
        return text == null || text.isBlank();
    }

    /** Trims whitespace at both ends; null becomes an empty string. */
    public static String trimToEmpty(String text) {
        return text == null ? "" : text.trim();
    }

    /** Trims whitespace at both ends; null or only whitespace becomes null. */
    public static String trimToNull(String text) {
        return isNullOrBlank(text) ? null : text.trim();
    }
}
