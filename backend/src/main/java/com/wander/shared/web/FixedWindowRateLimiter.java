package com.wander.shared.web;

import java.time.Clock;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Bộ đếm cửa sổ cố định theo khóa (địa chỉ hoặc phiên), lưu trong bộ nhớ của một tiến trình.
 * Giới hạn đã biết: chạy nhiều bản (ví dụ nhiều task ECS) thì mỗi bản đếm riêng; khi đó cần kho dùng chung
 * (Redis/ElastiCache) — xem docs/architecture/aws-deployment.md.
 */
public final class FixedWindowRateLimiter {

    private static final int PRUNE_AT = 10_000;

    private final int max;
    private final long windowMs;
    private final Clock clock;
    private final Map<String, Window> hits = new ConcurrentHashMap<>();

    private record Window(long start, int count) {
    }

    public FixedWindowRateLimiter(int max, Duration window, Clock clock) {
        this.max = max;
        this.windowMs = window.toMillis();
        this.clock = clock;
    }

    /** Ghi nhận một lần; trả về false nếu đã vượt giới hạn trong cửa sổ hiện tại. */
    public boolean hit(String key) {
        long now = clock.millis();
        if (hits.size() >= PRUNE_AT) prune(now);
        Window w = hits.compute(key, (k, old) ->
                old == null || now - old.start() >= windowMs ? new Window(now, 1) : new Window(old.start(), old.count() + 1));
        return w.count() <= max;
    }

    public int size() {
        return hits.size();
    }

    private void prune(long now) {
        for (Iterator<Map.Entry<String, Window>> it = hits.entrySet().iterator(); it.hasNext(); ) {
            if (now - it.next().getValue().start() >= windowMs) it.remove();
        }
    }
}
