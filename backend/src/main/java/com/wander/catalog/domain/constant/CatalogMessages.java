package com.wander.catalog.domain.constant;

/**
 * Lời báo lỗi dữ liệu biên tập của catalog (tiếng Việt cho người biên tập). Mẫu dùng {@code String.formatted(...)}:
 * {@code %s} là chuỗi, {@code %d} là số nguyên.
 */
public final class CatalogMessages {

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
    public static final String PLACE_NEEDS_PHOTO = "Địa điểm %s phải có ít nhất một ảnh";
    /** Địa điểm có quá nhiều ảnh; tham số: mã địa điểm, số ảnh tối đa. */
    public static final String PLACE_TOO_MANY_PHOTOS = "Địa điểm %s có quá %d ảnh";
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

    private CatalogMessages() {
    }
}
