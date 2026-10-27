package com.wander.catalog.domain.constant;

/**
 * Hằng số của module catalog (tầng CHỨC NĂNG): giới hạn nội dung biên tập, định dạng, đường dẫn ảnh, hệ số ước tính.
 * Lời báo lỗi nằm ở {@link CatalogMessages}.
 */
public final class CatalogConstants {

    /** Mã dạng slug: chữ thường, số, nối nhau bằng gạch ngang. */
    public static final String SLUG_REGEX = "[a-z0-9]+(-[a-z0-9]+)*";

    /** Độ dài tối đa của mã địa điểm. */
    public static final int PLACE_ID_MAX_LENGTH = 60;

    /** Độ dài tối đa của tên địa điểm. */
    public static final int NAME_MAX_LENGTH = 120;

    /** Độ dài tối đa của tên khu vực. */
    public static final int AREA_MAX_LENGTH = 80;

    /** Độ dài tối đa của câu điểm nhấn. */
    public static final int HOOK_MAX_LENGTH = 240;

    /** Độ dài tối đa của nhãn mùa. */
    public static final int BEST_LABEL_MAX_LENGTH = 60;

    /** Độ dài tối đa của thời lượng ghé thăm. */
    public static final int DURATION_MAX_LENGTH = 40;

    /** Độ dài tối đa của nhãn độ khó. */
    public static final int DIFFICULTY_MAX_LENGTH = 20;

    /** Độ dài tối đa của lý do (nhãn gợi ý, buổi nên đi). */
    public static final int REASON_MAX_LENGTH = 240;

    /** Số ảnh tối đa của một địa điểm. */
    public static final int MAX_PHOTOS_PER_PLACE = 8;

    /** Tháng nhỏ nhất. */
    public static final int MONTH_MIN = 1;

    /** Tháng lớn nhất. */
    public static final int MONTH_MAX = 12;

    /** Vĩ độ lớn nhất theo giá trị tuyệt đối. */
    public static final double LATITUDE_LIMIT = 90;

    /** Kinh độ lớn nhất theo giá trị tuyệt đối. */
    public static final double LONGITUDE_LIMIT = 180;

    /** Tên tệp ảnh hợp lệ: chữ thường, số, gạch ngang và đuôi ảnh phổ biến. */
    public static final String PHOTO_FILE_REGEX = "[a-z0-9][a-z0-9-]*\\.(jpg|jpeg|png|webp)";

    /** Liên kết nguồn ảnh phải bắt đầu bằng tiền tố này. */
    public static final String HTTPS_PREFIX = "https://";

    /** Đường dẫn công khai của ảnh (ADR-010 mục 6). */
    public static final String PHOTO_URL_PREFIX = "/catalog/photos/";

    /** Thư mục ảnh trong classpath. */
    public static final String PHOTO_CLASSPATH_DIR = "catalog/photos/";

    /** Vị trí tệp điểm đến trong classpath và mặc định của cấu hình {@code wander.catalog.location}. */
    public static final String LOCATION_EXPRESSION = "${wander.catalog.location:classpath*:catalog/*.json}";

    /** Số địa điểm xem trước tối đa trên thẻ điểm đến. */
    public static final int PREVIEW_PLACE_COUNT = 3;

    /** Độ dài tối đa của chuỗi tìm kiếm điểm đến; phần dư bị cắt. */
    public static final int SEARCH_QUERY_MAX_LENGTH = 80;

    /** Mẫu Unicode của dấu kết hợp, bỏ đi khi chuẩn hóa chuỗi tìm kiếm. */
    public static final String COMBINING_MARKS_REGEX = "\\p{M}+";

    /** Hệ số đường đi thực tế so với đường chim bay (đường núi quanh co); giả định chưa kiểm chứng. */
    public static final double ROAD_FACTOR = 1.5;

    /** Tốc độ xe máy giả định, km/h; giả định chưa kiểm chứng. */
    public static final double SPEED_KMH = 25;

    /** Bán kính Trái Đất, km, cho công thức haversine. */
    public static final double EARTH_RADIUS_KM = 6371.0;

    /** Số phút trong một giờ. */
    public static final int MINUTES_PER_HOUR = 60;

    private CatalogConstants() {
    }
}
