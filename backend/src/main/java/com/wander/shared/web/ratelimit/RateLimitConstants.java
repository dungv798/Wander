package com.wander.shared.web.ratelimit;

import java.time.Duration;

/** Hằng số riêng của chức năng giới hạn tần suất ({@link RateLimits}, {@link FixedWindowRateLimiter}). */
final class RateLimitConstants {

    /** Số lần tạo danh tính tối đa mỗi giờ cho một địa chỉ (mặc định, đổi qua cấu hình). */
    static final int DEFAULT_IDENTITY_PER_HOUR = 30;

    /** Số lần khôi phục/ghép thiết bị chưa xác thực tối đa mỗi giờ cho một địa chỉ. */
    static final int DEFAULT_RECOVERY_PER_HOUR = 30;

    /** Số lần duyệt/xác thực lại/tái tạo mã tối đa mỗi giờ cho một phiên. */
    static final int DEFAULT_APPROVAL_PER_HOUR = 20;

    /** Số lần đọc kho địa điểm công khai tối đa mỗi phút cho một địa chỉ (DR-008 Q-a; mặc định, đổi qua cấu hình). */
    static final int DEFAULT_CATALOG_PER_MINUTE = 120;

    /** Số yêu cầu duyệt (ghép thiết bị, xin xác thực lại) tối đa mỗi cửa sổ 10 phút (DR-018 E1). */
    static final int DEFAULT_APPROVAL_REQUESTS_PER_WINDOW = 3;

    /** Độ dài cửa sổ đếm yêu cầu duyệt. */
    static final Duration APPROVAL_REQUEST_WINDOW = Duration.ofMinutes(10);

    /** Độ dài cửa sổ đếm. */
    static final Duration WINDOW = Duration.ofHours(1);

    /** Độ dài cửa sổ đếm của kho địa điểm công khai. */
    static final Duration CATALOG_WINDOW = Duration.ofMinutes(1);

    /** Số khóa theo dõi tối đa trước khi dọn các cửa sổ đã hết hạn. */
    static final int MAX_TRACKED_KEYS = 10_000;

    private RateLimitConstants() {
    }
}
