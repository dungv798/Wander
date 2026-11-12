package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.identity.domain.rule.Secrets;
import com.wander.support.ApiTestSupport;
import java.time.Instant;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Hết hạn và thu hồi phiên qua API thật, giữ nguyên hợp đồng lỗi xác thực. */
class SessionLifetimeIT extends ApiTestSupport {

    /** Thu hồi mọi phiên khác chỉ ảnh hưởng đúng danh tính, gọi lại vẫn thành công. */
    @Test
    @DisplayName("đăng xuất mọi máy khác: phiên khác trả 401, máy hiện tại và danh tính khác vẫn dùng được")
    void revokeOthersKeepsCurrentAndOtherIdentity() {
        User owner = newUser();
        User stranger = newUser();
        String second = linkDevice(owner.token());
        String third = linkDevice(owner.token());
        assertThat(call("DELETE", "/api/sessions/others", owner.token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/sessions", second).status()).isEqualTo(401);
        assertThat(call("GET", "/api/sessions", third).code()).isEqualTo("UNAUTHENTICATED");
        Res current = call("GET", "/api/sessions", owner.token());
        assertThat(current.status()).isEqualTo(200);
        assertThat(current.list("sessions")).hasSize(1);
        assertThat(call("GET", "/api/sessions", stranger.token()).status()).isEqualTo(200);
        assertThat(call("DELETE", "/api/sessions/others", owner.token()).status()).isEqualTo(204);
        assertThat(call("DELETE", "/api/sessions/others", second).status()).isEqualTo(401);
        assertThat(call("DELETE", "/api/sessions/others", null).status()).isEqualTo(401);
    }

    /** Hết hạn trượt trả cùng nội dung lỗi với thu hồi, không cập nhật lại last_seen_at. */
    @Test
    @DisplayName("phiên không dùng 15 ngày trả 401 như thu hồi và không được hồi sinh")
    void idleExpiryMatchesRevokedResponse() {
        User owner = newUser();
        String second = linkDevice(owner.token());
        jdbc.sql("UPDATE sessions SET created_at = CURRENT_TIMESTAMP - INTERVAL '20 days', "
                + "last_seen_at = CURRENT_TIMESTAMP - INTERVAL '15 days' WHERE token_hash = ?")
                .param(Secrets.hashToken(second)).update();
        Instant before = lastSeen(second);
        Res expired = call("GET", "/api/sessions", second);
        assertThat(expired.status()).isEqualTo(401);
        assertThat(lastSeen(second)).isEqualTo(before);
        assertThat(call("GET", "/api/sessions", owner.token()).list("sessions")).hasSize(1);
        assertThat(call("DELETE", "/api/sessions/others", owner.token()).status()).isEqualTo(204);
        assertThat(jdbc.sql("SELECT revoked_at IS NOT NULL FROM sessions WHERE token_hash = ?")
                .param(Secrets.hashToken(second)).query(Boolean.class).single()).isTrue();
        Res revoked = call("GET", "/api/sessions", second);
        assertThat(withoutRequestId(expired)).isEqualTo(withoutRequestId(revoked));
        assertThat(expired.raw().headers().firstValue("WWW-Authenticate"))
                .isEqualTo(revoked.raw().headers().firstValue("WWW-Authenticate"));
    }

    /** Trần tuyệt đối chặn phiên vừa hoạt động, không chỉ phiên bỏ lâu ngày. */
    @Test
    @DisplayName("phiên tạo 91 ngày trước trả 401 dù last_seen_at vừa cập nhật")
    void absoluteExpiryRejectsRecentlyUsedSession() {
        User owner = newUser();
        jdbc.sql("UPDATE sessions SET created_at = CURRENT_TIMESTAMP - INTERVAL '91 days' WHERE identity_id = ?::uuid")
                .param(owner.identityId()).update();
        assertThat(call("GET", "/api/sessions", owner.token()).status()).isEqualTo(401);
    }

    /** Danh tính bỏ qua mã: ép hết phiên ở 90 ngày sẽ làm mất chuyến vĩnh viễn, nên chỉ có hạn trượt (DR-039). */
    @Test
    @DisplayName("chưa có mã khôi phục: phiên tạo 91 ngày trước nhưng vừa dùng vẫn hợp lệ; bỏ 15 ngày thì 401")
    void codelessIdentityKeepsSlidingSessionPastAbsoluteCap() {
        Res created = call("POST", "/api/identity", null, map("skipRecoveryCode", true));
        assertThat(created.status()).isEqualTo(201);
        String token = created.str("token");
        jdbc.sql("UPDATE sessions SET created_at = CURRENT_TIMESTAMP - INTERVAL '91 days' WHERE token_hash = ?")
                .param(Secrets.hashToken(token)).update();
        assertThat(call("GET", "/api/sessions", token).status()).isEqualTo(200);
        jdbc.sql("UPDATE sessions SET last_seen_at = CURRENT_TIMESTAMP - INTERVAL '15 days' WHERE token_hash = ?")
                .param(Secrets.hashToken(token)).update();
        assertThat(call("GET", "/api/sessions", token).status()).isEqualTo(401);
    }

    /** Dùng phiên trước hạn trượt cập nhật mốc hoạt động và cho phép yêu cầu tiếp theo. */
    @Test
    @DisplayName("phiên dùng sau 13 ngày được gia hạn trượt")
    void activityRefreshesIdleDeadline() {
        User owner = newUser();
        jdbc.sql("UPDATE sessions SET created_at = CURRENT_TIMESTAMP - INTERVAL '20 days', "
                + "last_seen_at = CURRENT_TIMESTAMP - INTERVAL '13 days' WHERE identity_id = ?::uuid")
                .param(owner.identityId()).update();
        Instant before = lastSeen(owner.token());
        assertThat(call("GET", "/api/sessions", owner.token()).status()).isEqualTo(200);
        assertThat(lastSeen(owner.token())).isAfter(before);
        assertThat(call("GET", "/api/sessions", owner.token()).status()).isEqualTo(200);
    }

    /** Ghép một phiên thật để kiểm tra hành vi nhiều thiết bị cùng danh tính. */
    private String linkDevice(String ownerToken) {
        String token = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", token));
        assertThat(link.status()).isEqualTo(201);
        assertThat(call("POST", "/api/device-links/approve", ownerToken,
                map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);
        return token;
    }

    /** Đọc thời điểm dùng phiên để phát hiện yêu cầu bị từ chối vẫn gia hạn nhầm. */
    private Instant lastSeen(String token) {
        return jdbc.sql("SELECT last_seen_at FROM sessions WHERE token_hash = ?")
                .param(Secrets.hashToken(token)).query(java.time.OffsetDateTime.class).single().toInstant();
    }
}
