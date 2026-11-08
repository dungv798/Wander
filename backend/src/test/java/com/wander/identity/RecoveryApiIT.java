package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Chuyển từ server/test/recovery.test.ts: D20–D26 và các invariant INV/NEG của docs/autopilot/q16-design-draft.md.
 * Lưu ý: test của phần cài đặt; KHÔNG xác minh G7 (cần mô hình đe dọa, tiêu chí đo được và người dùng thật).
 */
class RecoveryApiIT extends ApiTestSupport {

    private static final String UNKNOWN_CODE = "AAAAA-AAAAA-AAAAA-AAAAA-AAAAA-AAAAA";
    private static final String CODE_PATTERN = "^([0-9A-HJKMNP-TV-Z]{5}-){5}[0-9A-HJKMNP-TV-Z]{5}$";

    private record Started(Res r, String token, String attempt) {
    }

    private record Recovered(String token, String newCode) {
    }

    private Started start(String code) {
        return start(code, newSessionToken(), newAttemptId());
    }

    private Started start(String code, String token, String attempt) {
        Res r = call("POST", "/api/recovery/start", null, map("code", code, "attemptId", attempt, "sessionToken", token));
        return new Started(r, token, attempt);
    }

    private Res complete(String attempt, String replacement) {
        return call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", replacement));
    }

    private Recovered recoverFully(String code) {
        Started s = start(code);
        assertThat(s.r().status()).as(String.valueOf(s.r().body())).isEqualTo(200);
        Res done = complete(s.attempt(), s.r().str("replacementCode"));
        assertThat(done.status()).as(String.valueOf(done.body())).isEqualTo(200);
        return new Recovered(s.token(), s.r().str("replacementCode"));
    }

    private long activeCodes(String identityId) {
        return jdbc.sql("SELECT COUNT(*) FROM recovery_codes WHERE identity_id = ?::uuid AND invalidated_at IS NULL")
                .param(identityId).query(Long.class).single();
    }

    private static Map<String, Object> codeEvidence(String code) {
        return Map.of("evidence", Map.of("type", "code", "code", code));
    }

    // ---- Phát hành mã ban đầu (D26) ----

    @Test
    @DisplayName("D26: mã khôi phục hiển thị một lần khi tạo danh tính, chỉ lưu băm, không dùng làm bearer")
    void initialCode() {
        User u = newUser();
        assertThat(u.recoveryCode()).matches(CODE_PATTERN);
        List<String> hashes = jdbc.sql("SELECT code_hash FROM recovery_codes WHERE identity_id = ?::uuid")
                .param(u.identityId()).query(String.class).list();
        assertThat(hashes).hasSize(1);
        assertThat(hashes.get(0)).matches("^[0-9a-f]{64}$").doesNotContain(u.recoveryCode().replace("-", ""));
        assertThat(call("GET", "/api/trips", u.recoveryCode().replace("-", "")).status()).isEqualTo(401); // INV-17
        assertThat(call("GET", "/api/recovery-code", u.token()).at("hasCode")).isEqualTo(true);
    }

    @Test
    @DisplayName("D26: được bỏ qua mã khi tạo danh tính (khi đó chưa có mã)")
    void skipCode() {
        Res r = call("POST", "/api/identity", null, Map.of("skipRecoveryCode", true));
        assertThat(r.status()).isEqualTo(201);
        assertThat(r.at("recoveryCode")).isNull();
        assertThat(call("GET", "/api/recovery-code", r.str("token")).at("hasCode")).isEqualTo(false);
    }

    @Test
    @DisplayName("INV-17/D22: tạo thêm chuyến không phát hành hay đổi mã khôi phục")
    void tripsDoNotTouchCodes() {
        User u = newUser();
        List<String> before = jdbc.sql("SELECT id || code_hash FROM recovery_codes WHERE identity_id = ?::uuid")
                .param(u.identityId()).query(String.class).list();
        newTrip(u.token());
        newTrip(u.token(), Map.of("name", "Chuyến thứ hai"));
        assertThat(jdbc.sql("SELECT id || code_hash FROM recovery_codes WHERE identity_id = ?::uuid")
                .param(u.identityId()).query(String.class).list()).isEqualTo(before);
        Recovered rec = recoverFully(u.recoveryCode());
        assertThat(call("GET", "/api/trips", rec.token()).list("trips")).hasSize(2);
    }

