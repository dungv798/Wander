package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.rule.Secrets;
import com.wander.support.ApiTestSupport;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * DR-018 B3: mã khôi phục được băm bằng HMAC-SHA-256 CÓ KHÓA (pepper cấu hình), không chỉ SHA-256. Lộ cơ sở dữ liệu mà không lộ
 * khóa thì không dò ngược được mã. Test tính lại băm kỳ vọng bằng thư viện chuẩn, độc lập với mã chính.
 */
class RecoveryCodeHashIT extends ApiTestSupport {

    private static String hmacHex(String pepper, String message) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(pepper.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(message.getBytes(StandardCharsets.UTF_8)));
    }

    private static String sha256Hex(String message) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(message.getBytes(StandardCharsets.UTF_8)));
    }

    private String storedHash(String identityId) {
        return jdbc.sql("SELECT code_hash FROM recovery_codes WHERE identity_id = ?::uuid AND invalidated_at IS NULL")
                .param(identityId).query(String.class).single();
    }

    @Test
    @DisplayName("mã khôi phục lưu dạng HMAC-SHA-256 có khóa, không phải SHA-256 thuần")
    void storedHashIsKeyedHmac() throws Exception {
        User u = newUser();
        String normalized = Secrets.normalize(u.recoveryCode(), IdentityConstants.RECOVERY_CODE_SYMBOLS);
        String message = IdentityConstants.RECOVERY_HASH_PREFIX + normalized;

        assertThat(storedHash(u.identityId())).isEqualTo(hmacHex(TEST_RECOVERY_PEPPER, message));
        assertThat(storedHash(u.identityId())).as("không còn là SHA-256 không khóa").isNotEqualTo(sha256Hex(message));
        assertThat(storedHash(u.identityId())).isNotEqualTo(hmacHex("khoa-khac-" + TEST_RECOVERY_PEPPER, message));
    }

    @Test
    @DisplayName("khôi phục bằng mã vẫn chạy với băm mới; mã thay thế cũng được băm bằng HMAC")
    void recoveryStillWorksAndReplacementIsKeyed() throws Exception {
        User u = newUser();
        String attempt = newAttemptId();
        String token = newSessionToken();
        Res started = call("POST", "/api/recovery/start", null, map("code", u.recoveryCode(), "attemptId", attempt, "sessionToken", token));
        assertThat(started.status()).as(String.valueOf(started.body())).isEqualTo(200);
        String replacement = started.str("replacementCode");
        assertThat(call("POST", "/api/recovery/complete", null, map("attemptId", attempt, "replacementCode", replacement)).status()).isEqualTo(200);

        String normalized = Secrets.normalize(replacement, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        assertThat(storedHash(u.identityId())).isEqualTo(hmacHex(TEST_RECOVERY_PEPPER, IdentityConstants.RECOVERY_HASH_PREFIX + normalized));
        assertThat(call("GET", "/api/sessions", token).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("V9: mọi mã khôi phục đang hiệu lực (kể cả băm kiểu cũ SHA-256) bị vô hiệu hóa; mã đã vô hiệu giữ nguyên lý do")
    void migrationInvalidatesActiveCodes() throws Exception {
        User keyed = newUser();
        String identityId = newUser().identityId();
        jdbc.sql("UPDATE recovery_codes SET invalidated_at = now(), invalidated_reason = 'recovery' WHERE identity_id = ?::uuid")
                .param(identityId).update();
        String legacy = sha256Hex(IdentityConstants.RECOVERY_HASH_PREFIX + "LEGACYCODE0000000000000000000A");
        jdbc.sql("INSERT INTO recovery_codes (id, identity_id, code_hash, created_at) VALUES (gen_random_uuid(), ?::uuid, ?, now())")
                .param(identityId).param(legacy).update();

        String sql = new String(getClass().getResourceAsStream("/db/migration/V9__recovery_code_pepper.sql").readAllBytes(), StandardCharsets.UTF_8);
        jdbc.sql(sql).update();

        assertThat(jdbc.sql("SELECT invalidated_reason FROM recovery_codes WHERE code_hash = ?").param(legacy).query(String.class).single())
                .isEqualTo("pepper_migration");
        assertThat(jdbc.sql("SELECT invalidated_reason FROM recovery_codes WHERE identity_id = ?::uuid").param(keyed.identityId())
                .query(String.class).single()).as("không phân biệt được băm cũ/mới nên vô hiệu mọi mã đang hiệu lực").isEqualTo("pepper_migration");
        assertThat(jdbc.sql("SELECT count(*) FROM recovery_codes WHERE invalidated_at IS NULL").query(Long.class).single()).isZero();
        assertThat(jdbc.sql("SELECT count(*) FROM recovery_codes WHERE identity_id = ?::uuid AND invalidated_reason = 'recovery'")
                .param(identityId).query(Long.class).single()).as("mã đã vô hiệu từ trước giữ nguyên lý do").isEqualTo(1);
    }
}
