package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Sở thích của chuyến (DR-018 F2, ADR-014): chọn nhiều, chỉ là nhãn. Planning không được import catalog nên tự định nghĩa tập này,
 * khớp với loại địa điểm của kho biên tập (cùng mã, nhãn, thứ tự); {@code VocabularyParityTest} canh cho hai tập không lệch.
 */
public enum TripInterest implements CodedValue {
    CANH("canh", "Cảnh quan"),
    VAN("van", "Văn hóa"),
    AM("am", "Ẩm thực"),
    LEO("leo", "Leo núi"),
    LUU("luu", "Lưu trú"),
    CHO("cho", "Chợ");

    private final String code;
    private final String label;

    TripInterest(String code, String label) {
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

    /** Sở thích theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<TripInterest> fromCode(String code) {
        return CodedValue.find(TripInterest.class, code);
    }
}
