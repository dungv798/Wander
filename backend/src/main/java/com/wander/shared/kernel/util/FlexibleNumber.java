package com.wander.shared.kernel.util;

/**
 * A request value that may arrive as a JSON number or as a JSON string (for example a cost sent as {@code 150} or {@code "150"}).
 * The API keeps both spellings accepted; whether a particular text such as {@code "1.5"} or {@code "150k"} is valid is decided
 * by the business rule that consumes it, not by the JSON layer. Exactly one of the two members is non-null.
 *
 * @param number the value when the JSON token was a number
 * @param text   the value when the JSON token was a string
 */
public record FlexibleNumber(Number number, String text) {

    /** A value sent as a JSON number. */
    public static FlexibleNumber ofNumber(Number number) {
        return new FlexibleNumber(number, null);
    }

    /** A value sent as a JSON string. */
    public static FlexibleNumber ofText(String text) {
        return new FlexibleNumber(null, text);
    }

    /** Whether the value is an empty string (which the API treats like "not provided"). */
    public boolean isBlankText() {
        return text != null && text.isEmpty();
    }
}
