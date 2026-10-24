package com.wander.shared.web;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Thân lỗi chuẩn của API: {@code {"error": {"code", "message", "field"?, "details"?}}}. */
public record ApiError(Body error) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Body(String code, String message, String field, Object details) {
    }

    public static ApiError of(String code, String message, String field, Object details) {
        return new ApiError(new Body(code, message, field, details));
    }
}
