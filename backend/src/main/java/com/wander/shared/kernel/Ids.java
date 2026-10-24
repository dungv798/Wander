package com.wander.shared.kernel;

import java.util.Optional;
import java.util.UUID;

/** Mã định danh dạng UUID. */
public final class Ids {

    private static final java.util.regex.Pattern UUID_TEXT =
            java.util.regex.Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");

    private Ids() {
    }

    /** Mã định danh từ URL/JSON: chuỗi không phải UUID coi như không tồn tại (404), không phải 400. */
    public static Optional<UUID> parse(String raw) {
        if (raw == null || !UUID_TEXT.matcher(raw).matches()) return Optional.empty();
        return Optional.of(UUID.fromString(raw));
    }
}
