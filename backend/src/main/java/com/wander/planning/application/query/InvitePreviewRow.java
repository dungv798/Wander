package com.wander.planning.application.query;

/** Xem trước một liên kết mời còn dùng được: chỉ tên chuyến và số thành viên (chấp nhận có chủ đích, T13). */
public record InvitePreviewRow(String tripName, long memberCount) {
}
