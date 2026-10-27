package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/**
 * Kiểu chuyến (Q11, DR-002): nhãn hiển thị, chọn nhiều. Tập đóng do implementation chọn (Tầng B, đổi được).
 * Thứ tự khai báo là thứ tự lưu và hiển thị; KHÔNG có hành vi gợi ý nào dùng chúng (plan §7.2).
 * <p>
 * Thêm giá trị mới an toàn. Đổi mã hoặc bỏ một giá trị phải kèm migration dữ liệu cho cột {@code trips.styles}: đường đọc dung
 * thứ mã lạ (hiện nguyên mã) nhưng đường ghi ({@code TripMapper}) coi mã lạ là lỗi dữ liệu.
 */
public enum TripStyle implements CodedValue {
    RELAX("relax", "Nghỉ dưỡng"),
    EXPLORE("explore", "Khám phá"),
    FOOD("food", "Ẩm thực"),
    BEACH("beach", "Biển"),
    MOUNTAIN("mountain", "Núi"),
    CITY("city", "Thành phố"),
    FAMILY("family", "Gia đình"),
    FRIENDS("friends", "Bạn bè");

    private final String code;
    private final String label;

    TripStyle(String code, String label) {
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

    /** Kiểu theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<TripStyle> fromCode(String code) {
        return CodedValue.find(TripStyle.class, code);
    }
}
