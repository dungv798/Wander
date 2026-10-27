package com.wander.shared.web.constant;

/**
 * Hằng số HTTP dùng chung (tầng HỆ THỐNG, tầng web): tên header, giá trị header bảo mật và cache, tiền tố đường dẫn.
 */
public final class HttpConstants {

    /** Tiền tố đường dẫn của API (có dấu gạch chéo đầu). */
    public static final String API_PATH_PREFIX = "/api/";

    /** Tiền tố đường dẫn của actuator (có dấu gạch chéo đầu). */
    public static final String ACTUATOR_PATH_PREFIX = "/actuator/";

    /** Tiền tố đường dẫn tệp giao diện có băm (có dấu gạch chéo đầu). */
    public static final String ASSETS_PATH_PREFIX = "/assets/";

    /** Tiền tố tài nguyên API khi đã bỏ dấu gạch chéo đầu (dùng trong bộ phân giải tài nguyên). */
    public static final String API_RESOURCE_PREFIX = "api/";

    /** Tiền tố tài nguyên actuator khi đã bỏ dấu gạch chéo đầu. */
    public static final String ACTUATOR_RESOURCE_PREFIX = "actuator/";

    /** Header chuỗi địa chỉ qua các proxy. */
    public static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";

    /** Header chặn trình duyệt đoán kiểu nội dung. */
    public static final String HEADER_X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";

    /** Giá trị của {@link #HEADER_X_CONTENT_TYPE_OPTIONS}. */
    public static final String VALUE_NOSNIFF = "nosniff";

    /** Header HSTS. */
    public static final String HEADER_STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security";

    /** Thời hạn HSTS: 365 ngày tính bằng giây. */
    public static final long HSTS_MAX_AGE_SECONDS = 31_536_000L;

    /** Giá trị header HSTS (không includeSubDomains/preload để không ràng buộc tên miền khác). */
    public static final String VALUE_HSTS = "max-age=" + HSTS_MAX_AGE_SECONDS;

    /** Header điều khiển cache. */
    public static final String HEADER_CACHE_CONTROL = "Cache-Control";

    /** API không được cache. */
    public static final String VALUE_CACHE_NO_STORE = "no-store";

    /** Giao diện thường phải xác nhận lại với máy chủ. */
    public static final String VALUE_CACHE_NO_CACHE = "no-cache";

    /** Tệp có băm trong tên được cache một năm, không đổi. */
    public static final String VALUE_CACHE_IMMUTABLE_ASSET = "public, max-age=" + HSTS_MAX_AGE_SECONDS + ", immutable";

    /** Header chống nhúng khung. */
    public static final String HEADER_X_FRAME_OPTIONS = "X-Frame-Options";

    /** Giá trị của {@link #HEADER_X_FRAME_OPTIONS}. */
    public static final String VALUE_DENY = "DENY";

    /** Header chính sách referrer. */
    public static final String HEADER_REFERRER_POLICY = "Referrer-Policy";

    /** Không gửi referrer. */
    public static final String VALUE_NO_REFERRER = "no-referrer";

    /** Header chính sách nội dung. */
    public static final String HEADER_CONTENT_SECURITY_POLICY = "Content-Security-Policy";

    /** CSP chặt: không script ngoài, không nhúng khung, chỉ cùng nguồn gốc. */
    public static final String VALUE_CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + "img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    private HttpConstants() {
    }
}
