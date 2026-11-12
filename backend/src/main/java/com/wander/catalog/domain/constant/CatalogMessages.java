package com.wander.catalog.domain.constant;

/**
 * Lời báo lỗi dữ liệu biên tập của catalog (tiếng Việt cho người biên tập). Mẫu dùng {@code String.formatted(...)}:
 * {@code %s} là chuỗi, {@code %d} là số nguyên.
 */
public final class CatalogMessages {
    /** Liên kết tác giả khoảnh khắc phải dùng https trên máy chủ Unsplash. */
    public static final String MOMENT_AUTHOR_URL_INVALID = "Liên kết tác giả khoảnh khắc phải là địa chỉ https trên unsplash.com";
    /** Giới hạn chú thích ảnh; tham số: số ký tự tối đa. */
    public static final String PHOTO_CAPTION_TOO_LONG = "Chú thích ảnh không quá %d ký tự";
    /** Liên kết ghi công tác giả không phải URL https an toàn. */
    public static final String PHOTO_AUTHOR_URL_INVALID = "Liên kết tác giả phải là địa chỉ https hợp lệ";

    // ---- Điểm đến ----
    /** Điểm đến thiếu id, tên, vùng hoặc mô tả ngắn. */
    public static final String DESTINATION_FIELDS_MISSING = "Điểm đến thiếu id, tên, vùng hoặc mô tả ngắn";
    /** Điểm đến chưa có mốc tham chiếu; tham số: mã điểm đến. */
    public static final String DESTINATION_NEEDS_REFERENCE = "Điểm đến %s cần ít nhất một mốc tham chiếu";
    /** Điểm đến chưa có địa điểm; tham số: mã điểm đến. */
    public static final String DESTINATION_NEEDS_PLACE = "Điểm đến %s chưa có địa điểm nào";
    /** Địa điểm thuộc điểm đến khác; tham số: mã địa điểm. */
    public static final String PLACE_OF_OTHER_DESTINATION = "Địa điểm %s thuộc điểm đến khác";
    /** Mã địa điểm bị trùng; tham số: mã địa điểm. */
    public static final String PLACE_ID_DUPLICATED = "Trùng mã địa điểm: %s";
    /** Ảnh bìa trỏ tới địa điểm không có; tham số: mã địa điểm. */
    public static final String COVER_PLACE_MISSING = "Ảnh bìa trỏ tới địa điểm không có: %s";
    public static final String COVER_PLACE_NEEDS_PHOTO = "Địa điểm bìa %s phải có ít nhất một ảnh (trang chủ dùng làm bìa điểm đến)";
    /** Mã khối cẩm nang bị trùng; tham số: mã khối. */
    public static final String GUIDE_SECTION_ID_DUPLICATED = "Trùng mã khối cẩm nang: %s";
    /** Cẩm nang trỏ tới địa điểm không có; tham số: mã địa điểm. */
    public static final String GUIDE_LINKS_UNKNOWN_PLACE = "Cẩm nang trỏ tới địa điểm không có: %s";
    /** Trùng mã điểm đến trong kho; tham số: mã điểm đến. */
    public static final String DESTINATION_ID_DUPLICATED = "Trùng mã điểm đến trong kho: %s";

    // ---- Khối cẩm nang ----
    /** Khối cẩm nang thiếu id, tiêu đề hoặc tóm tắt. */
    public static final String GUIDE_SECTION_FIELDS_MISSING = "Khối cẩm nang thiếu id, tiêu đề hoặc tóm tắt";
    /** Khối cẩm nang thiếu kiểu hiển thị hoặc loại; tham số: mã khối. */
    public static final String GUIDE_SECTION_KIND_MISSING = "Khối cẩm nang %s thiếu kiểu hiển thị hoặc loại";
    /** Tháng ngoài 1..12 ở khối; tham số: mã khối. */
    public static final String MONTH_OUT_OF_RANGE_IN_SECTION = "Tháng ngoài 1..12 ở khối %s";
    /** Tháng vừa đẹp nhất vừa mưa nhiều; tham số: mã khối. */
    public static final String MONTH_BOTH_BEST_AND_RAINY = "Tháng vừa đẹp nhất vừa mưa nhiều ở khối %s";
    /** Dòng cẩm nang thiếu tiêu đề. */
    public static final String GUIDE_ITEM_TITLE_MISSING = "Dòng cẩm nang thiếu tiêu đề";

