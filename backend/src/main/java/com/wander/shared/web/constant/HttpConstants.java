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

    /** Default {@code img-src} directive: this origin, inline data/blob images and Unsplash. */
    public static final String CSP_IMG_SRC_DEFAULT = "img-src 'self' data: blob: https://images.unsplash.com";

    /** Separator between CSP source expressions. */
    public static final String CSP_SOURCE_SEPARATOR = " ";

    /** Media type of error bodies: RFC 9457 problem details, explicitly UTF-8 (Safari otherwise reads error bodies as Latin-1). */
    public static final MediaType PROBLEM_JSON_UTF8 = new MediaType(MediaType.APPLICATION_PROBLEM_JSON, StandardCharsets.UTF_8);

    /** Prefix of the problem {@code type} URN; the lower-cased error code is appended. */
    public static final String PROBLEM_TYPE_PREFIX = "urn:wander:problem:";

    /** Problem extension member: stable machine-readable error code. */
    public static final String PROBLEM_PROPERTY_CODE = "code";

    /** Problem extension member: name of the invalid input field. */
    public static final String PROBLEM_PROPERTY_FIELD = "field";

    /** Problem extension member: structured details. */
    public static final String PROBLEM_PROPERTY_DETAILS = "details";

    /** Underscore, replaced by a hyphen in problem type URNs. */
    public static final char UNDERSCORE = '_';

    /** Hyphen used in problem type URNs. */
    public static final char HYPHEN = '-';

    /** Path prefixes of the API documentation (Swagger UI and the OpenAPI document), served outside the free profile. */
    public static final String[] DOCS_PATH_PREFIXES = {"/swagger-ui", "/v3/api-docs"};

    /**
     * CSP for the API documentation pages only: the same strict policy except that Swagger UI's own inline styles are allowed and
     * it may not load anything but images from this origin or data URIs. Never applied to the application itself.
     */
    public static final String VALUE_CONTENT_SECURITY_POLICY_DOCS = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            + "img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'";

    /** Separator between a URL scheme and the authority. */
    public static final String SCHEME_SEPARATOR = "://";

    /** Separator between a host and its port. */
    public static final String PORT_SEPARATOR = ":";

    /** The https URL scheme. */
    public static final String SCHEME_HTTPS = "https";

    /** Property with the optional external origin of the catalog photos; same property the catalog module reads. */
    public static final String PHOTO_BASE_URL_EXPRESSION = "${wander.catalog.photo-base-url:}";

    /**
     * CSP chặt: không script ngoài, không nhúng khung, chỉ cùng nguồn gốc, TRỪ hai máy chủ bản đồ đã duyệt ở ADR-015
     * (kiểu, ô vector, phông và biểu tượng ở tiles.openfreemap.org; ô độ cao ở s3.amazonaws.com) và worker/ảnh {@code blob:}
     * mà MapLibre GL tạo ra, cùng ảnh Unsplash tải thẳng từ images.unsplash.com (DR-034: điều khoản Unsplash bắt buộc hotlink). Không dùng ký tự đại diện.
     */
    public static final String VALUE_CONTENT_SECURITY_POLICY = "default-src 'self'; script-src 'self'; style-src 'self'; "
            + CSP_IMG_SRC_DEFAULT + "; connect-src 'self' https://tiles.openfreemap.org https://s3.amazonaws.com; "
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
