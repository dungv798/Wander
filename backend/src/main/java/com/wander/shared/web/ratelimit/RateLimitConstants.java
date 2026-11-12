package com.wander.shared.web.ratelimit;

import java.time.Duration;

/** Constants specific to the rate-limit feature ({@link RateLimits}, {@link FixedWindowRateLimiter}). */
final class RateLimitConstants {

    /** Maximum number of identity creations per hour for one address (default, changed through configuration). */
    /** Name of the counter of rejected calls; tagged with the limiter that rejected them. */
    static final String REJECTED_METRIC = "wander.ratelimit.rejected";

    /** Tag name that holds the limiter. */
    static final String LIMITER_TAG = "limiter";

    /** Limiter names used as the tag value. */
    static final String NAME_IDENTITY = "identity";
    /** Unauthenticated recovery and device pairing, per address. */
    static final String NAME_RECOVERY = "recovery";
    /** Approvals, step-up and recovery-code regeneration, per session. */
    static final String NAME_APPROVAL = "approval";
    /** Public catalog reads, per address. */
    static final String NAME_CATALOG = "catalog";
    /** Pairing requests, per address. */
    static final String NAME_PAIRING_REQUEST = "pairing-request";
    /** Step-up requests, per identity. */
    static final String NAME_STEP_UP_REQUEST = "step-up-request";
    /** API writes, per identity. */
    static final String NAME_WRITES = "writes";
    /** Pairing status polls, per address. */
    static final String NAME_LINK_POLL = "link-poll";

    static final int DEFAULT_IDENTITY_PER_HOUR = 30;

    /** Maximum number of unauthenticated recoveries/device pairings per hour for one address. */
    static final int DEFAULT_RECOVERY_PER_HOUR = 30;

    /** Maximum number of approvals/re-authentications/code regenerations per hour for one session. */
    static final int DEFAULT_APPROVAL_PER_HOUR = 20;

    /** Maximum number of public venue-catalog reads per minute for one address (DR-008 Q-a; default, changed through configuration). */
    static final int DEFAULT_CATALOG_PER_MINUTE = 120;

    /** The API write-request budget per minute for one identity, shared across devices. */
    static final int DEFAULT_WRITES_PER_MINUTE = 120;

    /**
     * Maximum number of times a new device polls the pairing-request status per minute for one address. The new device polls every second
     * (60 per minute) so it needs its own ceiling, not shared with the hourly recovery limit.
     */
    static final int DEFAULT_LINK_POLL_PER_MINUTE = 120;

    /** Maximum number of approval requests (device pairing, asking for re-authentication) per 10-minute window (DR-018 E1). */
    static final int DEFAULT_APPROVAL_REQUESTS_PER_WINDOW = 3;

    /** Length of the window that counts approval requests. */
    static final Duration APPROVAL_REQUEST_WINDOW = Duration.ofMinutes(10);

    /** Length of the counting window. */
    static final Duration WINDOW = Duration.ofHours(1);

    /** Length of the counting window of the public venue catalog. */
    static final Duration CATALOG_WINDOW = Duration.ofMinutes(1);

    /** Maximum number of tracked keys before expired windows are cleaned up. */
    static final int MAX_TRACKED_KEYS = 10_000;

    /** Key of the shared overflow bucket used when the table is full (recovery channel only); it cannot clash with a real address because it contains the character '#'. */
    static final String OVERFLOW_KEY = "#overflow";

    /** The overflow bucket's budget as a multiple of the one-key limit. */
    static final int OVERFLOW_BUDGET_FACTOR = 20;

    /** Minimum interval between two sweeps when the key table is already full. */
    static final Duration PRUNE_INTERVAL = Duration.ofSeconds(1);

    private RateLimitConstants() {
    }
}
