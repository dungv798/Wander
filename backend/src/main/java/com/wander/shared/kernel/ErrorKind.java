package com.wander.shared.kernel;

/**
 * Loại lỗi theo ngữ nghĩa nghiệp vụ. Tầng web (shared.web) ánh xạ sang mã HTTP;
 * domain và application không biết gì về HTTP.
 */
public enum ErrorKind {
    INVALID,
    NOT_FOUND,
    CONFLICT,
    FORBIDDEN,
    UNAUTHENTICATED,
    RATE_LIMITED,
    PAYLOAD_TOO_LARGE,
    METHOD_NOT_ALLOWED
}
