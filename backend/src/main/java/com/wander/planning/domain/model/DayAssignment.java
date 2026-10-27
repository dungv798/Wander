package com.wander.planning.domain.model;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Một phần tử của lệnh gán ngày hàng loạt: đưa mục {@code itemId} về ngày {@code day} (null = "Chưa có ngày"), tại vị trí
 * {@code position} trong ngày đó (null = cuối ngày). Gửi lại trạng thái cũ của các mục theo thứ tự tăng dần vị trí là cách
 * Hoàn tác một lệnh gán.
 */
public record DayAssignment(UUID itemId, LocalDate day, Integer position) {
}
