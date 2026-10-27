package com.wander.identity.domain.rule;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.identity.domain.constant.IdentityConstants;
import org.junit.jupiter.api.Test;

class SecretsTest {

    @Test
    void recoveryCodeShapeAndNormalization() {
        String code = Secrets.newRecoveryCode();
        assertThat(code).matches("^([0-9A-HJKMNP-TV-Z]{5}-){5}[0-9A-HJKMNP-TV-Z]{5}$");
        String norm = Secrets.normalize(code, IdentityConstants.RECOVERY_CODE_SYMBOLS);
        assertThat(norm).hasSize(30).doesNotContain("-");
        // Người dùng gõ chữ thường, thêm khoảng trắng, nhầm O/0 và I/L/1 vẫn khớp
        String typed = " " + code.toLowerCase().replace('0', 'o').replace('1', 'l').replace("-", " ") + " ";
        assertThat(Secrets.normalize(typed, IdentityConstants.RECOVERY_CODE_SYMBOLS)).isEqualTo(norm);
        assertThat(Secrets.normalize("khong phai ma", 30)).isNull();
        assertThat(Secrets.normalize(42, 30)).isNull();
    }

    @Test
    void hashesAreHexAndDomainSeparated() {
        String n = Secrets.normalize(Secrets.newRecoveryCode(), 30);
        assertThat(Secrets.hashRecoveryCode(n)).matches("^[0-9a-f]{64}$").isNotEqualTo(Secrets.hashToken(n));
        assertThat(Secrets.newSessionToken()).matches(Secrets.SESSION_TOKEN.pattern()).hasSize(43);
        assertThat(Secrets.newShortCode()).matches("^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$");
    }
}
