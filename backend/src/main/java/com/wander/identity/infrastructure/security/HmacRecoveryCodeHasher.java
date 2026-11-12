package com.wander.identity.infrastructure.security;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.port.RecoveryCodeHasher;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Hashes recovery codes with HMAC-SHA-256 using a key (pepper) taken from the configuration {@code wander.security.recovery-pepper}
 * (environment variable {@code WANDER_RECOVERY_PEPPER}). A missing key, or one shorter than
 * {@value IdentityConstants#RECOVERY_PEPPER_MIN_BYTES} bytes, means the application does NOT start (there is no default key, so it can
 * never run with a guessable one). The key is never written to a log or an error message.
 */
@Component
public class HmacRecoveryCodeHasher implements RecoveryCodeHasher {

    private final String currentVersion;
    private final Map<String, SecretKeySpec> keys;
    private final List<String> versions;

    /** Built from the configured key; a missing, empty or short key throws a startup error (the message does not contain the key). */
    public HmacRecoveryCodeHasher(String pepper) {
        this(pepper, IdentityConstants.RECOVERY_LEGACY_KEY_VERSION, "", "");
    }

    /** Takes the current key and optionally the previous key; half a configuration or a duplicate label stops startup. */
    @Autowired
    public HmacRecoveryCodeHasher(@Value(IdentityConstants.RECOVERY_PEPPER_EXPRESSION) String pepper,
                                 @Value(IdentityConstants.RECOVERY_KEY_VERSION_EXPRESSION) String currentVersion,
                                 @Value(IdentityConstants.RECOVERY_PREVIOUS_KEY_VERSION_EXPRESSION) String previousVersion,
                                 @Value(IdentityConstants.RECOVERY_PREVIOUS_PEPPER_EXPRESSION) String previousPepper) {
        boolean hasPrevious = previousVersion != null && !previousVersion.isBlank();
        boolean hasPreviousPepper = previousPepper != null && !previousPepper.isBlank();
        if (!validVersion(currentVersion) || hasPrevious != hasPreviousPepper
                || hasPrevious && (!validVersion(previousVersion) || previousVersion.equals(currentVersion))) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_KEY_CONFIGURATION_INVALID);
        }
        SecretKeySpec currentKey = keyOf(pepper);
        this.currentVersion = currentVersion;
        this.keys = hasPrevious ? Map.of(currentVersion, currentKey, previousVersion, keyOf(previousPepper)) : Map.of(currentVersion, currentKey);
        this.versions = hasPrevious ? List.of(currentVersion, previousVersion) : List.of(currentVersion);
    }

    /** A key label contains only the characters the configuration allows, at most 32 characters. */
    private static boolean validVersion(String version) {
        return version != null && version.matches(IdentityConstants.RECOVERY_KEY_VERSION_REGEX);
    }

    /** Creates the HMAC key with its length checked, without putting the secret into an exception. */
    private static SecretKeySpec keyOf(String pepper) {
        boolean unresolvedPlaceholder = pepper != null && pepper.strip().startsWith(IdentityConstants.PLACEHOLDER_PREFIX);
        byte[] bytes = pepper == null || unresolvedPlaceholder ? new byte[0] : pepper.strip().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < IdentityConstants.RECOVERY_PEPPER_MIN_BYTES) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_PEPPER_WEAK.formatted(IdentityConstants.RECOVERY_PEPPER_MIN_BYTES));
        }
        return new SecretKeySpec(bytes, IdentityConstants.RECOVERY_HMAC_ALGORITHM);
    }

    @Override
    public String hash(String normalizedCode) {
        return digest(normalizedCode, keys.get(currentVersion));
    }

    @Override
    public String currentKeyVersion() {
        return currentVersion;
    }

    @Override
    public List<String> keyVersions() {
        return versions;
    }

    @Override
    public Optional<String> hashWithVersion(String normalizedCode, String keyVersion) {
        return Optional.ofNullable(keys.get(keyVersion)).map(key -> digest(normalizedCode, key));
    }

    @Override
    public Optional<String> keyFingerprint(String keyVersion) {
        return Optional.ofNullable(keys.get(keyVersion)).map(key ->
                digest(IdentityConstants.RECOVERY_KEY_CHECK_PREFIX + keyVersion, key).substring(0, IdentityConstants.RECOVERY_KEY_FINGERPRINT_HEX_LENGTH));
    }

    /** Hashes with the chosen key; each use gets its own Mac because a Mac is not safe to share between threads. */
    private static String digest(String normalizedCode, SecretKeySpec key) {
        try {
            Mac mac = Mac.getInstance(IdentityConstants.RECOVERY_HMAC_ALGORITHM);
            mac.init(key);
            byte[] digest = mac.doFinal((IdentityConstants.RECOVERY_HASH_PREFIX + normalizedCode).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_HMAC_UNAVAILABLE, e);
        }
    }
}