    // ---- Địa điểm ----
    /** Mã địa điểm không hợp lệ; tham số: mã. */
    public static final String PLACE_ID_INVALID = "Mã địa điểm không hợp lệ: %s";
    /** Mã điểm đến không hợp lệ; tham số: mã. */
    public static final String DESTINATION_ID_INVALID = "Mã điểm đến không hợp lệ: %s";
    /** Địa điểm thiếu loại hoặc nhãn gợi ý; tham số: mã địa điểm. */
    public static final String PLACE_KIND_MISSING = "Địa điểm %s thiếu loại hoặc nhãn gợi ý";
    /** Tháng ngoài 1..12 ở địa điểm; tham số: mã địa điểm. */
    public static final String MONTH_OUT_OF_RANGE_IN_PLACE = "Tháng ngoài 1..12 ở %s";
    /** Địa điểm chưa có ảnh; tham số: mã địa điểm. */
    /** Địa điểm có quá nhiều ảnh; tham số: mã địa điểm, số ảnh tối đa. */
    public static final String PLACE_TOO_MANY_PHOTOS = "Địa điểm %s có quá %d ảnh";
    /** Ảnh phải có đúng một nguồn. */
    public static final String PHOTO_NEEDS_ONE_SOURCE = "Ảnh phải có đúng một nguồn: tệp cục bộ hoặc URL ngoài";
    /** Máy chủ ảnh ngoài không được phép; tham số: URL. */
    public static final String PHOTO_EXTERNAL_HOST_NOT_ALLOWED = "Máy chủ ảnh ngoài không được phép: %s";
    /** Khoảnh khắc thiếu một trường; tham số: nhãn trường. */
    public static final String MOMENT_FIELD_MISSING = "Khoảnh khắc thiếu %s";
    /** Nhãn các trường của khoảnh khắc. */
    public static final String LABEL_MOMENT_ID = "mã";
    public static final String LABEL_MOMENT_THEME = "chủ đề";
    public static final String LABEL_MOMENT_CAPTION = "chú thích";
    public static final String LABEL_MOMENT_PHOTO = "ảnh";
    /** Mã khoảnh khắc trùng trong một điểm đến; tham số: mã khoảnh khắc. */
    public static final String MOMENT_ID_DUPLICATED = "Trùng mã khoảnh khắc %s";
    /** Điểm đến có quá nhiều khoảnh khắc; tham số: mã điểm đến, số tối đa. */
    public static final String DESTINATION_TOO_MANY_MOMENTS = "Điểm đến %s có quá %d khoảnh khắc";
    /** Chủ đề khoảnh khắc lạ; tham số: mã chủ đề. */
    public static final String MOMENT_THEME_INVALID = "Chủ đề khoảnh khắc không hợp lệ: %s";
    /** Thiếu tệp ảnh của khoảnh khắc; tham số: đường dẫn, mã khoảnh khắc. */
    public static final String MOMENT_PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của khoảnh khắc %s";
    /** Thiếu một trường văn bản; tham số: nhãn trường. */
    public static final String FIELD_REQUIRED = "Thiếu %s";
    /** Trường văn bản quá dài; tham số: nhãn trường, độ dài thực, độ dài tối đa. */
    public static final String FIELD_TOO_LONG = "Quá dài (%s): %d > %d";

    /** Nhãn trường: tên. */
    public static final String LABEL_NAME = "tên";
    /** Nhãn trường: khu vực. */
    public static final String LABEL_AREA = "khu vực";
    /** Nhãn trường: câu điểm nhấn. */
    public static final String LABEL_HOOK = "câu điểm nhấn";
    /** Nhãn trường: nhãn mùa. */
    public static final String LABEL_BEST_LABEL = "nhãn mùa";
    /** Nhãn trường: thời lượng. */
    public static final String LABEL_DURATION = "thời lượng";
    /** Nhãn trường: độ khó. */
    public static final String LABEL_DIFFICULTY = "độ khó";
    /** Nhãn trường: lý do nhãn gợi ý. */
    public static final String LABEL_VERDICT_REASON = "lý do nhãn gợi ý";
    /** Nhãn trường: lý do buổi nên đi. */
    public static final String LABEL_SLOT_REASON = "lý do buổi nên đi";

