package com.wander.planning.domain.vocabulary;

import com.wander.shared.kernel.util.CodedValue;
import java.util.Optional;

/** The 9 item types of plan section 7.2 (D13), with Vietnamese labels. The declaration order is the display order of the totals by type. */
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

    /** The Vietnamese label shown to the user. */
    public String label() {
        return label;
    }

    /** Rest and To-do have no concrete price: they do not count as 'unknown price' when compared with the budget (Q11). */
    public boolean isPriced() {
        return this != REST && this != TASK;
    }

    /** Rest and To-do have no booking (A-14); the other types do. */
    public boolean supportsBooking() {
        return this != REST && this != TASK;
    }

    /** The item type by code in data and API; an unknown code returns empty. */
    public static Optional<ItemType> fromCode(String code) {
        return CodedValue.find(ItemType.class, code);
    }
}
