package com.wander.shared.web.ratelimit;

import com.wander.shared.kernel.constant.ConfigConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.ErrorKind;
import com.wander.shared.kernel.error.WanderException;
import io.micrometer.core.instrument.MeterRegistry;
import java.time.Clock;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * The abuse-prevention limits of the API (Q16 question 6, MĐ-8). The default values match the old implementation;
 * change them through the configuration {@code wander.limits.*}. The concrete numbers still wait for the review together with RG-1.
 */
public final class RateLimits {

    /**
     * Configuration of the limits: three kinds counted per hour and the public venue catalog counted per minute; a missing value uses the default
     * in {@link RateLimitConstants}.
     */
    @ConfigurationProperties(ConfigConstants.LIMITS_PREFIX)
    public record Properties(Integer identityPerHour, Integer recoveryPerHour, Integer approvalPerHour, Integer catalogPerMinute,
                             Integer approvalRequestsPerWindow, Integer writesPerMinute, Integer linkPollPerMinute) {
        public Properties {
            identityPerHour = identityPerHour == null ? RateLimitConstants.DEFAULT_IDENTITY_PER_HOUR : identityPerHour;
            recoveryPerHour = recoveryPerHour == null ? RateLimitConstants.DEFAULT_RECOVERY_PER_HOUR : recoveryPerHour;
            approvalPerHour = approvalPerHour == null ? RateLimitConstants.DEFAULT_APPROVAL_PER_HOUR : approvalPerHour;
            catalogPerMinute = catalogPerMinute == null ? RateLimitConstants.DEFAULT_CATALOG_PER_MINUTE : catalogPerMinute;
            approvalRequestsPerWindow = approvalRequestsPerWindow == null
                    ? RateLimitConstants.DEFAULT_APPROVAL_REQUESTS_PER_WINDOW : approvalRequestsPerWindow;
            writesPerMinute = writesPerMinute == null ? RateLimitConstants.DEFAULT_WRITES_PER_MINUTE : writesPerMinute;
            linkPollPerMinute = linkPollPerMinute == null ? RateLimitConstants.DEFAULT_LINK_POLL_PER_MINUTE : linkPollPerMinute;
        }
    }

    private final FixedWindowRateLimiter identity;
    private final FixedWindowRateLimiter recovery;
    private final FixedWindowRateLimiter approval;
    private final FixedWindowRateLimiter catalog;
    private final FixedWindowRateLimiter pairingRequests;
    private final FixedWindowRateLimiter stepUpRequests;
    private final FixedWindowRateLimiter writes;
    private final FixedWindowRateLimiter linkPolls;
    private final MeterRegistry meters;

    /** Creates the counters from the configuration: three one-hour-window counters and one one-minute-window counter for the venue catalog. */
    public RateLimits(Properties props, Clock clock, MeterRegistry meters) {
        this.meters = meters;
        this.identity = newLimiter(props.identityPerHour(), clock);
        this.recovery = new FixedWindowRateLimiter(props.recoveryPerHour(), RateLimitConstants.WINDOW, clock, true);
        this.approval = newLimiter(props.approvalPerHour(), clock);
        this.catalog = new FixedWindowRateLimiter(props.catalogPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock);
        this.pairingRequests = new FixedWindowRateLimiter(props.approvalRequestsPerWindow(), RateLimitConstants.APPROVAL_REQUEST_WINDOW, clock, true);
        this.stepUpRequests = new FixedWindowRateLimiter(props.approvalRequestsPerWindow(), RateLimitConstants.APPROVAL_REQUEST_WINDOW, clock);
        this.writes = new FixedWindowRateLimiter(props.writesPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock);
        this.linkPolls = new FixedWindowRateLimiter(props.linkPollPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock, true);
    }

    /** Identity creation, per address. */
    public void identity(String clientAddress) {
        check(RateLimitConstants.NAME_IDENTITY, identity, clientAddress);
    }

    /** Unauthenticated recovery / device pairing, per address. */
    public void recovery(String clientAddress) {
        check(RateLimitConstants.NAME_RECOVERY, recovery, clientAddress);
    }

    /** Approving a device pairing, re-authentication, code regeneration: per session. */
    public void approval(String sessionKey) {
        check(RateLimitConstants.NAME_APPROVAL, approval, sessionKey);
    }

    /** Creating a device pairing request (DR-018 E1: at most 3 requests per 10 minutes), per address because a new device has no identity yet. */
    public void pairingRequest(String clientAddress) {
        check(RateLimitConstants.NAME_PAIRING_REQUEST, pairingRequests, clientAddress);
    }

    /** Asking for re-authentication (DR-018 E1: at most 3 requests per 10 minutes), per identity. */
    public void stepUpRequest(String identityKey) {
        check(RateLimitConstants.NAME_STEP_UP_REQUEST, stepUpRequests, identityKey);
    }

    /** Reading the public venue catalog (no session needed yet), per address. */
    public void catalog(String clientAddress) {
        check(RateLimitConstants.NAME_CATALOG, catalog, clientAddress);
    }

    /** API writes per identity; the budget cannot be raised just by pairing more devices. */
    public void write(String identityKey) {
        check(RateLimitConstants.NAME_WRITES, writes, identityKey);
    }

    /** A new device polls the pairing-request status (it polls every second), per address; separate from the hourly recovery limit. */
    public void linkPoll(String clientAddress) {
        check(RateLimitConstants.NAME_LINK_POLL, linkPolls, clientAddress);
    }

    /** Creates a counter that allows {@code maxPerHour} hits per standard window. */
    private static FixedWindowRateLimiter newLimiter(int maxPerHour, Clock clock) {
        return new FixedWindowRateLimiter(maxPerHour, RateLimitConstants.WINDOW, clock);
    }

    /** Records one call; past the limit it counts into the metric {@code wander.ratelimit.rejected} (tag = limiter name) and throws RATE_LIMITED (429). */
    private void check(String limiterName, FixedWindowRateLimiter limiter, String key) {
        if (!limiter.hit(key)) {
            meters.counter(RateLimitConstants.REJECTED_METRIC, RateLimitConstants.LIMITER_TAG, limiterName).increment();
            throw new WanderException(ErrorKind.RATE_LIMITED, ErrorCodes.RATE_LIMITED, ErrorMessages.RATE_LIMITED, null, null);
        }
    }
}
