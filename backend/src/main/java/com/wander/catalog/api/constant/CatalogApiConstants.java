package com.wander.catalog.api.constant;

/** Hằng số của API catalog (tầng CHỨC NĂNG): đường dẫn, tên tham số và tên khóa JSON của phản hồi (khớp {@code web/src/api.ts}). */
public final class CatalogApiConstants {

    /** Đường dẫn gốc của API catalog. */
    public static final String BASE_PATH = "/api/catalog";

    /** Danh sách điểm đến (có thể lọc bằng tham số tìm kiếm). */
    public static final String DESTINATIONS_PATH = "/destinations";

    /** Một điểm đến theo mã. */
    public static final String DESTINATION_PATH = "/destinations/{id}";

    /** Lịch mẫu của một điểm đến (N-2). */
    public static final String TEMPLATES_PATH = DESTINATION_PATH + "/templates";

    /** Khóa JSON của danh sách lịch mẫu. */
    public static final String KEY_TEMPLATES = "templates";

    /** Tên tham số tìm kiếm. */
    public static final String QUERY_PARAM = "q";

    /** Khóa JSON của danh sách điểm đến. */
    public static final String KEY_DESTINATIONS = "destinations";

    /** Khóa JSON của một điểm đến. */
    public static final String KEY_DESTINATION = "destination";

    private CatalogApiConstants() {
    }
}
