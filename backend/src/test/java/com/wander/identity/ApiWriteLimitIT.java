package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Request ghi không thể lạm dụng DB chỉ vì đã có một danh tính hợp lệ. */
@TestPropertySource(properties = "wander.limits.writes-per-minute=2")
class ApiWriteLimitIT extends ApiTestSupport {

    @Test
    @DisplayName("hết quota ghi trả 429 trước khi tạo chuyến, không ảnh hưởng GET hoặc danh tính khác")
    void writesAreBoundedAndReadsStillWork() {
        User user = newUser();
        var trip = map("name", "Chuyến thử", "destination", "Đà Lạt", "startDate", "2026-11-01", "endDate", "2026-11-02");
        assertThat(call("POST", "/api/trips", user.token(), trip).status()).isEqualTo(201);
        assertThat(call("POST", "/api/trips", user.token(), trip).status()).isEqualTo(201);
        Res limited = call("POST", "/api/trips", user.token(), trip);
        assertThat(limited.status()).isEqualTo(429);
        assertThat(limited.code()).isEqualTo("RATE_LIMITED");
        assertThat(limited.raw().headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(call("GET", "/api/trips", user.token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips", user.token()).list("trips")).hasSize(2);
        assertThat(call("POST", "/api/trips", newUser().token(), trip).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("hết quota ghi vẫn thu hồi phiên được (không 429): chủ không bị chặn bởi kẻ làm ngập ngân sách")
    void sessionRevocationIsNotBlockedByExhaustedWriteBudget() {
        User user = newUser();
        var trip = map("name", "Chuyến thử", "destination", "Đà Lạt", "startDate", "2026-11-01", "endDate", "2026-11-02");
        call("POST", "/api/trips", user.token(), trip);
        call("POST", "/api/trips", user.token(), trip);
        assertThat(call("POST", "/api/trips", user.token(), trip).status()).isEqualTo(429);
        Res revoke = call("DELETE", "/api/sessions/" + java.util.UUID.randomUUID(), user.token());
        assertThat(revoke.status()).as("phiên không tồn tại -> 404, quan trọng là không 429").isNotEqualTo(429);
    }

    /** Thu hồi hàng loạt có cùng ngoại lệ phòng vệ khi ngân sách ghi đã cạn. */
    @Test
    @DisplayName("hết quota ghi vẫn đăng xuất mọi máy khác được và giữ phiên hiện tại")
    void revokingOtherSessionsBypassesExhaustedWriteBudget() {
        User user = newUser();
        String second = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", second));
        assertThat(link.status()).isEqualTo(201);
        assertThat(call("POST", "/api/device-links/approve", user.token(),
                map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);
        assertThat(call("PATCH", "/api/sessions/current", user.token(), map("deviceName", "Máy chính")).status()).isEqualTo(200);
        assertThat(call("PATCH", "/api/sessions/current", user.token(), map("deviceName", "Máy chính")).status()).isEqualTo(200);
        assertThat(call("PATCH", "/api/sessions/current", user.token(), map("deviceName", "Máy chính")).status()).isEqualTo(429);
        assertThat(call("DELETE", "/api/sessions/others", user.token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/sessions", second).status()).isEqualTo(401);
        assertThat(call("GET", "/api/sessions", user.token()).status()).isEqualTo(200);
    }
}
