package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/**
 * Giới hạn tần suất theo địa chỉ người gọi khi sau một proxy tin cậy (AD-6). Context riêng: 1 hop, 2 danh tính/giờ.
 * Test "không tin X-Forwarded-For" (0 hop) nằm ở ClientAddressDirectIT.
 */
@TestPropertySource(properties = {
        "wander.limits.identity-per-hour=2",
        "wander.web.trusted-proxy-hops=1"})
class ClientAddressIT extends ApiTestSupport {

    private Res createFrom(String forwardedFor) {
        return callWithHeaders("POST", "/api/identity", Map.of("X-Forwarded-For", forwardedFor));
    }

    @Test
    @DisplayName("sau 1 proxy tin cậy: đổi mục bên trái không lách được giới hạn; người dùng khác (mục phải khác) có bộ đếm riêng")
    void countsByTrustedHop() {
        assertThat(createFrom("1.1.1.1, 203.0.113.7").status()).isEqualTo(201);
        assertThat(createFrom("2.2.2.2, 203.0.113.7").status()).isEqualTo(201);
        Res limited = createFrom("3.3.3.3, 203.0.113.7");
        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");

        assertThat(createFrom("1.1.1.1, 203.0.113.8").status()).as("người gọi khác không bị ảnh hưởng").isEqualTo(201);
    }
}
