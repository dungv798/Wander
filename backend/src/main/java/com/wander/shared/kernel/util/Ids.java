package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/** Mã định danh dạng UUID. */
public final class Ids {

    private static final Pattern UUID_TEXT = Pattern.compile(CommonConstants.UUID_TEXT_REGEX);

    private Ids() {
    }

    /** Mã định danh từ URL/JSON: chuỗi không phải UUID coi như không tồn tại (404), không phải 400. */
    public static Optional<UUID> parse(String raw) {
        if (raw == null || !UUID_TEXT.matcher(raw).matches()) return Optional.empty();
        return Optional.of(UUID.fromString(raw));
    }
}
