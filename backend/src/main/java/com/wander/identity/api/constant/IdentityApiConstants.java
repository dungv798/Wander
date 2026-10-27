package com.wander.identity.api.constant;

/** Hằng số của API và khung xác thực Identity (tầng CHỨC NĂNG): đường dẫn, khóa JSON, chuẩn Authorization. */
public final class IdentityApiConstants {

    /** Đường dẫn gốc của mọi API. */
    public static final String BASE_PATH = "/api";

    /** Mẫu khớp mọi API. */
    public static final String ALL_API_PATTERN = BASE_PATH + "/**";

    /** Tạo danh tính. */
    public static final String IDENTITY_PATH = "/identity";

    /** Bắt đầu khôi phục bằng mã. */
    public static final String RECOVERY_START_PATH = "/recovery/start";

    /** Hoàn tất khôi phục bằng mã. */
    public static final String RECOVERY_COMPLETE_PATH = "/recovery/complete";

    /** Yêu cầu ghép thiết bị. */
    public static final String DEVICE_LINKS_PATH = "/device-links";

    /** Trạng thái một yêu cầu ghép thiết bị. */
    public static final String DEVICE_LINK_BY_ID_PATH = DEVICE_LINKS_PATH + "/{id}";

    /** Duyệt ghép thiết bị. */
    public static final String DEVICE_LINK_APPROVE_PATH = DEVICE_LINKS_PATH + "/approve";

    /** Danh sách phiên. */
    public static final String SESSIONS_PATH = "/sessions";

    /** Một phiên theo mã. */
    public static final String SESSION_BY_ID_PATH = SESSIONS_PATH + "/{id}";

    /** Trạng thái mã khôi phục. */
    public static final String RECOVERY_CODE_PATH = "/recovery-code";

    /** Pha 1 tạo mã thay thế. */
    public static final String RECOVERY_CODE_BEGIN_PATH = RECOVERY_CODE_PATH + "/begin";

    /** Pha 2 xác nhận mã thay thế. */
    public static final String RECOVERY_CODE_CONFIRM_PATH = RECOVERY_CODE_PATH + "/confirm";

    /** Xin phê duyệt xác thực lại. */
    public static final String STEP_UP_REQUESTS_PATH = "/step-up/requests";

    /** Duyệt phê duyệt xác thực lại. */
    public static final String STEP_UP_APPROVE_PATH = "/step-up/approve";

    /** Mẫu đường dẫn công khai: tạo danh tính. */
    public static final String PUBLIC_IDENTITY_PATTERN = BASE_PATH + IDENTITY_PATH;

    /** Mẫu đường dẫn công khai: bắt đầu khôi phục. */
    public static final String PUBLIC_RECOVERY_START_PATTERN = BASE_PATH + RECOVERY_START_PATH;

    /** Mẫu đường dẫn công khai: hoàn tất khôi phục. */
    public static final String PUBLIC_RECOVERY_COMPLETE_PATTERN = BASE_PATH + RECOVERY_COMPLETE_PATH;

    /** Mẫu đường dẫn công khai: tạo yêu cầu ghép thiết bị. */
    public static final String PUBLIC_DEVICE_LINKS_PATTERN = BASE_PATH + DEVICE_LINKS_PATH;

    /** Mẫu đường dẫn công khai: xem trạng thái yêu cầu ghép thiết bị. */
    public static final String PUBLIC_DEVICE_LINK_STATUS_PATTERN = BASE_PATH + DEVICE_LINKS_PATH + "/*";

    /**
     * Mẫu đường dẫn công khai: đọc kho địa điểm (DR-008 Q-a), có giới hạn tốc độ theo địa chỉ ở controller catalog.
     * Giá trị phải khớp đường dẫn gốc của module catalog; identity không import catalog nên lặp lại ở đây (SecurityIT kiểm kê).
     */
    public static final String PUBLIC_CATALOG_PATTERN = BASE_PATH + "/catalog/**";

    /** Khóa JSON của danh sách phiên. */
    public static final String KEY_SESSIONS = "sessions";

    /** Header chứa bí mật phiên. */
    public static final String HEADER_AUTHORIZATION = "Authorization";

    /** Header báo kiểu xác thực khi trả 401. */
    public static final String HEADER_WWW_AUTHENTICATE = "WWW-Authenticate";

    /** Kiểu xác thực Bearer. */
    public static final String SCHEME_BEARER = "Bearer";

    /** Dạng header Authorization hợp lệ; nhóm 1 là bí mật phiên. */
    public static final String BEARER_HEADER_REGEX = "^Bearer ([A-Za-z0-9_-]{20,128})$";

    /** Lời báo nội bộ: header Authorization sai dạng. */
    public static final String AUTHORIZATION_FORMAT_INVALID = "Định dạng Authorization không hợp lệ.";

    /** Lời báo nội bộ: bí mật phiên không khớp phiên nào còn hiệu lực. */
    public static final String SESSION_INVALID = "Phiên không hợp lệ.";

    private IdentityApiConstants() {
    }
}
