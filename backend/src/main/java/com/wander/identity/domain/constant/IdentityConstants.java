package com.wander.identity.domain.constant;

import java.time.Duration;
import java.util.Set;

/**
 * Hằng số của module identity (tầng CHỨC NĂNG): định dạng mã và bí mật, hạn chờ, thao tác cần xác thực lại.
 * Mã lỗi ở {@link IdentityErrorCodes}, lời báo ở {@link IdentityMessages}.
 */
public final class IdentityConstants {

    /** Bảng chữ Crockford base32 (không có I, L, O, U) để đọc và chép tay ít nhầm. */
    public static final String CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

    /** Mặt nạ lấy 5 bit thấp của một byte để chọn ký hiệu; 256 chia hết cho 32 nên phân bố đều. */
    public static final int SYMBOL_BIT_MASK = 31;

    /** Số ký hiệu của mã khôi phục: 30 × 5 bit = 150 bit; mã tự chứa đủ thông tin để tìm danh tính (MĐ-8). */
    public static final int RECOVERY_CODE_SYMBOLS = 30;

    /** Số ký hiệu của mã ngắn dùng một lần (ghép thiết bị, phê duyệt xác thực lại). */
    public static final int SHORT_CODE_SYMBOLS = 8;

    /** Số ký hiệu mỗi nhóm khi hiển thị mã khôi phục. */
    public static final int CODE_GROUP_SIZE = 5;

    /** Số ký hiệu của mỗi nửa mã ngắn ({@code XXXX-XXXX}). */
    public static final int SHORT_CODE_HALF_LENGTH = 4;

    /** Ký tự ngăn cách các nhóm của mã hiển thị. */
    public static final char CODE_GROUP_SEPARATOR = '-';

    /** Số byte ngẫu nhiên của bí mật phiên mới (256 bit). */
    public static final int SESSION_TOKEN_BYTES = 32;

    /** Độ dài tối đa của mã người dùng nhập, để chặn đầu vào quá lớn trước khi chuẩn hóa. */
    public static final int MAX_CODE_INPUT_LENGTH = 80;

    /** Bí mật phiên do bên giữ phiên tự sinh (từ 256 bit, base64url). */
    public static final String SESSION_TOKEN_REGEX = "^[A-Za-z0-9_-]{43,128}$";

    /** Mã nhận diện một lần thử khôi phục do client sinh. */
    public static final String ATTEMPT_KEY_REGEX = "^[A-Za-z0-9_-]{16,128}$";

    /** Khoảng trắng và gạch ngang, bỏ đi khi chuẩn hóa mã người dùng nhập. */
    public static final String CODE_NOISE_REGEX = "[\\s-]";

    /** Thuật toán băm. */
    public static final String HASH_ALGORITHM = "SHA-256";

    /** Tiền tố khi băm mã khôi phục, để băm mã khác với băm bí mật phiên. */
    public static final String RECOVERY_HASH_PREFIX = "wander-recovery-v1:";

    /** Hạn của lần thử khôi phục chờ và mã thay thế chưa xác nhận (MĐ-6). Giá trị cụ thể: chờ spec. */
    public static final Duration PENDING_TTL = Duration.ofMinutes(15);

    /** Hạn của yêu cầu ghép thiết bị và yêu cầu phê duyệt xác thực lại. */
    public static final Duration APPROVAL_TTL = Duration.ofMinutes(5);

    /** Thao tác cần xác thực lại: tạo lại mã khôi phục. */
    public static final String OPERATION_REGENERATE_CODE = "regenerate_code";

    /** Các thao tác được phép xin phê duyệt xác thực lại. */
    public static final Set<String> STEP_UP_OPERATIONS = Set.of(OPERATION_REGENERATE_CODE);

    /** Lý do vô hiệu mã khôi phục: đã dùng để khôi phục. */
    public static final String INVALIDATED_BY_RECOVERY = "recovered";

    /** Lý do vô hiệu mã khôi phục: đã bị mã thay thế. */
    public static final String INVALIDATED_BY_REPLACEMENT = "replaced";

    private IdentityConstants() {
    }
}