    // ---- Tọa độ, mốc, ảnh ----
    /** Tọa độ ngoài khoảng hợp lệ; tham số: vĩ độ, kinh độ. */
    public static final String COORDINATE_OUT_OF_RANGE = "Tọa độ ngoài khoảng hợp lệ: %s, %s";
    /** Mốc tham chiếu thiếu id, tên hoặc tọa độ. */
    public static final String REFERENCE_FIELDS_MISSING = "Mốc tham chiếu thiếu id, tên hoặc tọa độ";
    /** Mốc tham chiếu thiếu tọa độ trong tệp; tham số: mã mốc. */
    public static final String REFERENCE_COORDINATES_MISSING = "Mốc tham chiếu %s thiếu tọa độ";
    /** Ảnh thiếu một trường; tham số: nhãn trường. */
    public static final String PHOTO_FIELD_MISSING = "Ảnh thiếu %s";
    /** Ảnh thu nhỏ đi kèm ảnh ngoài. */
    public static final String PHOTO_THUMB_NEEDS_FILE = "Ảnh thu nhỏ chỉ đi kèm ảnh lưu cục bộ, không đi kèm ảnh ngoài";
    /** Tên tệp ảnh sai dạng; tham số: tên tệp. */
    public static final String PHOTO_FILE_NAME_INVALID = "Tên tệp ảnh chỉ gồm chữ thường, số, gạch ngang và đuôi jpg/jpeg/png/webp: %s";
    /** Liên kết nguồn ảnh không phải https; tham số: liên kết. */
    public static final String PHOTO_SOURCE_NOT_HTTPS = "Liên kết gốc của ảnh phải là https: %s";
    /** Nhãn trường ảnh: tệp. */
    public static final String LABEL_PHOTO_FILE = "file";
    /** Nhãn trường ảnh: tác giả. */
    public static final String LABEL_PHOTO_AUTHOR = "author";
    /** Nhãn trường ảnh: giấy phép. */
    public static final String LABEL_PHOTO_LICENSE = "license";
    /** Nhãn trường ảnh: liên kết gốc. */
    public static final String LABEL_PHOTO_SOURCE_URL = "sourceUrl";

    // ---- Nạp kho từ tệp ----
    /** Không đọc được kho địa điểm. */
    public static final String CATALOG_UNREADABLE = "Không đọc được kho địa điểm";
    /** Thiếu tệp ảnh; tham số: đường dẫn ảnh, mã địa điểm. */
    public static final String PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của địa điểm %s";
    /** Tệp dữ liệu hỏng; tham số: tên tệp, nguyên nhân. */
    public static final String CATALOG_FILE_CORRUPT = "Dữ liệu kho địa điểm hỏng ở tệp %s: %s";
    /** Loại địa điểm không hợp lệ; tham số: mã loại. */
    public static final String CATEGORY_INVALID = "Loại không hợp lệ: %s";
    /** Nhãn gợi ý không hợp lệ; tham số: mã nhãn. */
    public static final String VERDICT_INVALID = "Nhãn gợi ý không hợp lệ: %s";
    /** Buổi trong ngày không hợp lệ; tham số: mã buổi. */
    public static final String TIME_SLOT_INVALID = "Buổi không hợp lệ: %s";

    /** Tên trường "mã lịch mẫu" trong lời báo lỗi. */
    public static final String TEMPLATE_ID_LABEL = "mã lịch mẫu";

    /** Tên trường "tên lịch mẫu" trong lời báo lỗi. */
    public static final String TEMPLATE_TITLE_LABEL = "tên lịch mẫu";

    /** Tên trường "mô tả lịch mẫu" trong lời báo lỗi. */
    public static final String TEMPLATE_SUMMARY_LABEL = "mô tả lịch mẫu";

    /** Tên trường "ghi chú của ngày trong lịch mẫu" trong lời báo lỗi. */
    public static final String TEMPLATE_NOTE_LABEL = "ghi chú ngày của lịch mẫu";

    /** Mã lịch mẫu sai dạng; tham số: mã. */
    public static final String TEMPLATE_ID_INVALID = "Mã lịch mẫu phải là chữ thường, số và dấu gạch ngang: %s";

    /** Thiếu trạng thái duyệt; tham số: mã lịch mẫu. */
    public static final String TEMPLATE_STATUS_REQUIRED = "Lịch mẫu %s thiếu trạng thái duyệt";

