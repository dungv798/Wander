package com.wander.shared.kernel;

/**
 * Lỗi có mã ổn định mà giao diện dựa vào (ví dụ NEGATIVE, DATES_ORPHAN_ITEMS).
 * Mã và trường giữ nguyên như hợp đồng API cũ để web không phải đổi.
 */
public class WanderException extends RuntimeException {

    private final ErrorKind kind;
    private final String code;
    private final String field;
    private final transient Object details;

    public WanderException(ErrorKind kind, String code, String message, String field, Object details) {
        super(message);
        this.kind = kind;
        this.code = code;
        this.field = field;
        this.details = details;
    }

    public static WanderException invalid(String code, String message, String field) {
        return new WanderException(ErrorKind.INVALID, code, message, field, null);
    }

    public static WanderException invalidValue(String code, String field) {
        return invalid(code, "Giá trị không hợp lệ.", field);
    }

    public static WanderException notFound() {
        return notFound("Không tìm thấy.");
    }

    public static WanderException notFound(String message) {
        return new WanderException(ErrorKind.NOT_FOUND, "NOT_FOUND", message, null, null);
    }

    public static WanderException conflict(String code, String message) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, null);
    }

    public static WanderException conflict(String code, String message, Object details) {
        return new WanderException(ErrorKind.CONFLICT, code, message, null, details);
    }

    public static WanderException forbidden(String code, String message) {
        return new WanderException(ErrorKind.FORBIDDEN, code, message, null, null);
    }

    public ErrorKind kind() {
        return kind;
    }

    public String code() {
        return code;
    }

    public String field() {
        return field;
    }

    public Object details() {
        return details;
    }
}
