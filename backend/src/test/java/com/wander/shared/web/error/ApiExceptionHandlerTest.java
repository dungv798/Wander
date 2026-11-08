package com.wander.shared.web.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.shared.kernel.constant.ErrorCodes;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;

/** Kiểm tra ánh xạ lỗi ràng buộc duy nhất sang 409, không cần Spring. */
class ApiExceptionHandlerTest {

    /** Hai yêu cầu cùng ghi một khóa duy nhất phải ra 409 có mã chuẩn, không phải 500 và không lộ tên ràng buộc. */
    @Test
    @DisplayName("vi phạm ràng buộc dữ liệu trả 409 CONCURRENT_MODIFICATION, no-store, không lộ chi tiết")
    void integrityViolationIsConflict() {
        var response = new ApiExceptionHandler().handleIntegrityViolation(
                new DataIntegrityViolationException("duplicate key value violates unique constraint \"uq_trip_members_name\""));
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().toString()).contains(ErrorCodes.CONCURRENT_MODIFICATION).doesNotContain("uq_trip_members_name");
    }
}
