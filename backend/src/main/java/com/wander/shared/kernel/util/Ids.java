package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/** Identifiers in UUID form. */
public final class Ids {

    private static final Pattern UUID_TEXT = Pattern.compile(CommonConstants.UUID_TEXT_REGEX);

    private Ids() {
    }

    /** An id from a URL/JSON: a string that is not a UUID counts as non-existent (404), not as 400. */
    public static Optional<UUID> parse(String raw) {
        if (raw == null || !UUID_TEXT.matcher(raw).matches()) return Optional.empty();
        return Optional.of(UUID.fromString(raw));
    }
}
