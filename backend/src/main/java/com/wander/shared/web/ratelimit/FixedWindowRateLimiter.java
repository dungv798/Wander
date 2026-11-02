package com.wander.shared.web.ratelimit;

import java.time.Clock;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bộ đếm cửa sổ cố định theo khóa (địa chỉ hoặc phiên), lưu trong bộ nhớ của một tiến trình.
 * Giới hạn đã biết: chạy nhiều bản (ví dụ nhiều task ECS) thì mỗi bản đếm riêng; khi đó cần kho dùng chung
 * (Redis/ElastiCache) — xem docs/architecture/aws-deployment.md.
 */
public final class FixedWindowRateLimiter {

    private final int max;
    private final long windowMs;
    private final Clock clock;
    private final boolean sharedOverflow;
    private final Map<String, Window> hits = new ConcurrentHashMap<>();
    private long nextPruneAt;

    /** Một cửa sổ đếm: thời điểm bắt đầu và số lần đã ghi nhận. */
    private record Window(long start, int count) {
    }

    /** Tạo bộ đếm đóng cửa với khóa mới khi bảng đầy: tối đa {@code max} lần trong mỗi cửa sổ {@code window}. */
    public FixedWindowRateLimiter(int max, Duration window, Clock clock) {
        this(max, window, clock, false);
    }

    /**
     * Tạo bộ đếm; {@code sharedOverflow} bật chính sách mềm cho kênh khôi phục: khi bảng đầy, khóa mới dùng chung một xô
     * tràn có ngân sách {@link RateLimitConstants#OVERFLOW_BUDGET_FACTOR} lần {@code max}, thay vì bị từ chối ngay.
     */
    public FixedWindowRateLimiter(int max, Duration window, Clock clock, boolean sharedOverflow) {
        this.max = max;
        this.windowMs = window.toMillis();
        this.clock = clock;
        this.sharedOverflow = sharedOverflow;
    }

    /** Ghi nhận một lần; trả về false nếu đã vượt giới hạn trong cửa sổ hiện tại. */
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

    /** Số khóa đang được theo dõi (dùng cho test và theo dõi bộ nhớ). */
    public int size() {
        return hits.size();
    }

    /** Cửa sổ chưa có hoặc đã hết hạn tại thời điểm {@code now}. */
    private boolean isExpired(Window window, long now) {
        return window == null || now - window.start() >= windowMs;
    }

    /** Xóa mọi cửa sổ đã hết hạn để bộ nhớ không phình ra. */
    private void pruneExpired(long now) {
        hits.values().removeIf(window -> isExpired(window, now));
    }
}
