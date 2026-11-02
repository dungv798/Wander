package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Hỏi trạng thái ghép thiết bị lặp mỗi giây không được đốt hạn mức khôi phục theo giờ (context riêng vì bộ đếm theo địa chỉ). */
@TestPropertySource(properties = {
        "wander.limits.recovery-per-hour=2",
        "wander.limits.link-poll-per-minute=5"})
class LinkPollRateLimitIT extends ApiTestSupport {

    @Test
    @DisplayName("hỏi trạng thái ghép có bộ đếm riêng: vượt ngưỡng thì 429, nhưng khôi phục bằng mã vẫn dùng được")
    void linkStatusPollHasItsOwnQuota() {
        String path = "/api/device-links/" + newAttemptId();
        for (int i = 0; i < 5; i++) assertThat(call("GET", path, null).status()).as("lần hỏi %d", i + 1).isNotEqualTo(429);
        Res limited = call("GET", path, null);
        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");

        var body = map("code", "AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA", "attemptId", newAttemptId(), "sessionToken", newSessionToken());
        assertThat(call("POST", "/api/recovery/start", null, body).status()).as("khôi phục không bị lần hỏi trạng thái làm cạn").isEqualTo(400);
    }
}
