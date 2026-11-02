package com.wander.shared.web.ratelimit;

import com.wander.shared.kernel.constant.ConfigConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.ErrorKind;
import com.wander.shared.kernel.error.WanderException;
import java.time.Clock;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Các giới hạn chống lạm dụng của API (Q16 câu 6, MĐ-8). Giá trị mặc định khớp bản cài đặt cũ;
 * đổi qua cấu hình {@code wander.limits.*}. Con số cụ thể vẫn chờ rà soát cùng RG-1.
 */
public final class RateLimits {

    /**
     * Cấu hình các giới hạn: ba loại tính mỗi giờ và kho địa điểm công khai tính mỗi phút; thiếu giá trị thì dùng mặc định
     * ở {@link RateLimitConstants}.
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

    /** Tạo các bộ đếm theo cấu hình: ba bộ cửa sổ một giờ và một bộ cửa sổ một phút cho kho địa điểm. */
    public RateLimits(Properties props, Clock clock) {
        this.identity = newLimiter(props.identityPerHour(), clock);
        this.recovery = newLimiter(props.recoveryPerHour(), clock);
        this.approval = newLimiter(props.approvalPerHour(), clock);
        this.catalog = new FixedWindowRateLimiter(props.catalogPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock);
        this.pairingRequests = new FixedWindowRateLimiter(props.approvalRequestsPerWindow(), RateLimitConstants.APPROVAL_REQUEST_WINDOW, clock);
        this.stepUpRequests = new FixedWindowRateLimiter(props.approvalRequestsPerWindow(), RateLimitConstants.APPROVAL_REQUEST_WINDOW, clock);
        this.writes = new FixedWindowRateLimiter(props.writesPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock);
        this.linkPolls = new FixedWindowRateLimiter(props.linkPollPerMinute(), RateLimitConstants.CATALOG_WINDOW, clock);
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

    /** Tạo yêu cầu ghép thiết bị (DR-018 E1: tối đa 3 yêu cầu mỗi 10 phút), theo địa chỉ vì máy mới chưa có danh tính. */
    public void pairingRequest(String clientAddress) {
        check(pairingRequests, clientAddress);
    }

    /** Xin xác thực lại (DR-018 E1: tối đa 3 yêu cầu mỗi 10 phút), theo danh tính. */
    public void stepUpRequest(String identityKey) {
        check(stepUpRequests, identityKey);
    }

    /** Đọc kho địa điểm công khai (chưa cần phiên), theo địa chỉ. */
    public void catalog(String clientAddress) {
        check(catalog, clientAddress);
    }

    /** Ghi API theo danh tính, không thể tăng ngân sách chỉ bằng việc ghép thêm thiết bị. */
    public void write(String identityKey) {
        check(writes, identityKey);
    }

    /** Thiết bị mới hỏi trạng thái yêu cầu ghép (hỏi lặp mỗi giây), theo địa chỉ; tách khỏi hạn mức khôi phục theo giờ. */
    public void linkPoll(String clientAddress) {
        check(linkPolls, clientAddress);
    }

    /** Tạo bộ đếm cho phép {@code maxPerHour} lần mỗi cửa sổ chuẩn. */
    private static FixedWindowRateLimiter newLimiter(int maxPerHour, Clock clock) {
        return new FixedWindowRateLimiter(maxPerHour, RateLimitConstants.WINDOW, clock);
    }

    /** Ghi nhận một lần gọi; vượt giới hạn thì ném lỗi RATE_LIMITED (429). */
    private static void check(FixedWindowRateLimiter limiter, String key) {
        if (!limiter.hit(key)) {
            throw new WanderException(ErrorKind.RATE_LIMITED, ErrorCodes.RATE_LIMITED, ErrorMessages.RATE_LIMITED, null, null);
        }
    }
}
