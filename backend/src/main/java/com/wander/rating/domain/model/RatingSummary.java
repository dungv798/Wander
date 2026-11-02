package com.wander.rating.domain.model;

/** Điểm tổng hợp của một quán: trung bình (null khi chưa có lượt) và số lượt. */
public record RatingSummary(Double average, long count) {
}
