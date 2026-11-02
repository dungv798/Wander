package com.wander.identity.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.identity.infrastructure.persistence.repository.RecoveryCodeJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.RecoveryKeyCheckJpaRepository;
import com.wander.support.ApiTestSupport;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.PlatformTransactionManager;

/** Dấu vân tay khóa trên DB thật: lần đầu ghi nhận, cùng khóa thì qua, đổi pepper mà giữ nhãn thì dừng khởi động. */
class RecoveryKeyFingerprintIT extends ApiTestSupport {

    private static final String PEPPER_A = "test-only-fingerprint-pepper-A-0123456789-abcdefghij";
    private static final String PEPPER_B = "test-only-fingerprint-pepper-B-0123456789-abcdefghij";

    @Autowired
    private RecoveryCodeJpaRepository codes;
    @Autowired
    private RecoveryKeyCheckJpaRepository checks;
    @Autowired
    private PlatformTransactionManager transactionManager;

    private RecoveryKeyReadiness readinessFor(String label, String pepper) {
        return new RecoveryKeyReadiness(codes, checks, new HmacRecoveryCodeHasher(pepper, label, "", ""), java.time.Clock.systemUTC(), transactionManager);
    }

    @Test
    @DisplayName("nhãn mới được ghi dấu vân tay; cùng khóa qua; đổi pepper giữ nhãn thì fail-fast mà không in khóa")
    void changedPepperUnderSameLabelStopsStartup() {
        String label = "t" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        try {
            assertThatCode(() -> readinessFor(label, PEPPER_A).ensureFingerprintsMatch()).doesNotThrowAnyException();
            assertThat(checks.findById(label)).isPresent();
            assertThat(checks.findById(label).orElseThrow().getFingerprint()).hasSize(16).doesNotContain(PEPPER_A);
            assertThatCode(() -> readinessFor(label, PEPPER_A).ensureFingerprintsMatch()).doesNotThrowAnyException();
            assertThatThrownBy(() -> readinessFor(label, PEPPER_B).ensureFingerprintsMatch())
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("không khớp dấu vân tay")
                    .hasMessageNotContaining(PEPPER_A).hasMessageNotContaining(PEPPER_B);
            assertThatCode(() -> readinessFor(label + "n", PEPPER_B).ensureFingerprintsMatch()).as("nhãn mới với khóa mới là hợp lệ")
                    .doesNotThrowAnyException();
        } finally {
            checks.deleteById(label);
            checks.deleteById(label + "n");
        }
    }
}
