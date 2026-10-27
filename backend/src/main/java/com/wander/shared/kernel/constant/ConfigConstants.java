package com.wander.shared.kernel.constant;

/**
 * Khóa cấu hình ứng dụng (tầng HỆ THỐNG). Biểu thức {@code ${...}} dùng với {@code @Value}; mặc định đi kèm sau dấu hai chấm
 * phải khớp {@code application.yml}. Một nơi duy nhất để đổi tên khóa.
 */
public final class ConfigConstants {

    /** Tiền tố cấu hình các giới hạn tần suất. */
    public static final String LIMITS_PREFIX = "wander.limits";

    /** Thư mục giao diện đã build; rỗng = chỉ chạy API. */
    public static final String WEB_DIR_EXPRESSION = "${wander.web.dir:}";

    /** Số proxy tin cậy trước ứng dụng; 0 = bỏ qua X-Forwarded-For. */
    public static final String TRUSTED_PROXY_HOPS_EXPRESSION = "${wander.web.trusted-proxy-hops:0}";

    private ConfigConstants() {
    }
}
