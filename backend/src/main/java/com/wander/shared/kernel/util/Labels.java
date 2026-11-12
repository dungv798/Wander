package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Labels the user DECLARES THEMSELF (device name, display name): not verified, so they only help people recognize each other and are never identity evidence.
 * One single place that normalizes them so modules do not rewrite it (DRY-1).
 */
public final class Labels {

    private static final Pattern WHITESPACE = Pattern.compile(CommonConstants.LABEL_WHITESPACE_REGEX);

    private Labels() {
    }

    /**
     * Normalizes to NFC, collapses all whitespace into one space and trims both ends. Control, format/invisible characters (RTL override,
     * zero-width, BOM...), line/paragraph separators, private-use or unassigned characters => MALFORMED; more than {@code maxCodePoints} (counted in code points) => TOO_LONG.
     * Returns an empty string if there is only whitespace; the caller decides whether empty is an error or 'not set'.
     */
    public static String normalize(String raw, int maxCodePoints, String field) {
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFC);
        if (normalized.codePoints().anyMatch(Labels::isForbidden)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        String text = WHITESPACE.matcher(normalized).replaceAll(CommonConstants.SINGLE_SPACE).strip();
        if (text.codePointCount(0, text.length()) > maxCodePoints) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, field);
        return text;
    }

    /** Characters not allowed in a label: control, format/invisible, line/paragraph separators, surrogate, private-use, unassigned. */
    private static boolean isForbidden(int codePoint) {
        if (Character.isISOControl(codePoint)) return true;
        return switch (Character.getType(codePoint)) {
            case Character.FORMAT, Character.LINE_SEPARATOR, Character.PARAGRAPH_SEPARATOR, Character.SURROGATE,
                    Character.PRIVATE_USE, Character.UNASSIGNED -> true;
            default -> false;
        };
    }
}
