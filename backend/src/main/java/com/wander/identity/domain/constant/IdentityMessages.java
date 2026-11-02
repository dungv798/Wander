package com.wander.identity.domain.constant;

/** Lời báo lỗi riêng của module identity (tiếng Việt cho người dùng). Lời dùng chung ở {@code ErrorMessages}. */
public final class IdentityMessages {

    /** Mã ghép thiết bị sai hoặc hết hạn. */
    public static final String INVALID_PAIRING_CODE = "Mã ghép thiết bị không hợp lệ hoặc đã hết hạn.";

    /** Mã khôi phục sai hoặc đã dùng. */
    public static final String INVALID_CODE = "Mã không hợp lệ hoặc đã được dùng.";

    /** Mã thay thế nhập lại không đúng. */
    public static final String INVALID_REPLACEMENT = "Mã thay thế không đúng.";

    /** Mã nhận diện lần thử không hợp lệ. */
    public static final String INVALID_ATTEMPT = "Mã nhận diện lần thử không hợp lệ.";

    /** Bí mật phiên không hợp lệ. */
    public static final String INVALID_SESSION_TOKEN = "Bí mật phiên không hợp lệ.";

    /** Bí mật phiên đã được dùng. */
    public static final String SESSION_TOKEN_IN_USE = "Bí mật phiên đã được dùng.";

    /** Thao tác không cần xác thực lại. */
    public static final String INVALID_OPERATION = "Thao tác không cần xác thực lại.";

    /** Mã phê duyệt sai hoặc hết hạn. */
    public static final String INVALID_APPROVAL_CODE = "Mã phê duyệt không hợp lệ hoặc đã hết hạn.";

    /** Lần khôi phục bằng mã đã hết hạn. */
    public static final String RECOVERY_EXPIRED = "Lần khôi phục đã hết hạn. Hãy bắt đầu lại; mã hiện tại của bạn vẫn dùng được.";

    /** Mã thay thế đã hết hạn. */
    public static final String REPLACEMENT_EXPIRED = "Mã thay thế đã hết hạn. Hãy tạo lại; mã hiện tại vẫn dùng được.";

    /** Mã khôi phục đã dùng ở lần khác. */
    public static final String CODE_ALREADY_USED = "Mã này đã được dùng ở một lần khôi phục khác.";

    /** Mã khôi phục đổi trong lúc chờ. */
    public static final String CODE_CHANGED = "Mã khôi phục đã thay đổi trong lúc chờ. Hãy bắt đầu lại.";

    /** Không có mã thay thế đang chờ. */
    public static final String NO_PENDING_REPLACEMENT = "Không có mã thay thế đang chờ.";

    /** Cần xác thực lại để tạo mã mới. */
    public static final String STEP_UP_REQUIRED_FOR_NEW_CODE = "Cần xác thực lại để tạo mã mới.";

    /** Cần xác thực lại để thực hiện thao tác. */
    public static final String STEP_UP_REQUIRED = "Cần xác thực lại để thực hiện thao tác này.";

    /** Đổi tên thiết bị nhưng không nêu trường deviceName. */
    public static final String DEVICE_NAME_REQUIRED = "Cần nêu tên thiết bị (để trống nếu muốn xóa tên).";

    /** Số khớp nằm ngoài khoảng hai chữ số. */
    public static final String MATCH_NUMBER_OUT_OF_RANGE = "Số khớp phải là số hai chữ số";

    /** Sai số lượng lựa chọn. */
    public static final String MATCH_OPTIONS_COUNT = "Số lựa chọn của số khớp không đúng";

    /** Lựa chọn trùng nhau. */
    public static final String MATCH_OPTIONS_DUPLICATED = "Các lựa chọn của số khớp bị trùng";

    /** Lựa chọn không chứa số thật. */
    public static final String MATCH_OPTIONS_MISSING_REAL = "Các lựa chọn của số khớp không chứa số thật";

    /** Chuỗi lựa chọn đã lưu không đọc được; tham số: chuỗi. */
    public static final String MATCH_OPTIONS_UNREADABLE = "Không đọc được các lựa chọn số khớp: %s";

    /** Thiếu số khớp khi duyệt. */
    public static final String MATCH_NUMBER_REQUIRED = "Cần chọn số khớp để duyệt.";

    /** Chọn sai số khớp: yêu cầu bị từ chối. */
    public static final String MATCH_MISMATCH = "Số đã chọn không khớp, yêu cầu đã bị từ chối.";

    /** Khóa băm mã khôi phục thiếu hoặc quá ngắn (KHÔNG kèm giá trị khóa); tham số: số byte tối thiểu. */
    public static final String RECOVERY_PEPPER_WEAK =
            "Thiếu hoặc quá ngắn khóa băm mã khôi phục: đặt WANDER_RECOVERY_PEPPER (thuộc tính wander.security.recovery-pepper) dài ít nhất %d byte";

    /** Môi trường chạy không có HMAC-SHA-256. */
    public static final String RECOVERY_HMAC_UNAVAILABLE = "Môi trường chạy không có HMAC-SHA-256 để băm mã khôi phục";

    /** Cấu hình hai khóa không đầy đủ, trùng nhãn hoặc có nhãn không hợp lệ; không kèm giá trị secret. */
    public static final String RECOVERY_KEY_CONFIGURATION_INVALID = "Cấu hình phiên bản khóa khôi phục không hợp lệ; kiểm tra nhãn và cặp khóa trước đó";

    /** Không chạy với cấu hình bỏ mất khóa mà dữ liệu còn tham chiếu, tránh làm người dùng mất khả năng khôi phục. */
    public static final String RECOVERY_KEY_STILL_REQUIRED = "Thiếu phiên bản khóa khôi phục còn được dữ liệu sử dụng; khôi phục cấu hình khóa trước khi deploy";

    private IdentityMessages() {
    }
}
