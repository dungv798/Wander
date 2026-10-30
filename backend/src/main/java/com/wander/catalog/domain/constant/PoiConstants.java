package com.wander.catalog.domain.constant;

/** Giới hạn và tên trường của lớp POI snapshot, độc lập với hồ sơ Discover. */
public final class PoiConstants {
    /** Mẫu tài nguyên POI, mỗi điểm đến một tệp. */
    public static final String LOCATION = "${wander.catalog.poi-location:classpath*:catalog/poi/*.json}";
    /** Số mét trong một km. */
    public static final int METERS_PER_KM = 1000;
    /** Bán kính tìm kiếm mặc định, mét. */
    public static final int DEFAULT_RADIUS_M = 2000;
    /** Bán kính tìm kiếm tối đa, mét. */
    public static final int MAX_RADIUS_M = 5000;
    /** Trần phạm vi batch quanh tâm điểm đến, mét; không phải bán kính tìm kiếm. */
    public static final int MAX_DESTINATION_RADIUS_M = 15000;
    /** Số kết quả mặc định. */
    public static final int DEFAULT_LIMIT = 20;
    /** Số kết quả tối đa. */
    public static final int MAX_LIMIT = 30;
    /** Độ dài tối đa chuỗi tham số trước khi phân tích. */
    public static final int MAX_PARAMETER_LENGTH = 80;
    /** Khóa loại địa điểm. */
    public static final String KIND = "kind";
    /** Bộ lọc món ăn, gồm food và fast_food. */
    public static final String FOOD = "food";
    /** Bộ lọc cà phê. */
    public static final String CAFE = "cafe";
    /** Nhu cầu nghỉ, chỉ chọn cafe trong lát này. */
    public static final String REST = "rest";
    /** Bộ lọc mọi loại. */
    public static final String ALL = "all";
    /** Khóa điểm gần định dạng lat,lon. */
    public static final String NEAR = "near";
    /** Khóa bán kính mét. */
    public static final String RADIUS_M = "radiusM";
    /** Khóa số kết quả. */
    public static final String LIMIT = "limit";
    /** Mẫu số nguyên dương. */
    public static final String INTEGER_PATTERN = "[0-9]+";
    /** Khóa danh tính nội bộ. */
    public static final String ID = "id";
    /** Khóa điểm đến. */
    public static final String DESTINATION_ID = "destinationId";
    /** Khóa tên. */
    public static final String NAME = "name";
    /** Khóa tọa độ theo thứ tự lat,lon. */
    public static final String CENTER = "center";
    /** Khóa loại tọa độ. */
    public static final String COORDINATE_KIND = "coordinateKind";
    /** Tọa độ của node. */
    public static final String POINT = "point";
    /** Tâm hình học do nguồn cung cấp. */
    public static final String CENTER_KIND = "center";
    /** Khóa địa chỉ hiển thị. */
    public static final String ADDRESS = "address";
    /** Khóa giờ nguyên văn. */
    public static final String HOURS = "openingHoursRaw";
    /** Khóa số điện thoại. */
    public static final String PHONE = "phone";
    /** Khóa website; chỉ trả dữ liệu, không truy cập URL. */
    public static final String WEBSITE = "website";
    /** Khóa Wikidata tùy có. */
    public static final String WIKIDATA_ID = "wikidataId";
    /** Mẫu mã Wikidata. */
    public static final String WIKIDATA_PATTERN = "Q[1-9][0-9]*";
    /** Khóa loại nguồn OSM. */
    public static final String OSM_TYPE = "osmType";
    /** Các namespace OSM hợp lệ. */
    public static final String OSM_TYPE_PATTERN = "node|way|relation";
    /** Khóa số định danh OSM. */
    public static final String OSM_ID = "osmId";
    /** Tên nguồn dữ liệu. */
    public static final String OSM = "OSM";
    /** Gốc URL nguồn dữ kiện. */
    public static final String OSM_URL = "https://www.openstreetmap.org/";
    /** Giấy phép dữ liệu snapshot. */
    public static final String LICENSE = "ODbL-1.0";
    /** URL giấy phép và ghi công OSM. */
    public static final String LICENSE_URL = "https://www.openstreetmap.org/copyright";
    /** Chuỗi ghi công nguồn. */
    public static final String ATTRIBUTION = "© OpenStreetMap contributors";
    /** Khóa provenance theo trường. */
    public static final String PROVENANCE = "provenance";
    /** Khóa trạng thái kiểm chứng. */
    public static final String VERIFICATION = "verificationStatus";
    /** Lời báo dữ liệu POI không hợp lệ. */
    public static final String INVALID_RECORD = "Dữ liệu POI không hợp lệ hoặc thiếu bằng chứng nguồn.";
    /** Lỗi không đọc được tài nguyên; tham số là tên tệp. */
    public static final String FILE_UNREADABLE = "Không đọc được dữ liệu POI: %s";

    private PoiConstants() {
    }
}
