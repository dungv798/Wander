package com.wander.shared.kernel;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** Tiện ích thời gian dùng chung, không phụ thuộc framework. */
public final class Timestamps {

    private static final DateTimeFormatter ISO_MILLIS =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

    private Timestamps() {
    }

    /** Lưu thời điểm ở độ chính xác mili-giây (khớp kiểu timestamptz và định dạng API). */
    public static Instant truncate(Instant t) {
        return t.truncatedTo(ChronoUnit.MILLIS);
    }

    /** Định dạng ISO-8601 UTC luôn có mili-giây, ví dụ 2026-10-24T01:02:03.000Z. */
    public static String format(Instant t) {
        return t == null ? null : ISO_MILLIS.format(t);
    }
}
