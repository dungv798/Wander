package com.wander.identity.domain.constant;

/** Mã lỗi riêng của module identity (hợp đồng API, khớp {@code web/src/api.ts}). Mã dùng chung ở {@code ErrorCodes}. */
public final class IdentityErrorCodes {

    /** Mã ghép thiết bị sai hoặc hết hạn. */
    public static final String INVALID_PAIRING_CODE = "INVALID_PAIRING_CODE";

    /** Mã khôi phục sai hoặc đã dùng. */
    public static final String INVALID_CODE = "INVALID_CODE";

    /** Mã thay thế nhập lại không đúng. */
    public static final String INVALID_REPLACEMENT = "INVALID_REPLACEMENT";

    /** Mã nhận diện lần thử không hợp lệ. */
    public static final String INVALID_ATTEMPT = "INVALID_ATTEMPT";

    /** Bí mật phiên không hợp lệ hoặc đã dùng. */
    public static final String INVALID_SESSION_TOKEN = "INVALID_SESSION_TOKEN";

    /** Thao tác không nằm trong danh sách cần xác thực lại. */
    public static final String INVALID_OPERATION = "INVALID_OPERATION";

    /** Mã phê duyệt xác thực lại sai hoặc hết hạn. */
    public static final String INVALID_APPROVAL_CODE = "INVALID_APPROVAL_CODE";

    /** Lần thử khôi phục hoặc mã thay thế đã hết hạn. */
    public static final String ATTEMPT_EXPIRED = "ATTEMPT_EXPIRED";

    /** Mã khôi phục đã được dùng ở một lần khôi phục khác. */
    public static final String CODE_ALREADY_USED = "CODE_ALREADY_USED";

    /** Mã khôi phục đã đổi trong lúc chờ xác nhận. */
    public static final String CODE_CHANGED = "CODE_CHANGED";

    /** Cần xác thực lại trước khi thực hiện thao tác nhạy cảm. */
    public static final String STEP_UP_REQUIRED = "STEP_UP_REQUIRED";

    private IdentityErrorCodes() {
    }
}
