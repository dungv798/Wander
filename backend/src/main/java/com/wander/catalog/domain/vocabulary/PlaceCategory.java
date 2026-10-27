package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Loại địa điểm. Mã ngắn ổn định (dùng trong dữ liệu và API), nhãn hiển thị tiếng Việt. Thêm giá trị mới an toàn. */
public enum PlaceCategory implements CodedValue {
    CANH("canh", "Cảnh quan"),
    VAN("van", "Văn hóa"),
    AM("am", "Ẩm thực"),
    LEO("leo", "Leo núi"),
    LUU("luu", "Lưu trú"),
    CHO("cho", "Chợ");

    private final String code;
    private final String label;

    PlaceCategory(String code, String label) {
        this.code = code;
        this.label = label;
    }

    @Override
    public String code() {
        return code;
    }

    /** Nhãn tiếng Việt hiển thị cho người dùng. */
    public String label() {
        return label;
    }

    /** Loại theo mã ngắn trong dữ liệu; mã lạ trả rỗng. */
    public static Optional<PlaceCategory> fromCode(String code) {
        return CodedValue.find(PlaceCategory.class, code);
    }
}
