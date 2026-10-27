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

    private IdentityMessages() {
    }
}
