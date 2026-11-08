package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Hạn mức duyệt và tái tạo mã dùng chung giữa các phiên, kể cả phiên vừa ghép mới. */
@TestPropertySource(properties = "wander.limits.approval-per-hour=3")
class IdentityApprovalRateLimitIT extends ApiTestSupport {

    /** Phiên mới không có ngân sách duyệt riêng; danh tính khác có ngân sách độc lập. */
    @Test
    @DisplayName("hai phiên cùng danh tính chia hạn mức duyệt ghép: phiên thứ hai nhận 429")
    void linkedSessionCannotResetApprovalQuota() {
        User owner = newUser();
        String second = linkDevice(owner.token());
        Res link = newLink();
        Map<String, Object> body = map("pairingCode", link.str("pairingCode"));
        assertThat(call("POST", "/api/device-links/preview", owner.token(), body).status()).isEqualTo(200);
        assertThat(call("POST", "/api/device-links/preview", owner.token(), body).status()).isEqualTo(200);
        Res denied = call("POST", "/api/device-links/approve", second,
                map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber")));
        assertThat(denied.status()).isEqualTo(429);
        assertThat(denied.code()).isEqualTo("RATE_LIMITED");
        assertThat(call("GET", "/api/device-links/" + link.str("requestId"), null).str("status")).isEqualTo("pending");
        User stranger = newUser();
        assertThat(call("POST", "/api/device-links/preview", stranger.token(), body).status()).isEqualTo(200);
    }

    /** Tái tạo từ phiên vừa ghép phải dùng phần ngân sách còn lại của chủ. */
    @Test
    @DisplayName("tái tạo mã qua hai phiên: begin của phiên thứ hai bị 429 khi phần chung đã hết")
    void regenerationBeginSharesIdentityQuota() {
        User owner = newUser();
        String second = linkDevice(owner.token());
        Res begun = call("POST", "/api/recovery-code/begin", owner.token(),
                map("evidence", map("type", "code", "code", owner.recoveryCode())));
        assertThat(begun.status()).isEqualTo(200);
        assertThat(call("POST", "/api/recovery-code/confirm", owner.token(),
                map("pendingId", begun.str("pendingId"), "replacementCode", begun.str("replacementCode"))).status()).isEqualTo(200);
        Res denied = call("POST", "/api/recovery-code/begin", second,
                map("evidence", map("type", "code", "code", begun.str("replacementCode"))));
        assertThat(denied.status()).isEqualTo(429);
        assertThat(denied.code()).isEqualTo("RATE_LIMITED");
    }

    /** Pha xác nhận cũng dùng chung hạn mức, không thể chuyển phiên để né giới hạn. */
    @Test
    @DisplayName("confirm từ phiên thứ hai bị 429 sau khi phiên đầu dùng hết phần chung")
    void regenerationConfirmSharesIdentityQuota() {
        User owner = newUser();
        String second = linkDevice(owner.token());
        Res begun = call("POST", "/api/recovery-code/begin", owner.token(),
                map("evidence", map("type", "code", "code", owner.recoveryCode())));
        assertThat(begun.status()).isEqualTo(200);
        assertThat(call("POST", "/api/device-links/preview", owner.token(), map()).status()).isEqualTo(400);
        Res denied = call("POST", "/api/recovery-code/confirm", second,
                map("pendingId", begun.str("pendingId"), "replacementCode", begun.str("replacementCode")));
        assertThat(denied.status()).isEqualTo(429);
        assertThat(denied.code()).isEqualTo("RATE_LIMITED");
    }

    /** Tạo yêu cầu ghép thật, trả dữ liệu thử thách cho máy duyệt. */
    private Res newLink() {
        Res link = call("POST", "/api/device-links", null, map("sessionToken", newSessionToken()));
        assertThat(link.status()).isEqualTo(201);
        return link;
    }

    /** Ghép phiên thứ hai và xác minh phiên đó sử dụng được trước khi kiểm tra hạn mức. */
    private String linkDevice(String ownerToken) {
        String token = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", token));
        assertThat(link.status()).isEqualTo(201);
        assertThat(call("POST", "/api/device-links/approve", ownerToken,
                map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);
        assertThat(call("GET", "/api/sessions", token).status()).isEqualTo(200);
        return token;
    }
}
