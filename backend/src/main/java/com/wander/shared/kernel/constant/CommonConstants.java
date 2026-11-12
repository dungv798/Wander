package com.wander.shared.kernel.constant;

/**
 * Constants of the BASE tier (common base): shared values with no business meaning, usable by every module.
 * Convention: docs/architecture/backend-conventions.md (CON-1). Values with a system meaning are in {@link SystemConstants},
 * values specific to one feature are in a {@code *Constants} file next to that feature.
 */
public final class CommonConstants {

    /** Number of bytes in a kilobyte. */
    public static final int BYTES_PER_KILOBYTE = 1024;

    /** The comma used to split a list of strings. */
    public static final String COMMA = ",";

    /** The slash used to join paths. */
    public static final String SLASH = "/";

    /** A UUID string: eight-four-four-four-twelve hex characters. */
    public static final String UUID_TEXT_REGEX =
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";

    /** ISO-8601 UTC pattern that always has milliseconds, for example 2026-10-24T01:02:03.000Z. */
    public static final String ISO_INSTANT_MILLIS_PATTERN = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    /** Every whitespace string (including Unicode whitespace) in a self-declared label. */
    public static final String LABEL_WHITESPACE_REGEX = "[\\p{Zs}\\s]+";

    /** A single space. */
    public static final String SINGLE_SPACE = " ";

    private CommonConstants() {
    }
}
