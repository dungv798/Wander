package com.wander.planning.domain.model;

import com.wander.planning.domain.rule.ItemText;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import java.time.LocalTime;

/**
 * Các trường người dùng sửa được của một mục (đã qua kiểm tra định dạng). {@code booking} có thể null: với loại có đặt chỗ,
 * null nghĩa là "Chờ xác nhận" (mặc định); với Nghỉ/Việc cần làm, bắt buộc null. {@code placeId} là mã địa điểm trong kho
 * mà mục liên kết tới (null = mục tự do); luôn được chuẩn hóa và kiểm dạng ngay khi dựng.
 */
public record ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost,
                          BookingStatus booking, String placeId) {

    public ItemDetails {
        placeId = ItemText.placeId(placeId);
    }

    /** Không nêu liên kết kho (mục tự do). */
    public ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost,
                       BookingStatus booking) {
        this(type, title, timeOfDay, durationMin, note, cost, booking, null);
    }

    /** Không nêu trạng thái đặt chỗ (mặc định theo loại mục) và không liên kết kho. */
    public ItemDetails(ItemType type, String title, LocalTime timeOfDay, Integer durationMin, String note, ItemCost cost) {
        this(type, title, timeOfDay, durationMin, note, cost, null, null);
    }
}
