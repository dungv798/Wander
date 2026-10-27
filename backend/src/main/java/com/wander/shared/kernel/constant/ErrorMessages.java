package com.wander.shared.kernel.constant;

/**
 * Lời báo lỗi dùng chung (tiếng Việt cho người dùng, tiếng Anh/ngắn cho lỗi lập trình) đi kèm các mã ở {@link ErrorCodes}.
 * Lời của một module nằm ở tệp {@code *Messages} của module đó.
 */
public final class ErrorMessages {

    /** Giá trị gửi lên không hợp lệ (dùng khi chỉ biết tên trường sai). */
    public static final String VALUE_INVALID = "Giá trị không hợp lệ.";

    /** Không tìm thấy tài nguyên. */
    public static final String NOT_FOUND = "Không tìm thấy.";

    /** Dữ liệu vừa bị sửa ở nơi khác. */
    public static final String CONCURRENT_MODIFICATION = "Dữ liệu vừa được thay đổi ở nơi khác. Hãy tải lại.";

    /** Phương thức HTTP không được hỗ trợ. */
    public static final String METHOD_NOT_ALLOWED = "Phương thức không được hỗ trợ.";

    /** Lỗi máy chủ chung, không lộ chi tiết. */
    public static final String INTERNAL = "Đã xảy ra lỗi.";

    /** Nội dung ghi log khi gặp lỗi không lường trước. */
    public static final String UNEXPECTED_ERROR_LOG = "Lỗi không mong đợi";

    /** Yêu cầu thiếu phiên hợp lệ. */
    public static final String SESSION_REQUIRED = "Cần phiên hợp lệ.";

    /** Thân yêu cầu không phải JSON. */
    public static final String JSON_SYNTAX_INVALID = "Nội dung không phải JSON hợp lệ.";

    /** Thân yêu cầu là JSON nhưng không phải đối tượng. */
    public static final String JSON_OBJECT_REQUIRED = "Nội dung phải là một đối tượng JSON.";

    /** Thân yêu cầu quá lớn. */
    public static final String BODY_TOO_LARGE = "Nội dung gửi lên quá lớn.";

    /** Thao tác quá nhanh. */
    public static final String RATE_LIMITED = "Bạn thao tác quá nhanh. Hãy thử lại sau.";

    /** Lỗi lập trình: đọc giá trị của Patch vắng mặt. */
    public static final String PATCH_VALUE_ABSENT = "Patch is absent";

    private ErrorMessages() {
    }
}
