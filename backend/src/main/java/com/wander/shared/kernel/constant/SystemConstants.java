package com.wander.shared.kernel.constant;

/**
 * Hằng số tầng HỆ THỐNG: giá trị định hình hành vi của cả ứng dụng (giới hạn đầu vào, mặc định chung).
 * Giá trị nền nằm ở {@link CommonConstants}; giá trị riêng của một chức năng nằm ở tệp {@code *Constants} của chức năng đó.
 */
public final class SystemConstants {

    /** Kích thước tối đa của thân yêu cầu JSON, tính bằng byte (64 KB). */
    public static final int MAX_REQUEST_BODY_BYTES = 64 * CommonConstants.BYTES_PER_KILOBYTE;

    private SystemConstants() {
    }
}
