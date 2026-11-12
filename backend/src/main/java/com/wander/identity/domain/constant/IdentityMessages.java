package com.wander.identity.domain.constant;

/** Error messages specific to the identity module (Vietnamese, for the user). Shared messages are in {@code ErrorMessages}. */
public final class IdentityMessages {

    /** The device pairing code is wrong or expired. */
    public static final String INVALID_PAIRING_CODE = "Mã ghép thiết bị không hợp lệ hoặc đã hết hạn.";

    /** The recovery code is wrong or already used. */
    public static final String INVALID_CODE = "Mã không hợp lệ hoặc đã được dùng.";

    /** The replacement code typed again is wrong. */
    public static final String INVALID_REPLACEMENT = "Mã thay thế không đúng.";

    /** The attempt id is not valid. */
    public static final String INVALID_ATTEMPT = "Mã nhận diện lần thử không hợp lệ.";

    /** The session secret is not valid. */
    public static final String INVALID_SESSION_TOKEN = "Bí mật phiên không hợp lệ.";

    /** The session secret was already used. */
    public static final String SESSION_TOKEN_IN_USE = "Bí mật phiên đã được dùng.";

    /** The action does not need re-authentication. */
    public static final String INVALID_OPERATION = "Thao tác không cần xác thực lại.";

    /** The approval code is wrong or expired. */
    public static final String INVALID_APPROVAL_CODE = "Mã phê duyệt không hợp lệ hoặc đã hết hạn.";

    /** The recovery attempt with a code has expired. */
    public static final String RECOVERY_EXPIRED = "Lần khôi phục đã hết hạn. Hãy bắt đầu lại; mã hiện tại của bạn vẫn dùng được.";

    /** The replacement code has expired. */
    public static final String REPLACEMENT_EXPIRED = "Mã thay thế đã hết hạn. Hãy tạo lại; mã hiện tại vẫn dùng được.";

    /** The recovery code was used in another recovery. */
    public static final String CODE_ALREADY_USED = "Mã này đã được dùng ở một lần khôi phục khác.";

    /** The recovery code changed while waiting. */
    public static final String CODE_CHANGED = "Mã khôi phục đã thay đổi trong lúc chờ. Hãy bắt đầu lại.";

    /** There is no pending replacement code. */
    public static final String NO_PENDING_REPLACEMENT = "Không có mã thay thế đang chờ.";

    /** Re-authentication is needed to create a new code. */
    public static final String STEP_UP_REQUIRED_FOR_NEW_CODE = "Cần xác thực lại để tạo mã mới.";

    /** Re-authentication is needed to perform the action. */
    public static final String STEP_UP_REQUIRED = "Cần xác thực lại để thực hiện thao tác này.";

    /** The device was renamed but the deviceName field was not given. */
    public static final String DEVICE_NAME_REQUIRED = "Cần nêu tên thiết bị (để trống nếu muốn xóa tên).";

    /** The matching number is outside the two-digit range. */
    public static final String MATCH_NUMBER_OUT_OF_RANGE = "Số khớp phải là số hai chữ số";

    /** Wrong number of choices. */
    public static final String MATCH_OPTIONS_COUNT = "Số lựa chọn của số khớp không đúng";

    /** The choices repeat. */
    public static final String MATCH_OPTIONS_DUPLICATED = "Các lựa chọn của số khớp bị trùng";

    /** The choices do not contain the real number. */
    public static final String MATCH_OPTIONS_MISSING_REAL = "Các lựa chọn của số khớp không chứa số thật";

    /** The stored string of choices cannot be read; parameter: the string. */
    public static final String MATCH_OPTIONS_UNREADABLE = "Không đọc được các lựa chọn số khớp: %s";

    /** The matching number is missing when approving. */
    public static final String MATCH_NUMBER_REQUIRED = "Cần chọn số khớp để duyệt.";

    /** Wrong matching number chosen: the request is denied. */
    public static final String MATCH_MISMATCH = "Số đã chọn không khớp, yêu cầu đã bị từ chối.";

    /** The recovery-code hashing key is missing or too short (the message NEVER includes the key value); parameter: the minimum number of bytes. */
    public static final String RECOVERY_PEPPER_WEAK =
            "Thiếu hoặc quá ngắn khóa băm mã khôi phục: đặt WANDER_RECOVERY_PEPPER (thuộc tính wander.security.recovery-pepper) dài ít nhất %d byte";

    /** The runtime has no HMAC-SHA-256. */
    public static final String RECOVERY_HMAC_UNAVAILABLE = "Môi trường chạy không có HMAC-SHA-256 để băm mã khôi phục";

    /** The two-key configuration is incomplete, has a duplicate label or an invalid label; never includes the secret value. */
    public static final String RECOVERY_KEY_CONFIGURATION_INVALID = "Cấu hình phiên bản khóa khôi phục không hợp lệ; kiểm tra nhãn và cặp khóa trước đó";

    /** The pepper value was changed but the key label stayed the same: stop at startup instead of silently invalidating every old code. */
    public static final String RECOVERY_KEY_FINGERPRINT_MISMATCH = "Giá trị khóa khôi phục (pepper) không khớp dấu vân tay đã lưu cho nhãn khóa này; không đổi giá trị mà giữ nhãn, hãy khôi phục khóa đúng hoặc dùng nhãn mới";

    /** Do not run with a configuration that dropped a key the data still references, so users do not lose the ability to recover. */
    public static final String RECOVERY_KEY_STILL_REQUIRED = "Thiếu phiên bản khóa khôi phục còn được dữ liệu sử dụng; khôi phục cấu hình khóa trước khi deploy";

    private IdentityMessages() {
    }
}
