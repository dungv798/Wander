package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/** Shared time operations, independent of any framework. */
public final class Timestamps {

    private static final DateTimeFormatter ISO_MILLIS =
            DateTimeFormatter.ofPattern(CommonConstants.ISO_INSTANT_MILLIS_PATTERN).withZone(ZoneOffset.UTC);

    private Timestamps() {
    }

    /** Stores an instant at millisecond precision (matches the timestamptz type and the API format). */
    public static Instant truncate(Instant t) {
        return t.truncatedTo(ChronoUnit.MILLIS);
    }

    /** The current instant by the given clock, truncated to milliseconds; every service uses this instead of rewriting it. */
    public static Instant now(Clock clock) {
        return truncate(clock.instant());
    }

    /** ISO-8601 UTC format that always has milliseconds, for example 2026-10-24T01:02:03.000Z; null stays null. */
    public static String format(Instant t) {
        return t == null ? null : ISO_MILLIS.format(t);
    }
}
