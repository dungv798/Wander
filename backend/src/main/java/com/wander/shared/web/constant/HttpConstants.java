package com.wander.shared.web.constant;

import java.nio.charset.StandardCharsets;
import org.springframework.http.MediaType;

/**
 * Hằng số HTTP dùng chung (tầng HỆ THỐNG, tầng web): tên header, giá trị header bảo mật và cache, tiền tố đường dẫn.
 */
public final class HttpConstants {

    /** Mã đầu tiên của nhóm lỗi phía client; mọi lỗi không được cache như asset immutable. */
    public static final int CLIENT_ERROR_STATUS_MIN = 400;

    /** Mẫu đường dẫn cho interceptor API. */
    public static final String ALL_API_PATHS = "/api/**";

    /**
     * Đường dẫn không tính vào ngân sách ghi theo danh tính vì đã có bộ đếm "duyệt" riêng theo từng phiên (20/giờ):
     * ghép thiết bị, mã khôi phục, xác thực lại. Nhờ vậy kẻ giữ một phiên không làm cạn quyền duyệt/từ chối của chủ.
     */
    public static final String[] WRITE_BUDGET_EXEMPT_PATHS = {"/api/device-links/**", "/api/recovery-code/**", "/api/step-up/**"};

    /** Tiền tố đường dẫn các phiên (thu hồi phiên là DELETE dưới tiền tố này). */
    public static final String SESSIONS_PATH_PREFIX = "/api/sessions/";

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

    /**
     * CSP chặt: không script ngoài, không nhúng khung, chỉ cùng nguồn gốc, TRỪ hai máy chủ bản đồ đã duyệt ở ADR-015
     * (kiểu, ô vector, phông và biểu tượng ở tiles.openfreemap.org; ô độ cao ở s3.amazonaws.com) và worker/ảnh {@code blob:}
     * mà MapLibre GL tạo ra, cùng ảnh Unsplash tải thẳng từ images.unsplash.com (DR-034: điều khoản Unsplash bắt buộc hotlink). Không dùng ký tự đại diện.
     */
    public static final String VALUE_CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + "img-src 'self' data: blob: https://images.unsplash.com; connect-src 'self' https://tiles.openfreemap.org https://s3.amazonaws.com; "
            + "worker-src 'self' blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    /**
     * Kiểu nội dung của thân lỗi JSON, nêu rõ UTF-8: Spring bỏ `charset` khỏi `application/json`, nên Safari mở thẳng URL lỗi
     * hiểu thân là Latin-1 và làm vỡ tiếng Việt (ứng dụng đọc bằng `fetch().json()` luôn là UTF-8 nên không bị).
     */
    public static final MediaType JSON_UTF8 = new MediaType(MediaType.APPLICATION_JSON, StandardCharsets.UTF_8);

    /** Đuôi tệp manifest ứng dụng web (không có dấu chấm). */
    public static final String WEB_MANIFEST_EXTENSION = "webmanifest";

    /** Kiểu nội dung của manifest ứng dụng web; iOS Safari cần đúng kiểu này để dùng manifest (chạy toàn màn hình khi Thêm vào Màn hình chính). */
    public static final String WEB_MANIFEST_MEDIA_TYPE = "application/manifest+json";

    private HttpConstants() {
    }
}
