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

    /** Số khớp nhỏ nhất và lớn nhất (hai chữ số, DR-018 E1). */
    public static final int MATCH_NUMBER_MIN = 10;
    public static final int MATCH_NUMBER_MAX = 99;

    /** Số lựa chọn hiện cho máy duyệt: một số thật và các số nhiễu. */
    public static final int MATCH_OPTION_COUNT = 3;

    /** Dấu ngăn cách các lựa chọn khi lưu một cột. */
    public static final String MATCH_OPTIONS_SEPARATOR = ",";

    /** Độ dài tối đa của tên thiết bị (khớp CHECK ở migration V5). */
    public static final int MAX_DEVICE_NAME_LENGTH = 60;

    /** Dãy khoảng trắng (kể cả dấu cách không ngắt) trong tên thiết bị, được gộp thành một dấu cách. */
    public static final String DEVICE_NAME_WHITESPACE_REGEX = "[\\p{Zs}\\s]+";

    /** Dấu cách đơn dùng khi gộp khoảng trắng trong tên thiết bị. */
    public static final String SINGLE_SPACE = " ";

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

    /** Số sự kiện bảo mật giữ lại cho mỗi danh tính và trả về cho "Hoạt động gần đây" (BE-11). */
    public static final int MAX_EVENTS_PER_IDENTITY = 50;

    /** Biểu thức cấu hình lấy khóa băm mã khôi phục; KHÔNG có giá trị mặc định (thiếu thì Spring không khởi động). */
    public static final String RECOVERY_PEPPER_EXPRESSION = "${wander.security.recovery-pepper}";

    /** Phiên bản mặc định của khóa đã dùng trước khi có metadata xoay khóa. */
    public static final String RECOVERY_LEGACY_KEY_VERSION = "v1";

    /** Nhãn khóa hiện hành, không phải secret. */
    public static final String RECOVERY_KEY_VERSION_EXPRESSION = "${wander.security.recovery-key-version:v1}";

    /** Nhãn khóa cũ được giữ trong giai đoạn chuyển tiếp. */
    public static final String RECOVERY_PREVIOUS_KEY_VERSION_EXPRESSION = "${wander.security.recovery-previous-key-version:}";

    /** Khóa cũ, chỉ cấu hình khi còn mã hoặc lần thử tham chiếu nhãn cũ. */
    public static final String RECOVERY_PREVIOUS_PEPPER_EXPRESSION = "${wander.security.recovery-previous-pepper:}";

    /** Nhãn khóa an toàn để ghi metadata và kiểm tra khi khởi động. */
    public static final String RECOVERY_KEY_VERSION_REGEX = "^[A-Za-z0-9_-]{1,32}$";

    /** Độ dài cột metadata nhãn khóa. */
    public static final int RECOVERY_KEY_VERSION_MAX_LENGTH = 32;

    /** Độ dài tối đa của dấu vân tay khóa lưu trong DB (hex). */
    public static final int RECOVERY_KEY_FINGERPRINT_MAX_LENGTH = 64;

    /** Số ký tự hex đầu của HMAC được giữ làm dấu vân tay: đủ phân biệt khóa nhưng cắt ngắn để không thành oracle. */
    public static final int RECOVERY_KEY_FINGERPRINT_HEX_LENGTH = 16;

    /** Tiền tố của hằng số công khai được băm để lấy dấu vân tay khóa; khác không gian mã khôi phục. */
    public static final String RECOVERY_KEY_CHECK_PREFIX = "wander-key-check:";

    /** Tiền tố của placeholder cấu hình chưa được giải quyết; khóa bắt đầu bằng tiền tố này bị coi là thiếu khóa. */
    public static final String PLACEHOLDER_PREFIX = "${";

    /** Thuật toán HMAC dùng để băm mã khôi phục (DR-018 B3). */
    public static final String RECOVERY_HMAC_ALGORITHM = "HmacSHA256";

    /** Độ dài tối thiểu của khóa (pepper) băm mã khôi phục, tính bằng byte (256 bit). */
    public static final int RECOVERY_PEPPER_MIN_BYTES = 32;

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
