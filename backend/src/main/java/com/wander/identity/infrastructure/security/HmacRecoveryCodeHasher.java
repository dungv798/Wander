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
 * Băm mã khôi phục bằng HMAC-SHA-256 với khóa (pepper) lấy từ cấu hình {@code wander.security.recovery-pepper}
 * (biến môi trường {@code WANDER_RECOVERY_PEPPER}). Thiếu khóa hoặc khóa ngắn hơn
 * {@value IdentityConstants#RECOVERY_PEPPER_MIN_BYTES} byte thì ứng dụng KHÔNG khởi động (không có khóa mặc định, để không
 * bao giờ chạy với khóa đoán được). Không bao giờ ghi khóa vào log hay lời báo lỗi.
 */
@Component
public class HmacRecoveryCodeHasher implements RecoveryCodeHasher {

    private final String currentVersion;
    private final Map<String, SecretKeySpec> keys;
    private final List<String> versions;

    /** Dựng từ khóa cấu hình; khóa thiếu, trống hoặc ngắn thì ném lỗi khởi động (lời báo không chứa khóa). */
    public HmacRecoveryCodeHasher(String pepper) {
        this(pepper, IdentityConstants.RECOVERY_LEGACY_KEY_VERSION, "", "");
    }

    /** Nhận khóa hiện hành và tùy chọn khóa trước đó; thiếu một nửa cấu hình hoặc trùng nhãn thì dừng khởi động. */
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

    /** Nhãn khóa chỉ chứa ký tự cấu hình cho phép, tối đa 32 ký tự. */
    private static boolean validVersion(String version) {
        return version != null && version.matches(IdentityConstants.RECOVERY_KEY_VERSION_REGEX);
    }

    /** Tạo khóa HMAC đã kiểm độ dài, không đưa secret vào ngoại lệ. */
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

    /** Băm với khóa đã chọn; mỗi lần dùng Mac riêng vì Mac không an toàn khi chia sẻ giữa thread. */
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
