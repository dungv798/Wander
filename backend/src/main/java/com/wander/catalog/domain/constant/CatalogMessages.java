package com.wander.catalog.domain.constant;

/**
 * Error messages of the catalog's editorial data (Vietnamese for the editor). The templates use {@code String.formatted(...)}:
 * {@code %s} is a string, {@code %d} is an integer.
 */
public final class CatalogMessages {
    /** The moment author's link must use https on the Unsplash server. */
    public static final String MOMENT_AUTHOR_URL_INVALID = "Liên kết tác giả khoảnh khắc phải là địa chỉ https trên unsplash.com";
    /** The photo caption limit; parameter: the maximum number of characters. */
    public static final String PHOTO_CAPTION_TOO_LONG = "Chú thích ảnh không quá %d ký tự";
    /** The author attribution link is not a safe https URL. */
    public static final String PHOTO_AUTHOR_URL_INVALID = "Liên kết tác giả phải là địa chỉ https hợp lệ";

    // ---- Destination ----
    /** A destination is missing an id, name, region or short description. */
    public static final String DESTINATION_FIELDS_MISSING = "Điểm đến thiếu id, tên, vùng hoặc mô tả ngắn";
    /** A destination has no reference landmark yet; parameter: the destination id. */
    public static final String DESTINATION_NEEDS_REFERENCE = "Điểm đến %s cần ít nhất một mốc tham chiếu";
    /** A destination has no places yet; parameter: the destination id. */
    public static final String DESTINATION_NEEDS_PLACE = "Điểm đến %s chưa có địa điểm nào";
    /** A place belongs to another destination; parameter: the place id. */
    public static final String PLACE_OF_OTHER_DESTINATION = "Địa điểm %s thuộc điểm đến khác";
    /** A place id is duplicated; parameter: the place id. */
    public static final String PLACE_ID_DUPLICATED = "Trùng mã địa điểm: %s";
    /** The cover photo points to a place that does not exist; parameter: the place id. */
    public static final String COVER_PLACE_MISSING = "Ảnh bìa trỏ tới địa điểm không có: %s";
    public static final String COVER_PLACE_NEEDS_PHOTO = "Địa điểm bìa %s phải có ít nhất một ảnh (trang chủ dùng làm bìa điểm đến)";
    /** A guide block id is duplicated; parameter: the block id. */
    public static final String GUIDE_SECTION_ID_DUPLICATED = "Trùng mã khối cẩm nang: %s";
    /** The guide points to a place that does not exist; parameter: the place id. */
    public static final String GUIDE_LINKS_UNKNOWN_PLACE = "Cẩm nang trỏ tới địa điểm không có: %s";
    /** A destination id is duplicated in the catalog; parameter: the destination id. */
    public static final String DESTINATION_ID_DUPLICATED = "Trùng mã điểm đến trong kho: %s";

    // ---- Guide block ----
    /** A guide block is missing an id, title or summary. */
    public static final String GUIDE_SECTION_FIELDS_MISSING = "Khối cẩm nang thiếu id, tiêu đề hoặc tóm tắt";
    /** A guide block is missing its display kind or type; parameter: the block id. */
    public static final String GUIDE_SECTION_KIND_MISSING = "Khối cẩm nang %s thiếu kiểu hiển thị hoặc loại";
    /** A month outside 1..12 in a block; parameter: the block id. */
    public static final String MONTH_OUT_OF_RANGE_IN_SECTION = "Tháng ngoài 1..12 ở khối %s";
    /** A month that is both the best and rainy; parameter: the block id. */
    public static final String MONTH_BOTH_BEST_AND_RAINY = "Tháng vừa đẹp nhất vừa mưa nhiều ở khối %s";
    /** A guide line is missing a title. */
    public static final String GUIDE_ITEM_TITLE_MISSING = "Dòng cẩm nang thiếu tiêu đề";

