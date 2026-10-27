package com.wander.shared.web.error;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Thân lỗi chuẩn của API: {@code {"error": {"code", "message", "field"?, "details"?}}}. */
public record ApiError(Body error) {

    /** Nội dung lỗi; trường null (field, details) không xuất hiện trong JSON. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Body(String code, String message, String field, Object details) {
    }

    /** Dựng thân lỗi chuẩn từ mã, lời báo, trường sai và chi tiết. */
    public static ApiError of(String code, String message, String field, Object details) {
        return new ApiError(new Body(code, message, field, details));
    }

    /** Dựng thân lỗi chuẩn chỉ có mã và lời báo (không trường, không chi tiết). */
    public static ApiError simple(String code, String message) {
        return of(code, message, null, null);
    }
}
