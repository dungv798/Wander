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
 * Checks the data after Flyway: a key that codes in force still need must not be dropped, and a key value must not change while its label
 * stays the same (compared with the stored fingerprint). On failure startup stops; the key is never printed.
 */
@Component
@Profile(ConfigConstants.FREE_PROFILE)
public class RecoveryKeyReadiness implements ApplicationRunner {

    private final RecoveryCodeJpaRepository codes;
    private final RecoveryKeyCheckJpaRepository checks;
    private final RecoveryCodeHasher hasher;
    private final Clock clock;
    private final TransactionTemplate transaction;

    /** Takes the metadata query, the fingerprint table, the key set, the clock and the transaction manager; it never needs to read a plaintext code or print a secret. */
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

    /** Every key label that codes in force or pending codes still need must be in the configuration. */
    void ensureRequiredKeysConfigured() {
        if (!hasher.keyVersions().containsAll(codes.findRequiredKeyVersions())) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_KEY_STILL_REQUIRED);
        }
    }

    /**
     * A label seen for the first time gets its fingerprint recorded (trust on first use); a label that exists with a different fingerprint means the pepper value was
     * changed while the label stayed the same, so startup stops instead of silently invalidating every old code.
     */
    void ensureFingerprintsMatch() {
        transaction.executeWithoutResult(status -> verifyFingerprints());
    }

    /** Records or compares the fingerprint of each key label in one transaction (a write needs a transaction even when it runs at startup). */
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
