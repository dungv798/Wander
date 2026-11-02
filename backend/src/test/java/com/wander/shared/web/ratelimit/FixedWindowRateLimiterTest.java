package com.wander.shared.web.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Trần bộ nhớ và tính nguyên tử của bộ đếm khi nhiều request đến cùng lúc. */
class FixedWindowRateLimiterTest {

    @Test
    @DisplayName("bảng đầy từ chối khóa mới, không bỏ quota của khóa cũ hoặc vượt trần bộ nhớ")
    void capacityIsAHardLimit() {
        var limiter = new FixedWindowRateLimiter(2, Duration.ofHours(1), Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));
        for (int i = 0; i < RateLimitConstants.MAX_TRACKED_KEYS; i++) assertThat(limiter.hit("key-" + i)).isTrue();
        for (int i = 0; i < 100; i++) assertThat(limiter.hit("overflow-" + i)).isFalse();
        assertThat(limiter.size()).isEqualTo(RateLimitConstants.MAX_TRACKED_KEYS);
        assertThat(limiter.hit("key-0")).isTrue();
        assertThat(limiter.hit("key-0")).isFalse();
    }

    @Test
    @DisplayName("request đồng thời chỉ được dùng đúng ngân sách, không mất lượt đếm")
    void concurrentRequestsDoNotBypassQuota() throws Exception {
        var limiter = new FixedWindowRateLimiter(7, Duration.ofHours(1), Clock.systemUTC());
        var allowed = new AtomicInteger();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            for (int i = 0; i < 200; i++) executor.submit(() -> { if (limiter.hit("same")) allowed.incrementAndGet(); });
        }
        assertThat(allowed).hasValue(7);
        assertThat(limiter.size()).isEqualTo(1);
    }
}
