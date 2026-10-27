package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** Thao tác thời gian dùng chung, không phụ thuộc framework. */
public final class Timestamps {

    private static final DateTimeFormatter ISO_MILLIS =
            DateTimeFormatter.ofPattern(CommonConstants.ISO_INSTANT_MILLIS_PATTERN).withZone(ZoneOffset.UTC);

    private Timestamps() {
    }

    /** Lưu thời điểm ở độ chính xác mili-giây (khớp kiểu timestamptz và định dạng API). */
    public static Instant truncate(Instant t) {
        return t.truncatedTo(ChronoUnit.MILLIS);
    }

    /** Thời điểm hiện tại theo đồng hồ đã cho, cắt về mili-giây; mọi service dùng hàm này thay vì tự viết lại. */
    public static Instant now(Clock clock) {
        return truncate(clock.instant());
    }

    /** Định dạng ISO-8601 UTC luôn có mili-giây, ví dụ 2026-10-24T01:02:03.000Z; null giữ nguyên null. */
    public static String format(Instant t) {
        return t == null ? null : ISO_MILLIS.format(t);
    }
}
