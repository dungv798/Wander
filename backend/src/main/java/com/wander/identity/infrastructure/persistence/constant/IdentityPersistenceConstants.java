package com.wander.identity.infrastructure.persistence.constant;

/** Hằng số lưu trữ của Identity (tầng CHỨC NĂNG): giá trị trạng thái lưu dạng chữ thường trong cơ sở dữ liệu. */
public final class IdentityPersistenceConstants {

    /** Trạng thái đang chờ (lần thử, mã thay thế, yêu cầu ghép, yêu cầu xác thực lại). */
    public static final String STATE_PENDING = "pending";

    /** Trạng thái đã hủy của mã thay thế. */
    public static final String STATE_VOID = "void";

    /** Trạng thái đã duyệt của yêu cầu xác thực lại. */
    public static final String STATE_APPROVED = "approved";

    private IdentityPersistenceConstants() {
    }
}
