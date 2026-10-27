package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/**
 * DR-018 E1: hạn mức yêu cầu duyệt, mặc định 3 yêu cầu mỗi 10 phút. Ghép thiết bị tính theo địa chỉ (máy mới chưa có danh tính),
 * xin xác thực lại tính theo danh tính. Test này đặt hạn mức 3 để kiểm vừa đủ; các test khác đặt rất cao để không vướng.
 */
@TestPropertySource(properties = "wander.limits.approval-requests-per-window=3")
class ApprovalQuotaIT extends ApiTestSupport {

    @Test
    @DisplayName("xin xác thực lại: tối đa 3 yêu cầu/10 phút cho mỗi danh tính; yêu cầu thứ 4 bị 429; danh tính khác không bị ảnh hưởng")
    void stepUpRequestsAreLimitedPerIdentity() {
        User u = newUser();
        for (int i = 0; i < 3; i++) {
            assertThat(call("POST", "/api/step-up/requests", u.token(), Map.of("operation", "regenerate_code")).status()).isEqualTo(201);
        }
        Res blocked = call("POST", "/api/step-up/requests", u.token(), Map.of("operation", "regenerate_code"));
        assertThat(blocked.status()).isEqualTo(429);
        assertThat(blocked.code()).isEqualTo("RATE_LIMITED");

        User other = newUser();
        assertThat(call("POST", "/api/step-up/requests", other.token(), Map.of("operation", "regenerate_code")).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("ghép thiết bị: tối đa 3 yêu cầu/10 phút cho mỗi địa chỉ; yêu cầu thứ 4 bị 429 và không tạo bản ghi")
    void pairingRequestsAreLimitedPerAddress() {
        long before = jdbc.sql("SELECT count(*) FROM device_links").query(Long.class).single();
        for (int i = 0; i < 3; i++) {
            assertThat(call("POST", "/api/device-links", null, map("sessionToken", newSessionToken())).status()).isEqualTo(201);
        }
        Res blocked = call("POST", "/api/device-links", null, map("sessionToken", newSessionToken()));
        assertThat(blocked.status()).isEqualTo(429);
        assertThat(blocked.code()).isEqualTo("RATE_LIMITED");
        assertThat(jdbc.sql("SELECT count(*) FROM device_links").query(Long.class).single()).isEqualTo(before + 3);
    }
}
