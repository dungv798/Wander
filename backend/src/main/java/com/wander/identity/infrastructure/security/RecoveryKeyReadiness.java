package com.wander.identity.infrastructure.security;

import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.port.RecoveryCodeHasher;
import com.wander.identity.infrastructure.persistence.repository.RecoveryCodeJpaRepository;
import com.wander.identity.infrastructure.persistence.repository.RecoveryKeyCheckJpaRepository;
import com.wander.shared.kernel.constant.ConfigConstants;
import com.wander.shared.kernel.util.Timestamps;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Kiểm tra dữ liệu sau Flyway: không được bỏ khóa mà mã đang hiệu lực vẫn cần, và giá trị khóa không được đổi trong khi nhãn
 * giữ nguyên (so với dấu vân tay đã lưu). Lỗi thì dừng khởi động; không bao giờ in khóa.
 */
@Component
@Profile(ConfigConstants.FREE_PROFILE)
public class RecoveryKeyReadiness implements ApplicationRunner {

    private final RecoveryCodeJpaRepository codes;
    private final RecoveryKeyCheckJpaRepository checks;
    private final RecoveryCodeHasher hasher;
    private final Clock clock;
    private final TransactionTemplate transaction;

    /** Nhận truy vấn metadata, bảng dấu vân tay, bộ khóa, đồng hồ và bộ quản lý giao dịch; không cần đọc mã plaintext hoặc in secret. */
    public RecoveryKeyReadiness(RecoveryCodeJpaRepository codes, RecoveryKeyCheckJpaRepository checks, RecoveryCodeHasher hasher, Clock clock,
                                PlatformTransactionManager transactionManager) {
        this.codes = codes;
        this.checks = checks;
        this.hasher = hasher;
        this.clock = clock;
        this.transaction = new TransactionTemplate(transactionManager);
    }

    @Override
    public void run(ApplicationArguments arguments) {
        ensureRequiredKeysConfigured();
        ensureFingerprintsMatch();
    }

    /** Mọi nhãn khóa mà mã đang hiệu lực hoặc mã chờ còn cần phải có trong cấu hình. */
    void ensureRequiredKeysConfigured() {
        if (!hasher.keyVersions().containsAll(codes.findRequiredKeyVersions())) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_KEY_STILL_REQUIRED);
        }
    }

    /**
     * Nhãn lần đầu thấy thì ghi dấu vân tay (tin ở lần dùng đầu); nhãn đã có mà dấu vân tay khác nghĩa là giá trị pepper đã
     * bị đổi trong khi nhãn giữ nguyên, nên dừng khởi động thay vì để mọi mã cũ vô hiệu im lặng.
     */
    void ensureFingerprintsMatch() {
        transaction.executeWithoutResult(status -> verifyFingerprints());
    }

    /** Ghi hoặc so dấu vân tay của từng nhãn khóa trong một giao dịch (lệnh ghi cần giao dịch dù chạy lúc khởi động). */
    private void verifyFingerprints() {
        for (String version : hasher.keyVersions()) {
            String fingerprint = hasher.keyFingerprint(version).orElseThrow();
            if (checks.insertIfAbsent(version, fingerprint, Timestamps.now(clock)) > 0) continue;
            String stored = checks.findById(version).orElseThrow().getFingerprint();
            if (!MessageDigest.isEqual(stored.getBytes(StandardCharsets.US_ASCII), fingerprint.getBytes(StandardCharsets.US_ASCII))) {
                throw new IllegalStateException(IdentityMessages.RECOVERY_KEY_FINGERPRINT_MISMATCH);
            }
        }
    }
}
