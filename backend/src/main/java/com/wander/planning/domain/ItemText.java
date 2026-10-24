package com.wander.planning.domain;

import com.wander.shared.kernel.WanderException;

/** Quy tắc văn bản của mục: tiêu đề bắt buộc, ghi chú tùy chọn (giới hạn là mặc định của implementation). */
public final class ItemText {

    public static final int MAX_TITLE = 200;
    public static final int MAX_NOTE = 2000;
    public static final int MAX_TRIP_NAME = 120;
    public static final int MAX_DESTINATION = 200;

    private ItemText() {
    }

    public static String title(String raw) {
        return required(raw, MAX_TITLE, "title");
    }

    /** Ghi chú: rỗng sau khi cắt khoảng trắng thì coi như không có (null). */
    public static String note(String raw) {
        if (raw == null) return null;
        String s = raw.strip();
        if (s.isEmpty()) return null;
        if (s.length() > MAX_NOTE) throw WanderException.invalidValue("TOO_LONG", "note");
        return s;
    }

    public static String required(String raw, int max, String field) {
        String s = raw == null ? "" : raw.strip();
        if (s.isEmpty()) throw WanderException.invalidValue("REQUIRED", field);
        if (s.length() > max) throw WanderException.invalidValue("TOO_LONG", field);
        return s;
    }
}