    // ---- Place ----
    /** An invalid place id; parameter: the id. */
    public static final String PLACE_ID_INVALID = "Mã địa điểm không hợp lệ: %s";
    /** An invalid destination id; parameter: the id. */
    public static final String DESTINATION_ID_INVALID = "Mã điểm đến không hợp lệ: %s";
    /** A place is missing its kind or suggestion label; parameter: the place id. */
    public static final String PLACE_KIND_MISSING = "Địa điểm %s thiếu loại hoặc nhãn gợi ý";
    /** A month outside 1..12 in a place; parameter: the place id. */
    public static final String MONTH_OUT_OF_RANGE_IN_PLACE = "Tháng ngoài 1..12 ở %s";
    /** A place has no photo yet; parameter: the place id. */
    /** A place has too many photos; parameter: the place id, the maximum number of photos. */
    public static final String PLACE_TOO_MANY_PHOTOS = "Địa điểm %s có quá %d ảnh";
    /** A photo must have exactly one source. */
    public static final String PHOTO_NEEDS_ONE_SOURCE = "Ảnh phải có đúng một nguồn: tệp cục bộ hoặc URL ngoài";
    /** The external photo server is not allowed; parameter: the URL. */
    public static final String PHOTO_EXTERNAL_HOST_NOT_ALLOWED = "Máy chủ ảnh ngoài không được phép: %s";
    /** A moment is missing a field; parameter: the field label. */
    public static final String MOMENT_FIELD_MISSING = "Khoảnh khắc thiếu %s";
    /** The labels of the fields of a moment. */
    public static final String LABEL_MOMENT_ID = "mã";
    public static final String LABEL_MOMENT_THEME = "chủ đề";
    public static final String LABEL_MOMENT_CAPTION = "chú thích";
    public static final String LABEL_MOMENT_PHOTO = "ảnh";
    /** A moment id is duplicated within a destination; parameter: the moment id. */
    public static final String MOMENT_ID_DUPLICATED = "Trùng mã khoảnh khắc %s";
    /** A destination has too many moments; parameter: the destination id, the maximum. */
    public static final String DESTINATION_TOO_MANY_MOMENTS = "Điểm đến %s có quá %d khoảnh khắc";
    /** An unknown moment theme; parameter: the theme code. */
    public static final String MOMENT_THEME_INVALID = "Chủ đề khoảnh khắc không hợp lệ: %s";
    /** The moment's photo file is missing; parameter: the path, the moment id. */
    public static final String MOMENT_PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của khoảnh khắc %s";
    /** A text field is missing; parameter: the field label. */
    public static final String FIELD_REQUIRED = "Thiếu %s";
    /** A text field is too long; parameter: the field label, the actual length, the maximum length. */
    public static final String FIELD_TOO_LONG = "Quá dài (%s): %d > %d";

    /** Field label: name. */
    public static final String LABEL_NAME = "tên";
    /** Field label: area. */
    public static final String LABEL_AREA = "khu vực";
    /** Field label: the highlight sentence. */
    public static final String LABEL_HOOK = "câu điểm nhấn";
    /** Field label: the season label. */
    public static final String LABEL_BEST_LABEL = "nhãn mùa";
    /** Field label: duration. */
    public static final String LABEL_DURATION = "thời lượng";
    /** Field label: difficulty. */
    public static final String LABEL_DIFFICULTY = "độ khó";
    /** Field label: the reason for the suggestion label. */
    public static final String LABEL_VERDICT_REASON = "lý do nhãn gợi ý";
    /** Field label: the reason for the best time of day. */
    public static final String LABEL_SLOT_REASON = "lý do buổi nên đi";

    // ---- Coordinates, landmarks, photos ----
    /** Coordinates outside the valid range; parameter: latitude, longitude. */
    public static final String COORDINATE_OUT_OF_RANGE = "Tọa độ ngoài khoảng hợp lệ: %s, %s";
    /** A reference landmark is missing an id, name or coordinates. */
    public static final String REFERENCE_FIELDS_MISSING = "Mốc tham chiếu thiếu id, tên hoặc tọa độ";
    /** A reference landmark is missing coordinates in the file; parameter: the landmark id. */
    public static final String REFERENCE_COORDINATES_MISSING = "Mốc tham chiếu %s thiếu tọa độ";
    /** A photo is missing a field; parameter: the field label. */
    public static final String PHOTO_FIELD_MISSING = "Ảnh thiếu %s";
    /** The thumbnail that goes with an external photo. */
    public static final String PHOTO_THUMB_NEEDS_FILE = "Ảnh thu nhỏ chỉ đi kèm ảnh lưu cục bộ, không đi kèm ảnh ngoài";
    /** A photo file name has the wrong shape; parameter: the file name. */
    public static final String PHOTO_FILE_NAME_INVALID = "Tên tệp ảnh chỉ gồm chữ thường, số, gạch ngang và đuôi jpg/jpeg/png/webp: %s";
    /** A photo source link is not https; parameter: the link. */
    public static final String PHOTO_SOURCE_NOT_HTTPS = "Liên kết gốc của ảnh phải là https: %s";
    /** Photo field label: file. */
    public static final String LABEL_PHOTO_FILE = "file";
    /** Photo field label: author. */
    public static final String LABEL_PHOTO_AUTHOR = "author";
    /** Photo field label: license. */
    public static final String LABEL_PHOTO_LICENSE = "license";
    /** Photo field label: the original link. */
    public static final String LABEL_PHOTO_SOURCE_URL = "sourceUrl";

    // ---- Loading the catalog from files ----
    /** The venue catalog cannot be read. */
    public static final String CATALOG_UNREADABLE = "Không đọc được kho địa điểm";
    /** A photo file is missing; parameter: the photo path, the place id. */
    public static final String PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của địa điểm %s";
    /** A data file is broken; parameter: the file name, the cause. */
    public static final String CATALOG_FILE_CORRUPT = "Dữ liệu kho địa điểm hỏng ở tệp %s: %s";
    /** An invalid place kind; parameter: the kind code. */
    public static final String CATEGORY_INVALID = "Loại không hợp lệ: %s";
    /** An invalid suggestion label; parameter: the label code. */
    public static final String VERDICT_INVALID = "Nhãn gợi ý không hợp lệ: %s";
    /** An invalid time of day; parameter: the time-of-day code. */
    public static final String TIME_SLOT_INVALID = "Buổi không hợp lệ: %s";

