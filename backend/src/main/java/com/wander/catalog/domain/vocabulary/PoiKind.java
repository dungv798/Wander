package com.wander.catalog.domain.vocabulary;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import java.util.Arrays;

/** Loại dữ kiện POI; rest là nhu cầu tìm kiếm, không phải loại địa điểm. */
public enum PoiKind {
    FOOD("food"), CAFE("cafe"), FAST_FOOD("fast_food"), BAR("bar"), OTHER("other");

    private final String code;

    PoiKind(String code) {
        this.code = code;
    }

    /** Mã loại ổn định dùng trong JSON. */
    public String code() {
        return code;
    }

    /** Đọc loại dữ kiện; mã lạ không bị hạ thành other. */
    public static PoiKind fromCode(String code) {
        PoiValidation.require(Arrays.stream(values()).anyMatch(kind -> kind.code.equals(code)), PoiConstants.KIND);
        return Arrays.stream(values()).filter(kind -> kind.code.equals(code)).findFirst().orElseThrow();
    }

    /** Lọc nhu cầu: ăn chỉ food/fast_food, nghỉ chỉ cafe, all giữ mọi loại. */
    public boolean matches(String filter) {
        return switch (filter) {
            case PoiConstants.ALL -> true;
            case PoiConstants.FOOD -> this == FOOD || this == FAST_FOOD;
            case PoiConstants.CAFE, PoiConstants.REST -> this == CAFE;
            default -> false;
        };
    }
}
