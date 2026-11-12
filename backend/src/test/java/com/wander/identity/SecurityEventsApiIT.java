package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import static org.awaitility.Awaitility.await;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * BE-11: nhật ký sự kiện bảo mật cho "Hoạt động gần đây" ở màn Bảo mật (FE-7). Mỗi danh tính giữ tối đa 50 sự kiện mới nhất;
 * "chưa xem" bật khi có thiết bị mới được thêm (ghép hoặc khôi phục) mà chủ chưa mở màn Bảo mật.
 */
class SecurityEventsApiIT extends ApiTestSupport {

    private static final String EVENTS = "/api/events";
    private static final String SEEN = "/api/events/seen";

    /**
     * Reads the activity log once the outbox has delivered every pending security event: the log is written after the commit of the
     * action that caused it (ADR-011), so a test must not read it before the recorder has run.
     */
    private Res events(String token) {
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> assertThat(jdbc.sql(
                "SELECT count(*) FROM event_publication WHERE completion_date IS NULL AND listener_id LIKE '%SecurityEventRecorder%'")
                .query(Long.class).single()).isZero());
        return call("GET", EVENTS, token);
    }

    private List<String> kinds(Res r) {
        List<String> kinds = new ArrayList<>();
        for (Object e : r.list("events")) kinds.add((String) ((Map<?, ?>) e).get("kind"));
        return kinds;
    }

    private void pair(User u, String deviceName) {
        String token = newSessionToken();
        Res link = call("POST", "/api/device-links", null, map("sessionToken", token, "deviceName", deviceName));
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber")))
                .status()).isEqualTo(200);
    }

    @Test
    @DisplayName("tạo danh tính có mã: sự kiện created (kèm tên máy) rồi code, mới nhất đứng đầu; chưa có gì cần xem")
    void createdWithCode() {
        Res created = call("POST", "/api/identity", null, map("deviceName", "iPhone"));
        String token = created.str("token");
        Res events = events(token);
        assertThat(events.status()).as(String.valueOf(events.body())).isEqualTo(200);
        assertThat(kinds(events)).containsExactly("code", "created");
        assertThat(events.str("events.1.deviceName")).isEqualTo("iPhone");
        assertThat(events.str("events.0.at")).isNotBlank();
        assertThat(events.at("unseen")).isEqualTo(false);
    }

    @Test
    @DisplayName("tạo danh tính bỏ qua mã: chỉ có created")
    void createdWithoutCode() {
        Res created = call("POST", "/api/identity", null, map("skipRecoveryCode", true));
        assertThat(kinds(events(created.str("token")))).containsExactly("created");
    }

    @Test
    @DisplayName("ghép thiết bị: sự kiện paired kèm tên máy mới và bật 'chưa xem'; POST /events/seen tắt")
    void pairedRaisesUnseenUntilSeen() {
        User u = newUser();
        pair(u, "Laptop");
        Res events = events(u.token());
        assertThat(kinds(events).get(0)).isEqualTo("paired");
        assertThat(events.str("events.0.deviceName")).isEqualTo("Laptop");
        assertThat(events.at("unseen")).isEqualTo(true);

        Res seen = call("POST", SEEN, u.token());
        assertThat(seen.status()).isEqualTo(200);
        assertThat(seen.at("unseen")).isEqualTo(false);
        assertThat(events(u.token()).at("unseen")).isEqualTo(false);

        pair(u, "iPad");
        assertThat(events(u.token()).at("unseen")).as("thiết bị mới sau lần xem lại bật cờ").isEqualTo(true);
    }

    @Test
    @DisplayName("thu hồi thiết bị ghi revoked kèm tên máy bị thu hồi; không bật 'chưa xem'")
    void revokedRecordsName() {
        User u = newUser();
        pair(u, "Laptop");
        call("POST", SEEN, u.token());
        String laptopId = null;
        for (Object s : call("GET", "/api/sessions", u.token()).list("sessions")) {
            Map<?, ?> view = (Map<?, ?>) s;
            if ("Laptop".equals(view.get("deviceName"))) laptopId = (String) view.get("id");
        }
        assertThat(call("DELETE", "/api/sessions/" + laptopId, u.token()).status()).isEqualTo(204);
        Res events = events(u.token());
        assertThat(kinds(events).get(0)).isEqualTo("revoked");
        assertThat(events.str("events.0.deviceName")).isEqualTo("Laptop");
        assertThat(events.at("unseen")).isEqualTo(false);
    }

    @Test
    @DisplayName("khôi phục trên máy mới ghi recovered (kèm tên máy) và bật 'chưa xem'")
    void recoveredRaisesUnseen() {
        User u = newUser();
        String token = newSessionToken();
        String attempt = newAttemptId();
        Res started = call("POST", "/api/recovery/start", null,
                map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token, "deviceName", "Máy mới"));
        assertThat(call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", started.str("replacementCode"))).status())
                .isEqualTo(200);
        Res events = events(u.token());
        assertThat(kinds(events).get(0)).isEqualTo("recovered");
        assertThat(events.str("events.0.deviceName")).isEqualTo("Máy mới");
        assertThat(events.at("unseen")).isEqualTo(true);
    }

    @Test
    @DisplayName("đổi mã khôi phục (hai pha) ghi sự kiện code")
    void codeChangeRecorded() {
        User u = newUser();
        Res begin = call("POST", "/api/recovery-code/begin", u.token(), Map.of("evidence", Map.of("type", "code", "code", u.recoveryCode())));
        assertThat(begin.status()).as(String.valueOf(begin.body())).isEqualTo(200);
        Res confirm = call("POST", "/api/recovery-code/confirm", u.token(), map("pendingId", begin.str("pendingId"), "replacementCode", begin.str("replacementCode")));
        assertThat(confirm.status()).as(String.valueOf(confirm.body())).isEqualTo(200);
        assertThat(kinds(events(u.token())).get(0)).isEqualTo("code");
    }

    @Test
    @DisplayName("giữ tối đa 50 sự kiện mới nhất mỗi danh tính")
    void keepsNewestFifty() {
        User u = newUser();
        for (int i = 0; i < 60; i++) {
            jdbc.sql("INSERT INTO identity_events (identity_id, kind, device_name, occurred_at) VALUES (?::uuid, 'code', ?, now() - (? || ' minutes')::interval)")
                    .param(u.identityId()).param("cũ " + i).param(String.valueOf(i + 1)).update();
        }
        pair(u, "Laptop");
        events(u.token());
        long count = jdbc.sql("SELECT count(*) FROM identity_events WHERE identity_id = ?::uuid").param(u.identityId()).query(Long.class).single();
        assertThat(count).isEqualTo(50);
        Res events = events(u.token());
        assertThat(events.list("events")).hasSize(50);
        assertThat(kinds(events).get(0)).isEqualTo("paired");
    }

    @Test
    @DisplayName("mỗi danh tính chỉ thấy sự kiện của mình; cần phiên hợp lệ")
    void isolatedAndAuthenticated() {
        User a = newUser();
        User b = newUser();
        pair(a, "Laptop");
        assertThat(kinds(events(b.token()))).as("B chỉ có sự kiện của chính mình").containsExactly("code", "created");
        assertThat(events(null).status()).isEqualTo(401);
        assertThat(call("POST", SEEN, null).status()).isEqualTo(401);
    }

    @Test
    @DisplayName("thu hồi phiên của danh tính khác bị 404 và không sinh sự kiện cho ai")
    void revokingForeignSessionRecordsNothing() {
        User a = newUser();
        User b = newUser();
        pair(a, "Laptop");
        String foreignId = null;
        for (Object s : call("GET", "/api/sessions", a.token()).list("sessions")) {
            Map<?, ?> view = (Map<?, ?>) s;
            if ("Laptop".equals(view.get("deviceName"))) foreignId = (String) view.get("id");
        }
        assertThat(call("DELETE", "/api/sessions/" + foreignId, b.token()).status()).isEqualTo(404);
        assertThat(kinds(events(b.token()))).doesNotContain("revoked");
        assertThat(kinds(events(a.token()))).doesNotContain("revoked");
    }

    @Test
    @DisplayName("'chưa xem' sau khôi phục lần hai: xem xong rồi lại có máy mới khôi phục thì cờ bật lại")
    void unseenRaisesAgainAfterSecondRecovery() {
        User u = newUser();
        String code = u.recoveryCode();
        for (int round = 0; round < 2; round++) {
            String token = newSessionToken();
            String attempt = newAttemptId();
            Res started = call("POST", "/api/recovery/start", null, map("code", code, "attemptId", attempt, "sessionToken", token));
            assertThat(call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", started.str("replacementCode")))
                    .status()).isEqualTo(200);
            code = started.str("replacementCode");
            assertThat(events(u.token()).at("unseen")).as("vòng %d", round).isEqualTo(true);
            assertThat(call("POST", SEEN, u.token()).at("unseen")).isEqualTo(false);
        }
    }
}
