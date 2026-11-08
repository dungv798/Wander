package com.wander.shared.web.error;

import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.constant.ErrorMessages;
import com.wander.shared.kernel.error.WanderException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/** Chuyển mọi lỗi thành thân lỗi chuẩn; lỗi không lường trước không lộ chi tiết ra ngoài. */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

    /** Lỗi nghiệp vụ có mã: đổi loại lỗi thành mã HTTP, giữ mã, trường và chi tiết cho giao diện. */
    @ExceptionHandler(WanderException.class)
    public ResponseEntity<ApiError> handleBusinessError(WanderException e) {
        return ResponseEntity.status(HttpStatuses.of(e.kind()))
                .cacheControl(CacheControl.noStore())
                .body(ApiError.of(e.code(), e.getMessage(), e.field(), e.details()));
    }

    /** Hai thao tác sửa cùng một dữ liệu cùng lúc: báo 409 để người dùng tải lại. */
    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ResponseEntity<ApiError> handleConcurrentModification(OptimisticLockingFailureException e) {
        return errorResponse(HttpStatus.CONFLICT, ErrorCodes.CONCURRENT_MODIFICATION, ErrorMessages.CONCURRENT_MODIFICATION);
    }

    /**
     * Hai yêu cầu cùng ghi một khóa duy nhất (ví dụ tên chuyến trùng, thử lại sau cold start): báo 409 thay vì 500; không lộ tên ràng buộc.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrityViolation(DataIntegrityViolationException e) {
        log.warn(ErrorMessages.INTEGRITY_VIOLATION_LOG, e.getMostSpecificCause().getClass().getSimpleName());
        return errorResponse(HttpStatus.CONFLICT, ErrorCodes.CONCURRENT_MODIFICATION, ErrorMessages.CONCURRENT_MODIFICATION);
    }

    /** Đường dẫn không có tài nguyên: báo 404 theo thân lỗi chuẩn. */
    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiError> handleNotFound(Exception e) {
        return errorResponse(HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND, ErrorMessages.NOT_FOUND);
    }

    /** Phương thức HTTP không được hỗ trợ: báo 405. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotAllowed(HttpRequestMethodNotSupportedException e) {
        return errorResponse(HttpStatus.METHOD_NOT_ALLOWED, ErrorCodes.METHOD_NOT_ALLOWED, ErrorMessages.METHOD_NOT_ALLOWED);
    }

    /** Lỗi không lường trước: ghi log đầy đủ, chỉ trả lời báo chung (500) để không lộ chi tiết. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpectedError(Exception e) {
        log.error(ErrorMessages.UNEXPECTED_ERROR_LOG, e);
        return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL, ErrorMessages.INTERNAL);
    }

    /** Dựng phản hồi lỗi chuẩn từ mã HTTP, mã lỗi và lời báo. */
    private static ResponseEntity<ApiError> errorResponse(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).cacheControl(CacheControl.noStore()).body(ApiError.simple(code, message));
    }
}
