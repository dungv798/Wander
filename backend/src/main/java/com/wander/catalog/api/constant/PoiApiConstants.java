package com.wander.catalog.api.constant;

/** Đường dẫn và khóa phản hồi cộng thêm của POI. */
public final class PoiApiConstants {
    /** Endpoint POI theo điểm đến, nằm trong mẫu công khai catalog hiện có. */
    public static final String PATH = CatalogApiConstants.BASE_PATH + CatalogApiConstants.DESTINATION_PATH + "/poi";
    /** Khóa danh sách ứng viên. */
    public static final String KEY_POI = "poi";

    private PoiApiConstants() {
    }
}
