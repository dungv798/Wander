package com.wander.catalog.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** Phân biệt địa chỉ dịch vụ thật với ý tưởng món; quán cà phê không mặc định là một bữa ăn. */
public enum VenueKind implements CodedValue {
    RESTAURANT("restaurant", "Quán ăn", PlaceCategory.AM),
    CAFE("cafe", "Quán cà phê", PlaceCategory.AM),
    BAR("bar", "Quán bar", PlaceCategory.AM),
    LODGING("lodging", "Chỗ ở", PlaceCategory.LUU);

    private final String code;
    private final String label;
    private final PlaceCategory category;

    VenueKind(String code, String label, PlaceCategory category) {
        this.code = code;
        this.label = label;
        this.category = category;
    }

    @Override
    public String code() { return code; }

    /** Nhãn loại hình để hiển thị trên thẻ chi tiết. */
    public String label() { return label; }

    /** Nhóm khám phá tương ứng, không tạo thêm loại địa điểm hoặc module. */
    public PlaceCategory category() { return category; }

    /** Mã dịch vụ lạ không được tự đổi thành quán ăn. */
    public static Optional<VenueKind> fromCode(String code) { return CodedValue.find(VenueKind.class, code); }
}
