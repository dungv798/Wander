package com.wander.shared.web.ratelimit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.error.WanderException;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import java.time.Clock;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** A call refused by a limiter is counted under that limiter's name; accepted calls are not counted. */
class RateLimitMetricsTest {

    @Test
    @DisplayName("the counter wander.ratelimit.rejected{limiter} counts refused calls only, per limiter")
    void countsRejectionsPerLimiter() {
        SimpleMeterRegistry meters = new SimpleMeterRegistry();
        RateLimits.Properties props = new RateLimits.Properties(1, null, null, null, null, 1, null);
        RateLimits limits = new RateLimits(props, Clock.systemUTC(), meters);

        limits.identity("203.0.113.9");
        assertThat(meters.find("wander.ratelimit.rejected").counters()).isEmpty();

        assertThatThrownBy(() -> limits.identity("203.0.113.9")).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> limits.identity("203.0.113.9")).isInstanceOf(WanderException.class);
        limits.write("identity-a");
        assertThatThrownBy(() -> limits.write("identity-a")).isInstanceOf(WanderException.class);

        assertThat(meters.get("wander.ratelimit.rejected").tag("limiter", "identity").counter().count()).isEqualTo(2.0);
        assertThat(meters.get("wander.ratelimit.rejected").tag("limiter", "writes").counter().count()).isEqualTo(1.0);
    }
}
