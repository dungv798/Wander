package com.wander.shared.kernel.constant;

/**
 * Mã lỗi ổn định mà giao diện dựa vào (hợp đồng API, xem docs/ux/error-codes.md): chỉ các mã dùng chung cho cả hệ thống.
 * Mã riêng của một module nằm ở tệp {@code *ErrorCodes} của module đó.
 */
public final class ErrorCodes {

    /** Không tìm thấy tài nguyên (hoặc tài nguyên của người khác). */
    public static final String NOT_FOUND = "NOT_FOUND";

    /** Hai thao tác sửa cùng một dữ liệu cùng lúc (khóa lạc quan). */
    public static final String CONCURRENT_MODIFICATION = "CONCURRENT_MODIFICATION";

    /** Phương thức HTTP không được hỗ trợ cho đường dẫn này. */
    public static final String METHOD_NOT_ALLOWED = "METHOD_NOT_ALLOWED";

    /** Lỗi không lường trước ở phía máy chủ. */
    public static final String INTERNAL = "INTERNAL";

    /** Yêu cầu không có phiên hợp lệ. */
    public static final String UNAUTHENTICATED = "UNAUTHENTICATED";

    /** Vượt giới hạn tần suất. */
    public static final String RATE_LIMITED = "RATE_LIMITED";

    /** Thân yêu cầu không phải JSON hợp lệ hoặc không phải đối tượng JSON. */
    public static final String INVALID_JSON = "INVALID_JSON";

    /** Thân yêu cầu vượt giới hạn kích thước. */
    public static final String BODY_TOO_LARGE = "BODY_TOO_LARGE";

    /** Giá trị sai kiểu hoặc sai định dạng (ví dụ "1.5" cho số nguyên, D17). */
    public static final String MALFORMED = "MALFORMED";

    /** Trường bắt buộc nhưng trống. */
    public static final String REQUIRED = "REQUIRED";

    /** Giá trị ngoài khoảng cho phép. */
    public static final String OUT_OF_RANGE = "OUT_OF_RANGE";

    /** Số lớn hơn mức tối đa. */
    public static final String TOO_LARGE = "TOO_LARGE";

    /** Chuỗi hoặc khoảng dài hơn mức tối đa. */
    public static final String TOO_LONG = "TOO_LONG";

    /** Danh sách có nhiều phần tử hơn mức tối đa. */
    public static final String TOO_MANY = "TOO_MANY";

    /** Số âm ở nơi chỉ nhận số không âm. */
    public static final String NEGATIVE = "NEGATIVE";

    private ErrorCodes() {
    }
}
