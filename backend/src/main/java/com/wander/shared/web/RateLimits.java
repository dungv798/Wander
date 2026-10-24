package com.wander.shared.web;

import com.wander.shared.kernel.ErrorKind;
import com.wander.shared.kernel.WanderException;
import java.time.Clock;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Ba giới hạn chống lạm dụng của API (Q16 câu 6, MĐ-8). Giá trị mặc định khớp bản cài đặt cũ;
 * đổi qua cấu hình {@code wander.limits.*}. Con số cụ thể vẫn chờ rà soát cùng RG-1.
 */
public final class RateLimits {

    @ConfigurationProperties("wander.limits")
    public record Properties(Integer identityPerHour, Integer recoveryPerHour, Integer approvalPerHour) {
        public Properties {
            identityPerHour = identityPerHour == null ? 30 : identityPerHour;
            recoveryPerHour = recoveryPerHour == null ? 30 : recoveryPerHour;
            approvalPerHour = approvalPerHour == null ? 20 : approvalPerHour;
        }
    }

    private final FixedWindowRateLimiter identity;
    private final FixedWindowRateLimiter recovery;
    private final FixedWindowRateLimiter approval;

    public RateLimits(Properties props, Clock clock) {
        Duration hour = Duration.ofHours(1);
        this.identity = new FixedWindowRateLimiter(props.identityPerHour(), hour, clock);
        this.recovery = new FixedWindowRateLimiter(props.recoveryPerHour(), hour, clock);
        this.approval = new FixedWindowRateLimiter(props.approvalPerHour(), hour, clock);
    }

    /** Tạo danh tính, theo địa chỉ. */
    public void identity(String clientAddress) {
        check(identity, clientAddress);
    }

    /** Khôi phục / ghép thiết bị chưa xác thực, theo địa chỉ. */
    public void recovery(String clientAddress) {
        check(recovery, clientAddress);
    }

    /** Duyệt ghép thiết bị, xác thực lại, tái tạo mã: theo phiên. */
    public void approval(String sessionKey) {
        check(approval, sessionKey);
    }

    private static void check(FixedWindowRateLimiter limiter, String key) {
        if (!limiter.hit(key)) {
            throw new WanderException(ErrorKind.RATE_LIMITED, "RATE_LIMITED", "Bạn thao tác quá nhanh. Hãy thử lại sau.", null, null);
        }
    }
}
