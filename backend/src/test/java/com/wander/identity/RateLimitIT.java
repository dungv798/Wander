package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Giới hạn tần suất (Q16 câu 6). Context riêng với giới hạn thấp để không ảnh hưởng các test khác. */
@TestPropertySource(properties = {
        "wander.limits.identity-per-hour=2",
        "wander.limits.recovery-per-hour=3"})
class RateLimitIT extends ApiTestSupport {

    @Test
    @DisplayName("chống lạm dụng: giới hạn số danh tính và số lần thử khôi phục từ một địa chỉ")
    void limitsPerAddress() {
        assertThat(call("POST", "/api/identity", null).status()).isEqualTo(201);
        assertThat(call("POST", "/api/identity", null).status()).isEqualTo(201);
        Res third = call("POST", "/api/identity", null);
        assertThat(third.status()).isEqualTo(429);
        assertThat(third.code()).isEqualTo("RATE_LIMITED");

        var body = map("code", "AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA", "attemptId", newAttemptId(), "sessionToken", newSessionToken());
        for (int i = 0; i < 3; i++) assertThat(call("POST", "/api/recovery/start", null, body).status()).isEqualTo(400);
        Res limited = call("POST", "/api/recovery/start", null, body);
        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");
    }
}
