package com.wander.identity.domain.port;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.rule.Secrets;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;

/**
 * Port for hashing recovery codes (DR-018 B3). The implementation uses HMAC-SHA-256 with a key (pepper) kept outside the database, so a leaked table of hashes
 * without the key cannot be reversed to find codes. The domain only knows 'keyed hash', not where the key comes from.
 */
public interface RecoveryCodeHasher {

    /** Hashes a normalized code (uppercase, no hyphens); returns 64 lowercase hex characters. */
    String hash(String normalizedCode);

    /** Label of the key used when issuing a new code. */
    String currentKeyVersion();

    /** The labels still supported, the current key first. */
    List<String> keyVersions();

    /** Hashes with exactly the stored label; with no matching key there is no result. */
    Optional<String> hashWithVersion(String normalizedCode, String keyVersion);

    /**
     * Fingerprint of the key for a label (part of the HMAC of a public constant, hex); no key for the label means no result.
     * Used to detect a changed pepper value under an unchanged label; it does not reveal the key.
     */
    Optional<String> keyFingerprint(String keyVersion);

    /** Verifies with the stored key, comparing digests in time that does not depend on how long a prefix matches. */
    default boolean matches(String normalizedCode, String storedHash, String keyVersion) {
        return hashWithVersion(normalizedCode, keyVersion).map(candidate -> MessageDigest.isEqual(
                candidate.getBytes(StandardCharsets.US_ASCII), storedHash.getBytes(StandardCharsets.US_ASCII))).orElse(false);
    }

    /** Hashes a code in display form (hyphens allowed, lowercase also fine): normalize, then hash; used right after issuing a code. */
    default String hashDisplayed(String displayedCode) {
        return hash(Secrets.normalize(displayedCode, IdentityConstants.RECOVERY_CODE_SYMBOLS));
    }
}
