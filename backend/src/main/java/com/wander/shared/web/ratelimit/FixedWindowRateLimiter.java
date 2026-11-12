package com.wander.shared.web.ratelimit;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * A fixed-window counter per key (address or session), kept in the memory of one process.
 * Known limit: when several copies run (for example several ECS tasks) each copy counts on its own; then a shared store is needed
 * (Redis/ElastiCache) — xem docs/architecture/aws-deployment.md.
 */
public final class FixedWindowRateLimiter {

    private final int max;
    private final long windowMs;
    private final Clock clock;
    private final boolean sharedOverflow;
    private final Map<String, Window> hits = new ConcurrentHashMap<>();
    private long nextPruneAt;

    /** One counting window: its start time and the number of hits recorded. */
    private record Window(long start, int count) {
    }

    /** Creates a closed counter that refuses new keys when the table is full: at most {@code max} hits in each window of {@code window}. */
    public FixedWindowRateLimiter(int max, Duration window, Clock clock) {
        this(max, window, clock, false);
    }

    /**
     * Creates a counter; {@code sharedOverflow} turns on a soft policy for the recovery channel: when the table is full, new keys share one
     * overflow bucket with a budget of {@link RateLimitConstants#OVERFLOW_BUDGET_FACTOR} times {@code max}, instead of being refused right away.
     */
    public FixedWindowRateLimiter(int max, Duration window, Clock clock, boolean sharedOverflow) {
        this.max = max;
        this.windowMs = window.toMillis();
        this.clock = clock;
        this.sharedOverflow = sharedOverflow;
    }

    /** Records one hit; returns false if the limit was exceeded in the current window. */
    public synchronized boolean hit(String key) {
        long now = clock.millis();
        if (hits.size() >= RateLimitConstants.MAX_TRACKED_KEYS && now >= nextPruneAt) {
            pruneExpired(now);
            nextPruneAt = now + RateLimitConstants.PRUNE_INTERVAL.toMillis();
        }
        String slot = key;
        int limit = max;
        if (!hits.containsKey(key) && hits.size() >= RateLimitConstants.MAX_TRACKED_KEYS) {
            if (!sharedOverflow) return false;
            slot = RateLimitConstants.OVERFLOW_KEY;
            limit = max * RateLimitConstants.OVERFLOW_BUDGET_FACTOR;
        }
        int cap = limit;
        Window window = hits.compute(slot, (k, old) ->
                isExpired(old, now) ? new Window(now, 1) : new Window(old.start(), Math.min(old.count(), cap) + 1));
        return window.count() <= limit;
    }

    /** The number of keys being tracked (used by tests and memory monitoring). */
    public int size() {
        return hits.size();
    }

    /** The window is missing or has expired at time {@code now}. */
    private boolean isExpired(Window window, long now) {
        return window == null || now - window.start() >= windowMs;
    }

    /** Removes every expired window so memory does not grow. */
    private void pruneExpired(long now) {
        hits.values().removeIf(window -> isExpired(window, now));
    }
}