    /** The field name 'template code' in the error message. */
    public static final String TEMPLATE_ID_LABEL = "mã lịch mẫu";

    /** The field name 'template name' in the error message. */
    public static final String TEMPLATE_TITLE_LABEL = "tên lịch mẫu";

    /** The field name 'template description' in the error message. */
    public static final String TEMPLATE_SUMMARY_LABEL = "mô tả lịch mẫu";

    /** The field name 'note of a day in the template' in the error message. */
    public static final String TEMPLATE_NOTE_LABEL = "ghi chú ngày của lịch mẫu";

    /** A template id with the wrong shape; parameter: the id. */
    public static final String TEMPLATE_ID_INVALID = "Mã lịch mẫu phải là chữ thường, số và dấu gạch ngang: %s";

    /** A review status is missing; parameter: the template id. */
    public static final String TEMPLATE_STATUS_REQUIRED = "Lịch mẫu %s thiếu trạng thái duyệt";

    /** An unknown review status (not to be treated as approved); parameter: the template id, the status. */
    public static final String TEMPLATE_STATUS_INVALID = "Lịch mẫu %s có trạng thái không hợp lệ: %s";

    /** A template with no day; parameter: the template id. */
    public static final String TEMPLATE_NEEDS_DAY = "Lịch mẫu %s phải có ít nhất một ngày";

    /** A template with too many days; parameter: the template id, the number of days, the maximum. */
    public static final String TEMPLATE_TOO_MANY_DAYS = "Lịch mẫu %s có %d ngày, tối đa %d";

    /** A template with no place; parameter: the template id. */
    public static final String TEMPLATE_NEEDS_PLACE = "Lịch mẫu %s phải có ít nhất một địa điểm";

    /** A place repeated in the same template; parameter: the template id, the place id. */
    public static final String TEMPLATE_PLACE_DUPLICATED = "Lịch mẫu %s dùng địa điểm %s nhiều hơn một lần";

    /** A template day has neither a place nor a note. */
    public static final String TEMPLATE_DAY_EMPTY = "Mỗi ngày của lịch mẫu phải có địa điểm hoặc ghi chú giải thích";

    /** An empty place id in a template. */
    public static final String TEMPLATE_PLACE_ID_BLANK = "Mã địa điểm trong lịch mẫu không được trống";

    /** A template points to a place that is not in the destination; parameter: the template id, the place id, the destination id. */
    public static final String TEMPLATE_PLACE_UNKNOWN = "Lịch mẫu %s dùng địa điểm %s không có trong điểm đến %s";

    /** A template file points to a destination that is not in the catalog; parameter: the destination id. */
    public static final String TEMPLATE_DESTINATION_UNKNOWN = "Lịch mẫu trỏ tới điểm đến không có trong kho: %s";

    /** Two template files for the same destination; parameter: the destination id. */
    public static final String TEMPLATE_FILE_DUPLICATED = "Hai tệp lịch mẫu cho cùng điểm đến: %s";

    /** Two templates with the same id in one destination; parameter: the destination id, the template id. */
    public static final String TEMPLATE_ID_DUPLICATED = "Điểm đến %s có hai lịch mẫu cùng mã: %s";

    /** The address label of a specific service establishment. */
    public static final String LABEL_VENUE_ADDRESS = "địa chỉ cơ sở";

    /** An optional field label, accepting only content that has a source in the profile. */
    public static final String LABEL_VENUE_PHONE = "số liên hệ";
    public static final String LABEL_VENUE_HOURS = "giờ phục vụ";
    public static final String LABEL_VENUE_PRICE_NOTE = "ghi chú mức giá";

    /** The service metadata must have a kind and a cross-check date. */
    public static final String VENUE_METADATA_INVALID = "Thông tin cơ sở thiếu loại hoặc ngày đối chiếu";

    /** An arbitrary URL or a link containing a login is not accepted. */
    public static final String VENUE_URL_INVALID = "Liên kết cơ sở phải là HTTPS hợp lệ";

    /** The service metadata must match the discovery group. */
    public static final String VENUE_CATEGORY_INVALID = "Loại cơ sở không khớp loại địa điểm";

    /** An unknown service code in the catalog file. */
    public static final String VENUE_KIND_INVALID = "Loại cơ sở không hợp lệ: %s";

    /** The local cover photo is missing; parameter: the classpath path and the destination id. */
    public static final String DESTINATION_PHOTO_FILE_MISSING = "Thiếu tệp ảnh %s của điểm đến %s";

    private CatalogMessages() {
    }
}
