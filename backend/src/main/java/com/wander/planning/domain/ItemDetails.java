package com.wander.planning.domain;

import java.time.LocalTime;

/** Các trường người dùng sửa được của một mục (đã qua kiểm tra định dạng). */
public record ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, CostInfo cost) {
}