    // ---- Khôi phục bằng mã (KP-C, D24) ----

    @Test
    @DisplayName("KP-C: khôi phục mở lại dữ liệu trên thiết bị mới; phiên cũ không bị thu hồi (D23, INV-10)")
    void recoveryOpensDataOnNewDevice() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("title", "Giữ nguyên", "cost", 70));
        Recovered rec = recoverFully(u.recoveryCode());
        Res d = call("GET", "/api/trips/" + trip, rec.token());
        assertThat(d.status()).isEqualTo(200);
        assertThat(d.str("days.1.items.0.title")).isEqualTo("Giữ nguyên");
        assertThat(call("GET", "/api/trips/" + trip, u.token()).status()).isEqualTo(200);
        List<Object> sessions = call("GET", "/api/sessions", u.token()).list("sessions");
        assertThat(sessions).hasSize(2);
        assertThat(sessions.stream().filter(s -> Boolean.TRUE.equals(((Map<?, ?>) s).get("current"))).count()).isEqualTo(1);
    }

    @Test
    @DisplayName("KP-C/INV-7: mã cũ không dùng lại được sau khi khôi phục; mã thay thế là mã hiện hành duy nhất")
    void oldCodeDeadAfterRecovery() {
        User u = newUser();
        Recovered rec = recoverFully(u.recoveryCode());
        assertThat(start(u.recoveryCode()).r().code()).isEqualTo("INVALID_CODE");
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        Recovered second = recoverFully(rec.newCode());
        assertThat(call("GET", "/api/trips", second.token()).status()).isEqualTo(200);
        assertThat(start(rec.newCode()).r().code()).isEqualTo("INVALID_CODE");
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
    }

    @Test
    @DisplayName("INV-15/NEG-16: trước khi commit, bí mật phiên đang chờ không truy cập được gì; mã cũ chưa bị tiêu thụ")
    void pendingSecretHasNoAccess() {
        User u = newUser();
        newTrip(u.token());
        Started s = start(u.recoveryCode());
        assertThat(s.r().status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips", s.token()).status()).isEqualTo(401);
        assertThat(start(u.recoveryCode()).r().status()).isEqualTo(200);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
    }

    @Test
    @DisplayName("INV-16/NEG-17: mã thay thế chưa xác nhận không được chấp nhận làm bằng chứng")
    void unconfirmedReplacementIsNotEvidence() {
        User u = newUser();
        String replacement = start(u.recoveryCode()).r().str("replacementCode");
        assertThat(start(replacement).r().code()).isEqualTo("INVALID_CODE");
        assertThat(call("GET", "/api/trips", replacement.replace("-", "")).status()).isEqualTo(401);
    }

    @Test
    @DisplayName("D24: không hoàn tất được nếu không xác nhận đúng mã thay thế; thất bại không làm mất mã cũ (NEG-13)")
    void mustConfirmReplacement() {
        User u = newUser();
        Started s = start(u.recoveryCode());
        Res wrong = complete(s.attempt(), UNKNOWN_CODE);
        assertThat(wrong.status()).isEqualTo(400);
        assertThat(wrong.code()).isEqualTo("INVALID_REPLACEMENT");
        assertThat(complete(s.attempt(), "sai-dinh-dang").code()).isEqualTo("INVALID_REPLACEMENT");
        assertThat(call("GET", "/api/trips", s.token()).status()).isEqualTo(401);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        Recovered again = recoverFully(u.recoveryCode());
        assertThat(call("GET", "/api/trips", again.token()).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("INV-12/NEG-11: gửi lại cùng lần thử sau commit là idempotent, không tạo thêm phiên hay mã")
    void completeIsIdempotent() {
        User u = newUser();
        Started s = start(u.recoveryCode());
        String replacement = s.r().str("replacementCode");
        assertThat(complete(s.attempt(), replacement).status()).isEqualTo(200);
        Res retry = complete(s.attempt(), replacement);
        assertThat(retry.status()).isEqualTo(200);
        assertThat(retry.at("committed")).isEqualTo(true);
        assertThat(jdbc.sql("SELECT COUNT(*) FROM sessions WHERE identity_id = ?::uuid").param(u.identityId())
                .query(Long.class).single()).isEqualTo(2);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        assertThat(call("GET", "/api/trips", s.token()).status()).isEqualTo(200);
        assertThat(start(u.recoveryCode()).r().code()).isEqualTo("INVALID_CODE");
    }

    @Test
    @DisplayName("INV-7/NEG-10: hai lần thử cùng một mã: đúng một lần commit, lần còn lại thất bại")
    void twoAttemptsOneWinner() {
        User u = newUser();
        Started first = start(u.recoveryCode());
        Started second = start(u.recoveryCode());
        assertThat(first.r().status()).isEqualTo(200);
        assertThat(second.r().status()).isEqualTo(200);
        assertThat(complete(first.attempt(), first.r().str("replacementCode")).status()).isEqualTo(200);
        Res late = complete(second.attempt(), second.r().str("replacementCode"));
        assertThat(late.status()).isEqualTo(409);
        assertThat(late.code()).isEqualTo("CODE_ALREADY_USED");
        assertThat(call("GET", "/api/trips", second.token()).status()).isEqualTo(401);
        assertThat(call("GET", "/api/trips", first.token()).status()).isEqualTo(200);
        assertThat(start(second.r().str("replacementCode")).r().code()).isEqualTo("INVALID_CODE");
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
    }

    @Test
    @DisplayName("MĐ-6: lần thử chờ hết hạn thì không commit được và mã hiện tại vẫn dùng được")
    void expiredAttempt() {
        User u = newUser();
        Started s = start(u.recoveryCode());
        jdbc.sql("UPDATE recovery_attempts SET expires_at = '2020-01-01T00:00:00Z' WHERE identity_id = ?::uuid")
                .param(u.identityId()).update();
        Res late = complete(s.attempt(), s.r().str("replacementCode"));
        assertThat(late.status()).isEqualTo(400);
        assertThat(late.code()).isEqualTo("ATTEMPT_EXPIRED");
        assertThat(call("GET", "/api/trips", s.token()).status()).isEqualTo(401);
        assertThat(recoverFully(u.recoveryCode()).token()).isNotEmpty();
    }

    @Test
    @DisplayName("MĐ-6: bắt đầu lại cùng lần thử cấp mã thay thế mới và vô hiệu mã thay thế trước đó")
    void restartSameAttempt() {
        User u = newUser();
        String token = newSessionToken();
        String attempt = newAttemptId();
        Started one = start(u.recoveryCode(), token, attempt);
        Started two = start(u.recoveryCode(), token, attempt);
        assertThat(two.r().status()).isEqualTo(200);
        assertThat(one.r().str("replacementCode")).isNotEqualTo(two.r().str("replacementCode"));
        assertThat(complete(attempt, one.r().str("replacementCode")).code()).isEqualTo("INVALID_REPLACEMENT");
        assertThat(complete(attempt, two.r().str("replacementCode")).status()).isEqualTo(200);
        assertThat(start(u.recoveryCode(), newSessionToken(), attempt).r().status()).isEqualTo(400);
    }

    /** So sánh toàn bộ thân lỗi khi bắt đầu khôi phục, kể cả mã đã tiêu thụ qua API thật. */
    @Test
    @DisplayName("INV-6: mã sai, không tồn tại và đã dùng trả cùng HTTP 400 và thân lỗi INVALID_CODE khi bắt đầu khôi phục")
    void rejectInvalidUnknownAndUsedCodesUniformly() {
        User user = newUser();
        recoverFully(user.recoveryCode());

        Res invalid = start("khong phai ma").r();
        Res unknown = start(UNKNOWN_CODE).r();
        Res used = start(user.recoveryCode()).r();
        Map<String, Object> expectedBody = Map.of("error", Map.of(
                "code", "INVALID_CODE", "message", "Mã không hợp lệ hoặc đã được dùng."));

        for (Res rejection : List.of(invalid, unknown, used)) {
            assertThat(rejection.status()).isEqualTo(400);
            assertThat(rejection.code()).isEqualTo("INVALID_CODE");
            assertThat(rejection.body()).isEqualTo(expectedBody);
        }
    }

    @Test
    @DisplayName("INV-6/MĐ-8: mọi lý do từ chối mã cho cùng một phản hồi; bí mật phiên phải đủ mạnh")
    void uniformRejection() {
        User u = newUser();
        Res unknownButValid = start(UNKNOWN_CODE).r();
        Res garbage = start("khong phai ma").r();
        Res missing = call("POST", "/api/recovery/start", null, map("attemptId", newAttemptId(), "sessionToken", newSessionToken()));
        assertThat(unknownButValid.status()).isEqualTo(400);
        assertThat(unknownButValid.body()).isEqualTo(garbage.body()).isEqualTo(missing.body());
        Res weak = call("POST", "/api/recovery/start", null, map("code", u.recoveryCode(), "attemptId", newAttemptId(), "sessionToken", "ngan"));
        assertThat(weak.code()).isEqualTo("INVALID_SESSION_TOKEN");
        Res reuse = call("POST", "/api/recovery/start", null, map("code", u.recoveryCode(), "attemptId", newAttemptId(), "sessionToken", u.token()));
        assertThat(reuse.code()).isEqualTo("INVALID_SESSION_TOKEN");
    }

    // ---- Thiết bị tin cậy duyệt thiết bị mới (D21) ----

    @Test
    @DisplayName("D21: thiết bị tin cậy duyệt thiết bị mới; thiết bị mới tự giữ bí mật phiên")
    void deviceLink() {
        User u = newUser();
        String trip = newTrip(u.token());
        String newDevice = newSessionToken();
        Res link = call("POST", "/api/device-links", null, Map.of("sessionToken", newDevice));
        assertThat(link.status()).isEqualTo(201);
        assertThat(link.str("pairingCode")).matches("^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$");
        String statusPath = "/api/device-links/" + link.str("requestId");
        assertThat(call("GET", statusPath, null).str("status")).isEqualTo("pending");
        assertThat(call("GET", "/api/trips/" + trip, newDevice).status()).isEqualTo(401);

        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(200);
        assertThat(call("GET", statusPath, null).str("status")).isEqualTo("approved");
        assertThat(call("GET", "/api/trips/" + trip, newDevice).status()).isEqualTo(200);
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).code())
                .isEqualTo("INVALID_PAIRING_CODE");
    }

    @Test
    @DisplayName("D21: mã ghép sai, hết hạn hoặc không có phiên đều bị từ chối")
    void deviceLinkRejections() {
        User u = newUser();
        Res link = call("POST", "/api/device-links", null, Map.of("sessionToken", newSessionToken()));
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", "AAAA-AAAA", "number", 42)).code()).isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("POST", "/api/device-links/approve", null, map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).status()).isEqualTo(401);
        jdbc.sql("UPDATE device_links SET expires_at = '2020-01-01T00:00:00Z' WHERE id = ?::uuid").param(link.str("requestId")).update();
        assertThat(call("POST", "/api/device-links/approve", u.token(), map("pairingCode", link.str("pairingCode"), "number", link.num("matchNumber"))).code())
                .isEqualTo("INVALID_PAIRING_CODE");
        assertThat(call("GET", "/api/device-links/" + link.str("requestId"), null).str("status")).isEqualTo("expired");
        assertThat(call("GET", "/api/device-links/khong-co", null).status()).isEqualTo(404);
    }

    // ---- Phiên: danh sách và thu hồi (INV-2) ----

    @Test
    @DisplayName("INV-2: chủ thu hồi một phiên khác thì phiên đó mất quyền ngay; không thu hồi được phiên của người khác")
    void revokeOtherSession() {
        User u = newUser();
        User other = newUser();
        String trip = newTrip(u.token());
        String lost = recoverFully(u.recoveryCode()).token();
        assertThat(call("GET", "/api/trips/" + trip, lost).status()).isEqualTo(200);

        List<Object> sessions = call("GET", "/api/sessions", u.token()).list("sessions");
        String target = sessions.stream().map(s -> (Map<?, ?>) s).filter(s -> Boolean.FALSE.equals(s.get("current")))
                .map(s -> (String) s.get("id")).findFirst().orElseThrow();
        assertThat(call("DELETE", "/api/sessions/" + target, u.token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + trip, lost).status()).isEqualTo(401);
        assertThat(call("POST", "/api/trips/" + trip + "/items", lost, item(Map.of("type", "food", "title", "x"))).status()).isEqualTo(401);

        String mine = (String) ((Map<?, ?>) call("GET", "/api/sessions", u.token()).list("sessions").get(0)).get("id");
        assertThat(call("DELETE", "/api/sessions/" + mine, other.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/" + trip, u.token()).status()).isEqualTo(200);
    }

    // ---- Tái tạo mã và xác thực lại (D23, D25, MĐ-1, MĐ-2) ----

    @Test
    @DisplayName("D25/INV-14/NEG-12: tái tạo mã bị từ chối nếu không xác thực lại, dù phiên hợp lệ")
    void regenerateNeedsStepUp() {
        User u = newUser();
        Res none = call("POST", "/api/recovery-code/begin", u.token(), Map.of());
        assertThat(none.status()).isEqualTo(403);
        assertThat(none.code()).isEqualTo("STEP_UP_REQUIRED");
        assertThat(call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(UNKNOWN_CODE)).status()).isEqualTo(403);
        assertThat(call("POST", "/api/recovery-code/begin", u.token(),
                Map.of("evidence", Map.of("type", "approval", "requestId", "khong-co"))).status()).isEqualTo(403);
        assertThat(call("POST", "/api/recovery-code/begin", u.token(), Map.of("evidence", Map.of("type", "khac"))).status()).isEqualTo(403);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
    }

    @Test
    @DisplayName("D23/INV-13: tái tạo mã hai pha: mã cũ chỉ vô hiệu khi mã mới được xác nhận")
    void twoPhaseRegeneration() {
        User u = newUser();
        Res begin = call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(u.recoveryCode()));
        assertThat(begin.status()).as(String.valueOf(begin.body())).isEqualTo(200);
        String pendingId = begin.str("pendingId");
        String replacement = begin.str("replacementCode");

        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        assertThat(start(replacement).r().code()).isEqualTo("INVALID_CODE");
        assertThat(call("POST", "/api/recovery-code/confirm", u.token(), Map.of("pendingId", pendingId, "replacementCode", UNKNOWN_CODE)).code())
                .isEqualTo("INVALID_REPLACEMENT");
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        assertThat(start(u.recoveryCode()).r().status()).isEqualTo(200);

        Res confirm = call("POST", "/api/recovery-code/confirm", u.token(), Map.of("pendingId", pendingId, "replacementCode", replacement));
        assertThat(confirm.status()).isEqualTo(200);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        assertThat(start(u.recoveryCode()).r().code()).isEqualTo("INVALID_CODE"); // NEG-6
        assertThat(start(replacement).r().status()).isEqualTo(200);
    }

    @Test
    @DisplayName("INV-13/NEG-13: bắt đầu tái tạo lại thì mã thay thế chờ trước đó bị vô hiệu; hết hạn thì không commit")
    void beginAgainVoidsPrevious() {
        User u = newUser();
        Res one = call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(u.recoveryCode()));
        Res two = call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(u.recoveryCode()));
        assertThat(call("POST", "/api/recovery-code/confirm", u.token(),
                Map.of("pendingId", one.str("pendingId"), "replacementCode", one.str("replacementCode"))).status()).isEqualTo(404);
        jdbc.sql("UPDATE code_replacements SET expires_at = '2020-01-01T00:00:00Z' WHERE identity_id = ?::uuid").param(u.identityId()).update();
        assertThat(call("POST", "/api/recovery-code/confirm", u.token(),
                Map.of("pendingId", two.str("pendingId"), "replacementCode", two.str("replacementCode"))).code()).isEqualTo("ATTEMPT_EXPIRED");
        assertThat(start(u.recoveryCode()).r().status()).isEqualTo(200);
    }

    @Test
    @DisplayName("INV-13: mã đổi trong lúc chờ (đã khôi phục ở nơi khác) thì xác nhận thất bại, không có hai mã hợp lệ")
    void codeChangedWhilePending() {
        User u = newUser();
        Res begin = call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(u.recoveryCode()));
        recoverFully(u.recoveryCode());
        Res confirm = call("POST", "/api/recovery-code/confirm", u.token(),
                Map.of("pendingId", begin.str("pendingId"), "replacementCode", begin.str("replacementCode")));
        assertThat(confirm.status()).isEqualTo(409);
        assertThat(confirm.code()).isEqualTo("CODE_CHANGED");
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
        assertThat(start(begin.str("replacementCode")).r().code()).isEqualTo("INVALID_CODE");
    }

    @Test
    @DisplayName("MĐ-1: xác thực lại bằng phê duyệt từ thiết bị khác; bằng chứng dùng một lần, gắn với đúng phiên")
    void stepUpApproval() {
        User u = newUser();
        String device2 = recoverFully(u.recoveryCode()).token();

        Res req = call("POST", "/api/step-up/requests", u.token(), Map.of("operation", "regenerate_code"));
        assertThat(req.status()).isEqualTo(201);
        Map<String, Object> approval = map("approvalCode", req.str("approvalCode"), "number", req.num("matchNumber"));
        Map<String, Object> evidence = Map.of("evidence", Map.of("type", "approval", "requestId", req.str("requestId")));

        assertThat(call("POST", "/api/step-up/approve", u.token(), approval).code()).isEqualTo("INVALID_APPROVAL_CODE");
        assertThat(call("POST", "/api/recovery-code/begin", u.token(), evidence).status()).isEqualTo(403);
        User stranger = newUser();
        assertThat(call("POST", "/api/step-up/approve", stranger.token(), approval).status()).isEqualTo(400);

        assertThat(call("POST", "/api/step-up/approve", device2, approval).status()).isEqualTo(200);
        assertThat(call("POST", "/api/recovery-code/begin", device2, evidence).status()).isEqualTo(403);
        Res ok = call("POST", "/api/recovery-code/begin", u.token(), evidence);
        assertThat(ok.status()).as(String.valueOf(ok.body())).isEqualTo(200);
        assertThat(call("POST", "/api/recovery-code/begin", u.token(), evidence).status()).isEqualTo(403);
        assertThat(call("POST", "/api/step-up/requests", u.token(), Map.of("operation", "xoa_ca_chuyen")).code()).isEqualTo("INVALID_OPERATION");
    }

    @Test
    @DisplayName("MĐ-2/NEG-19: danh tính chưa có mã phát hành mã lần đầu chỉ bằng phiên hợp lệ; sau đó phải xác thực lại")
    void firstCodeFromSession() {
        String token = call("POST", "/api/identity", null, Map.of("skipRecoveryCode", true)).str("token");
        Res begin = call("POST", "/api/recovery-code/begin", token, Map.of());
        assertThat(begin.status()).as(String.valueOf(begin.body())).isEqualTo(200);
        assertThat(call("POST", "/api/recovery-code/confirm", token,
                Map.of("pendingId", begin.str("pendingId"), "replacementCode", begin.str("replacementCode"))).status()).isEqualTo(200);
        assertThat(call("GET", "/api/recovery-code", token).at("hasCode")).isEqualTo(true);
        assertThat(call("POST", "/api/recovery-code/begin", token, Map.of()).status()).isEqualTo(403);
        assertThat(recoverFully(begin.str("replacementCode")).token()).isNotEmpty();
    }

    @Test
    @DisplayName("quyền sở hữu mã chờ: danh tính khác không xác nhận được mã thay thế của người khác")
    void foreignPendingReplacement() {
        User u = newUser();
        User stranger = newUser();
        Res begin = call("POST", "/api/recovery-code/begin", u.token(), codeEvidence(u.recoveryCode()));
        Res r = call("POST", "/api/recovery-code/confirm", stranger.token(),
                Map.of("pendingId", begin.str("pendingId"), "replacementCode", begin.str("replacementCode")));
        assertThat(r.status()).isEqualTo(404);
        assertThat(activeCodes(u.identityId())).isEqualTo(1);
    }

    @Test
    @DisplayName("INV-13 (mức cơ sở dữ liệu): không thể có hai mã hợp lệ cho cùng một danh tính")
    void databaseAllowsOneActiveCode() {
        User u = newUser();
        assertThatThrownBy(() -> jdbc.sql("INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) "
                        + "VALUES (?::uuid, ?::uuid, 'h', now())")
                .param(UUID.randomUUID().toString()).param(u.identityId()).update())
                .hasMessageContaining("recovery_codes_one_active");
    }
}
