package com.wander.identity.domain.port;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.rule.Secrets;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import java.util.Optional;

/**
 * Cổng băm mã khôi phục (DR-018 B3). Cài đặt dùng HMAC-SHA-256 với khóa (pepper) nằm ngoài cơ sở dữ liệu, để lộ bảng mã băm
 * mà không lộ khóa thì không dò ngược được mã. Domain chỉ biết "băm có khóa", không biết khóa lấy từ đâu.
 */
public interface RecoveryCodeHasher {

    /** Băm mã đã chuẩn hóa (chữ hoa, không gạch ngang); trả 64 ký tự hex chữ thường. */
    String hash(String normalizedCode);

    /** Nhãn khóa dùng khi phát hành mã mới. */
    String currentKeyVersion();

    /** Các nhãn còn hỗ trợ, ưu tiên khóa hiện hành. */
    List<String> keyVersions();

    /** Băm bằng đúng nhãn đã lưu; không có khóa tương ứng thì không có kết quả. */
    Optional<String> hashWithVersion(String normalizedCode, String keyVersion);

    /** Kiểm tra bằng khóa đã lưu, so sánh digest với thời gian không phụ thuộc tiền tố khớp. */
    default boolean matches(String normalizedCode, String storedHash, String keyVersion) {
        return hashWithVersion(normalizedCode, keyVersion).map(candidate -> MessageDigest.isEqual(
                candidate.getBytes(StandardCharsets.US_ASCII), storedHash.getBytes(StandardCharsets.US_ASCII))).orElse(false);
    }

    /** Băm mã đang ở dạng hiển thị (có gạch ngang, chữ thường cũng được): chuẩn hóa rồi băm; dùng khi vừa phát hành mã. */
    default String hashDisplayed(String displayedCode) {
        return hash(Secrets.normalize(displayedCode, IdentityConstants.RECOVERY_CODE_SYMBOLS));
    }
}
