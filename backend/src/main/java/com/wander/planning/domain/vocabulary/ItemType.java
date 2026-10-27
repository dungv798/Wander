package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** 9 loại mục ở plan §7.2 (D13), kèm nhãn tiếng Việt. Thứ tự khai báo là thứ tự hiển thị tổng theo loại. */
public enum ItemType implements CodedValue {
    SIGHTSEEING("sightseeing", "Tham quan"),
    FOOD("food", "Ăn uống"),
    TRANSPORT("transport", "Di chuyển"),
    LODGING("lodging", "Lưu trú"),
    CAR_RENTAL("car_rental", "Thuê xe"),
    SHOPPING("shopping", "Mua sắm"),
    TOUR("tour", "Tour/Combo"),
    REST("rest", "Nghỉ"),
    TASK("task", "Việc cần làm");

    private final String code;
    private final String label;

    ItemType(String code, String label) {
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

    /** Nghỉ và Việc cần làm không có giá cụ thể: không tính là "chưa rõ giá" khi so với ngân sách (Q11). */
    public boolean isPriced() {
        return this != REST && this != TASK;
    }

    /** Nghỉ và Việc cần làm không có đặt chỗ (A-14); các loại còn lại có. */
    public boolean supportsBooking() {
        return this != REST && this != TASK;
    }

    /** Loại mục theo mã trong dữ liệu và API; mã lạ trả rỗng. */
    public static Optional<ItemType> fromCode(String code) {
        return CodedValue.find(ItemType.class, code);
    }
}
