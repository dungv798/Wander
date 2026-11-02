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
}