    /** Trạng thái duyệt lạ (không được coi là đã duyệt); tham số: mã lịch mẫu, trạng thái. */
    public static final String TEMPLATE_STATUS_INVALID = "Lịch mẫu %s có trạng thái không hợp lệ: %s";

    /** Lịch mẫu không có ngày nào; tham số: mã lịch mẫu. */
    public static final String TEMPLATE_NEEDS_DAY = "Lịch mẫu %s phải có ít nhất một ngày";

    /** Lịch mẫu quá nhiều ngày; tham số: mã lịch mẫu, số ngày, tối đa. */
    public static final String TEMPLATE_TOO_MANY_DAYS = "Lịch mẫu %s có %d ngày, tối đa %d";

    /** Lịch mẫu không có địa điểm nào; tham số: mã lịch mẫu. */
    public static final String TEMPLATE_NEEDS_PLACE = "Lịch mẫu %s phải có ít nhất một địa điểm";

    /** Địa điểm lặp lại trong cùng lịch mẫu; tham số: mã lịch mẫu, mã địa điểm. */
    public static final String TEMPLATE_PLACE_DUPLICATED = "Lịch mẫu %s dùng địa điểm %s nhiều hơn một lần";

    /** Ngày của lịch mẫu không có địa điểm lẫn ghi chú. */
    public static final String TEMPLATE_DAY_EMPTY = "Mỗi ngày của lịch mẫu phải có địa điểm hoặc ghi chú giải thích";

    /** Mã địa điểm trống trong lịch mẫu. */
    public static final String TEMPLATE_PLACE_ID_BLANK = "Mã địa điểm trong lịch mẫu không được trống";

    /** Lịch mẫu trỏ tới địa điểm không có trong điểm đến; tham số: mã lịch mẫu, mã địa điểm, mã điểm đến. */
    public static final String TEMPLATE_PLACE_UNKNOWN = "Lịch mẫu %s dùng địa điểm %s không có trong điểm đến %s";

    /** Tệp lịch mẫu trỏ tới điểm đến không có trong kho; tham số: mã điểm đến. */
    public static final String TEMPLATE_DESTINATION_UNKNOWN = "Lịch mẫu trỏ tới điểm đến không có trong kho: %s";

    /** Hai tệp lịch mẫu cho cùng một điểm đến; tham số: mã điểm đến. */
    public static final String TEMPLATE_FILE_DUPLICATED = "Hai tệp lịch mẫu cho cùng điểm đến: %s";

    /** Hai lịch mẫu cùng mã trong một điểm đến; tham số: mã điểm đến, mã lịch mẫu. */
    public static final String TEMPLATE_ID_DUPLICATED = "Điểm đến %s có hai lịch mẫu cùng mã: %s";

    /** Nhãn địa chỉ của một cơ sở dịch vụ cụ thể. */
    public static final String LABEL_VENUE_ADDRESS = "địa chỉ cơ sở";

    /** Nhãn trường tùy chọn, chỉ nhận nội dung có nguồn của hồ sơ. */
    public static final String LABEL_VENUE_PHONE = "số liên hệ";
    public static final String LABEL_VENUE_HOURS = "giờ phục vụ";
    public static final String LABEL_VENUE_PRICE_NOTE = "ghi chú mức giá";

    /** Metadata dịch vụ phải có loại và ngày đối chiếu. */
    public static final String VENUE_METADATA_INVALID = "Thông tin cơ sở thiếu loại hoặc ngày đối chiếu";

    /** Không chấp nhận URL tùy ý hoặc liên kết chứa đăng nhập. */
    public static final String VENUE_URL_INVALID = "Liên kết cơ sở phải là HTTPS hợp lệ";

    /** Metadata dịch vụ phải khớp nhóm khám phá. */
    public static final String VENUE_CATEGORY_INVALID = "Loại cơ sở không khớp loại địa điểm";

    /** Mã dịch vụ lạ trong tệp catalog. */
    public static final String VENUE_KIND_INVALID = "Loại cơ sở không hợp lệ: %s";

    /** Thiếu ảnh bìa cục bộ; tham số: đường dẫn classpath và mã điểm đến. */
    public static final String DESTINATION_PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của điểm đến %s";

    private CatalogMessages() {
    }
}
