package com.wander.planning.domain;

import java.util.Arrays;
import java.util.Optional;

/** 9 loại mục ở plan §7.2 (D13), kèm nhãn tiếng Việt. Thứ tự khai báo là thứ tự hiển thị tổng theo loại. */
public enum ItemType {
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

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static Optional<ItemType> fromCode(String code) {
        return Arrays.stream(values()).filter(t -> t.code.equals(code)).findFirst();
    }
}
