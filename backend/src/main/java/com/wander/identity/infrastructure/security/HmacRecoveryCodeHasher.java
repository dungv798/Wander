package com.wander.identity.infrastructure.security;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.port.RecoveryCodeHasher;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
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

    private final SecretKeySpec key;

    /** Dựng từ khóa cấu hình; khóa thiếu, trống hoặc ngắn thì ném lỗi khởi động (lời báo không chứa khóa). */
    public HmacRecoveryCodeHasher(@Value(IdentityConstants.RECOVERY_PEPPER_EXPRESSION) String pepper) {
        boolean unresolvedPlaceholder = pepper != null && pepper.strip().startsWith(IdentityConstants.PLACEHOLDER_PREFIX);
        byte[] bytes = pepper == null || unresolvedPlaceholder ? new byte[0] : pepper.strip().getBytes(StandardCharsets.UTF_8);
        if (bytes.length < IdentityConstants.RECOVERY_PEPPER_MIN_BYTES) {
            throw new IllegalStateException(IdentityMessages.RECOVERY_PEPPER_WEAK.formatted(IdentityConstants.RECOVERY_PEPPER_MIN_BYTES));
        }
        this.key = new SecretKeySpec(bytes, IdentityConstants.RECOVERY_HMAC_ALGORITHM);
    }

    @Override
    public String hash(String normalizedCode) {
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
