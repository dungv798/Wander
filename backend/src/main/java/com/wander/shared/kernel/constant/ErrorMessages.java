package com.wander.shared.kernel.constant;

/**
 * Shared error messages (Vietnamese for the user, short English for programming errors) that go with the codes in {@link ErrorCodes}.
 * A module's messages are in that module's {@code *Messages} file.
 */
public final class ErrorMessages {

    /** The submitted value is not valid (used when only the name of the wrong field is known). */
    public static final String VALUE_INVALID = "Giá trị không hợp lệ.";

    /** The resource was not found. */
    public static final String NOT_FOUND = "Không tìm thấy.";

    /** The data was just edited elsewhere. */
    public static final String CONCURRENT_MODIFICATION = "Dữ liệu vừa được thay đổi ở nơi khác. Hãy tải lại.";

    /** The HTTP method is not supported. */
    public static final String METHOD_NOT_ALLOWED = "Phương thức không được hỗ trợ.";

    /** A generic server error that exposes no details. */
    public static final String INTERNAL = "Đã xảy ra lỗi.";

    /** The text logged when an unexpected error happens. */
    public static final String UNEXPECTED_ERROR_LOG = "Lỗi không mong đợi";
    public static final String INTEGRITY_VIOLATION_LOG = "Vi phạm ràng buộc dữ liệu (trả 409): {}";

    /** The request has no valid session. */
    public static final String SESSION_REQUIRED = "Cần phiên hợp lệ.";

    /** The request body is not JSON. */
    public static final String JSON_SYNTAX_INVALID = "Nội dung không phải JSON hợp lệ.";

    /** The request body is JSON but not an object. */
    public static final String JSON_OBJECT_REQUIRED = "Nội dung phải là một đối tượng JSON.";

    /** The request body is too large. */
    public static final String BODY_TOO_LARGE = "Nội dung gửi lên quá lớn.";

    /** The action was too fast. */
    public static final String RATE_LIMITED = "Bạn thao tác quá nhanh. Hãy thử lại sau.";

    /** Programming error: reading the value of an absent Patch. */
    public static final String PATCH_VALUE_ABSENT = "Patch is absent";

    private ErrorMessages() {
    }
}
