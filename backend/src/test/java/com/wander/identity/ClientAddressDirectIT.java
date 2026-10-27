package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Cấu hình mặc định (0 proxy tin cậy): X-Forwarded-For do người gọi tự gửi bị bỏ qua, không lách được giới hạn. */
@TestPropertySource(properties = "wander.limits.identity-per-hour=2")
class ClientAddressDirectIT extends ApiTestSupport {

    @Test
    @DisplayName("mặc định bỏ qua X-Forwarded-For: giả mạo địa chỉ mới mỗi lần vẫn bị giới hạn")
    void spoofedHeaderDoesNotBypassLimit() {
        assertThat(callWithHeaders("POST", "/api/identity", Map.of("X-Forwarded-For", "1.1.1.1")).status()).isEqualTo(201);
        assertThat(callWithHeaders("POST", "/api/identity", Map.of("X-Forwarded-For", "2.2.2.2")).status()).isEqualTo(201);
        Res limited = callWithHeaders("POST", "/api/identity", Map.of("X-Forwarded-For", "3.3.3.3"));
        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");
    }
}
