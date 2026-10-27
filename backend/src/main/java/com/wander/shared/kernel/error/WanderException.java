package com.wander.shared.kernel.error;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
/**
 * Lỗi có mã ổn định mà giao diện dựa vào (ví dụ NEGATIVE, DATES_ORPHAN_ITEMS).
 * Mã và trường giữ nguyên như hợp đồng API cũ để web không phải đổi.
 */
public class WanderException extends RuntimeException {

    private final ErrorKind kind;
    private final String code;
    private final String field;
    private final transient Object details;

    /** Tạo lỗi đầy đủ: loại, mã, lời báo, trường sai (nếu có) và chi tiết kèm theo (nếu có). */
    public WanderException(ErrorKind kind, String code, String message, String field, Object details) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.field = field;
        this.details = details;
    }

    /** Lỗi dữ liệu gửi lên không hợp lệ ở một trường. */
    public static WanderException invalid(String code, String message, String field) {
        return new WanderException(ErrorKind.INVALID, code, message, field, null);
    }

    /** Lỗi giá trị không hợp lệ ở một trường, dùng lời báo chung. */
    public static WanderException invalidValue(String code, String field) {
        return invalid(code, ErrorMessages.VALUE_INVALID, field);
    }

    /** Không tìm thấy tài nguyên, dùng lời báo chung. */
    public static WanderException notFound() {
        return notFound(ErrorMessages.NOT_FOUND);
    }

    /** Không tìm thấy tài nguyên, kèm lời báo riêng. */
    public static WanderException notFound(String message) {
        return new WanderException(ErrorKind.NOT_FOUND, ErrorCodes.NOT_FOUND, message, null, null);
    }

    /** Xung đột trạng thái, không kèm chi tiết. */
    public static WanderException conflict(String code, String message) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, null);
    }

    /** Xung đột trạng thái, kèm chi tiết cho client (ví dụ danh sách mục vướng). */
    public static WanderException conflict(String code, String message, Object details) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, details);
    }

    /** Không đủ quyền thực hiện thao tác. */
    public static WanderException forbidden(String code, String message) {
        return new WanderException(ErrorKind.FORBIDDEN, code, message, null, null);
    }

    /** Loại lỗi; tầng web đổi sang mã HTTP. */
    public ErrorKind kind() {
        return kind;
    }

    /** Mã lỗi ổn định cho giao diện. */
    public String code() {
        return code;
    }

    /** Tên trường sai, hoặc null nếu lỗi không gắn với trường nào. */
    public String field() {
        return field;
    }

    /** Chi tiết kèm theo, hoặc null. */
    public Object details() {
        return details;
    }
}
