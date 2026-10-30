package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;

/** Kiểm tra bất biến mới bằng lỗi miền, không phụ thuộc HTTP. */
public final class PoiValidation {
    private PoiValidation() {
    }

    /** Từ chối bất biến sai, giữ mã và trường để adapter hoặc API xử lý. */
    public static void require(boolean valid, String field) {
        if (!valid) throw WanderException.invalid(ErrorCodes.OUT_OF_RANGE, PoiConstants.INVALID_RECORD, field);
    }

    /** Kiểm tra namespace và số OSM, phân biệt node/way/relation có cùng số. */
    public static void requireOsmIdentity(String type, long id) {
        require(type != null && type.matches(PoiConstants.OSM_TYPE_PATTERN), PoiConstants.OSM_TYPE);
        require(id > 0, PoiConstants.OSM_ID);
    }

    /** Kiểm tra chuỗi bắt buộc, không sửa chuỗi raw. */
    public static void requireText(String value, String field) {
        require(value != null && !value.isBlank(), field);
    }
}
