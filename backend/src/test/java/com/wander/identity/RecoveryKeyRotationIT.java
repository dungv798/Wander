package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.identity.infrastructure.security.HmacRecoveryCodeHasher;
import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

/** Khôi phục và mã chờ xuyên deploy đổi khóa; dữ liệu v1 được mô phỏng bằng digest khóa cũ thật. */
@TestPropertySource(properties = {
        "wander.security.recovery-key-version=v2",
        "wander.security.recovery-previous-key-version=v1",
        "wander.security.recovery-previous-pepper=" + RecoveryKeyRotationIT.OLD_PEPPER})
class RecoveryKeyRotationIT extends ApiTestSupport {

    static final String OLD_PEPPER = "test-only-old-pepper-0123456789-abcdefghijklmnopqrstuv";
    private final HmacRecoveryCodeHasher oldHasher = new HmacRecoveryCodeHasher(OLD_PEPPER);

    private String activeVersion(User user) {
        return jdbc.sql("SELECT key_version FROM recovery_codes WHERE identity_id = ?::uuid AND invalidated_at IS NULL")
                .param(user.identityId()).query(String.class).single();
    }

    @Test
    @DisplayName("mã v1 trước deploy vẫn khôi phục được; mã thay thế mới dùng v2; mã cũ chỉ dùng một lần")
    void oldCodeRecoversIntoCurrentVersion() {
        User user = newUser();
        assertThat(activeVersion(user)).isEqualTo("v2");
        jdbc.sql("UPDATE recovery_codes SET code_hash = ?, key_version = 'v1' WHERE identity_id = ?::uuid")
                .param(oldHasher.hashDisplayed(user.recoveryCode())).param(user.identityId()).update();
        String attempt = newAttemptId();
        String token = newSessionToken();
        Res start = call("POST", "/api/recovery/start", null,
                map("code", user.recoveryCode(), "attemptId", attempt, "sessionToken", token));
        assertThat(start.status()).isEqualTo(200);
        Res done = call("POST", "/api/recovery/complete", null,
                map("attemptId", attempt, "replacementCode", start.str("replacementCode")));
        assertThat(done.status()).isEqualTo(200);
        assertThat(activeVersion(user)).isEqualTo("v2");
        assertThat(call("GET", "/api/sessions", token).status()).isEqualTo(200);
        assertThat(call("POST", "/api/recovery/start", null,
                map("code", user.recoveryCode(), "attemptId", newAttemptId(), "sessionToken", newSessionToken())).code()).isEqualTo("INVALID_CODE");
    }

    @Test
    @DisplayName("mã thay thế recovery đã hiển thị trước rotation vẫn xác nhận và khôi phục được")
    void pendingRecoverySurvivesRotation() {
        User user = newUser();
        String attempt = newAttemptId();
        String token = newSessionToken();
        Res start = call("POST", "/api/recovery/start", null,
                map("code", user.recoveryCode(), "attemptId", attempt, "sessionToken", token));
        assertThat(start.status()).isEqualTo(200);
        String replacement = start.str("replacementCode");
        jdbc.sql("UPDATE recovery_attempts SET replacement_hash = ?, key_version = 'v1' WHERE attempt_key = ?")
                .param(oldHasher.hashDisplayed(replacement)).param(attempt).update();
        assertThat(call("POST", "/api/recovery/complete", null,
                map("attemptId", attempt, "replacementCode", replacement)).status()).isEqualTo(200);
        assertThat(activeVersion(user)).isEqualTo("v1");
        assertThat(call("POST", "/api/recovery/start", null,
                map("code", replacement, "attemptId", newAttemptId(), "sessionToken", newSessionToken())).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("mã tái tạo đang chờ xuyên rotation vẫn xác nhận được; mã v1 dùng được làm bằng chứng đổi sang v2")
    void pendingReplacementAndStepUpEvidenceSurviveRotation() {
        User user = newUser();
        Res begun = call("POST", "/api/recovery-code/begin", user.token(),
                map("evidence", map("type", "code", "code", user.recoveryCode())));
        assertThat(begun.status()).isEqualTo(200);
        String replacement = begun.str("replacementCode");
        jdbc.sql("UPDATE code_replacements SET replacement_hash = ?, key_version = 'v1' WHERE id = ?::uuid")
                .param(oldHasher.hashDisplayed(replacement)).param(begun.str("pendingId")).update();
        assertThat(call("POST", "/api/recovery-code/confirm", user.token(),
                map("pendingId", begun.str("pendingId"), "replacementCode", replacement)).status()).isEqualTo(200);
        assertThat(activeVersion(user)).isEqualTo("v1");
        Res next = call("POST", "/api/recovery-code/begin", user.token(), map("evidence", map("type", "code", "code", replacement)));
        assertThat(next.status()).isEqualTo(200);
        assertThat(call("POST", "/api/recovery-code/confirm", user.token(),
                map("pendingId", next.str("pendingId"), "replacementCode", next.str("replacementCode"))).status()).isEqualTo(200);
        assertThat(activeVersion(user)).isEqualTo("v2");
    }
}
