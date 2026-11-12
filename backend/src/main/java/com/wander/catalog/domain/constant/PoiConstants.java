package com.wander.catalog.domain.constant;

/** Limits and field names of the POI snapshot layer, independent of the Discover profile. */
public final class PoiConstants {
    /** The POI resource pattern, one file per destination. */
    public static final String LOCATION = "${wander.catalog.poi-location:classpath*:catalog/poi/*.json}";
    /** The number of meters in a km. */
    public static final int METERS_PER_KM = 1000;
    /** The default search radius, meters. */
    public static final int DEFAULT_RADIUS_M = 2000;
    /** The maximum search radius, meters. */
    public static final int MAX_RADIUS_M = 5000;
    /** The ceiling of the batch's range around the destination center, meters; not the search radius. */
    public static final int MAX_DESTINATION_RADIUS_M = 15000;
    /** The default number of results. */
    public static final int DEFAULT_LIMIT = 20;
    /** The maximum number of results. */
    public static final int MAX_LIMIT = 30;
    /** The maximum length of a parameter string before parsing. */
    public static final int MAX_PARAMETER_LENGTH = 80;
    /** The place-kind key. */
    public static final String KIND = "kind";
    /** The food filter, covering food and fast_food. */
    public static final String FOOD = "food";
    /** The coffee filter. */
    public static final String CAFE = "cafe";
    /** The rest need, choosing only cafe in this slice. */
    public static final String REST = "rest";
    /** The filter of every kind. */
    public static final String ALL = "all";
    /** The nearby-point key in lat,lon form. */
    public static final String NEAR = "near";
    /** The radius key in meters. */
    public static final String RADIUS_M = "radiusM";
    /** The result-count key. */
    public static final String LIMIT = "limit";
    /** The positive-integer pattern. */
    public static final String INTEGER_PATTERN = "[0-9]+";
    /** The internal identity key. */
    public static final String ID = "id";
    /** The destination key. */
    public static final String DESTINATION_ID = "destinationId";
    /** The name key. */
    public static final String NAME = "name";
    /** The coordinates key in lat,lon order. */
    public static final String CENTER = "center";
    /** The coordinate kind key. */
    public static final String COORDINATE_KIND = "coordinateKind";
    /** The coordinates of a node. */
    public static final String POINT = "point";
    /** The geometric center supplied by the source. */
    public static final String CENTER_KIND = "center";
    /** The display address key. */
    public static final String ADDRESS = "address";
    /** The verbatim opening-hours key. */
    public static final String HOURS = "openingHoursRaw";
    /** The phone-number key. */
    public static final String PHONE = "phone";
    /** The website key; it only returns data, the URL is never visited. */
    public static final String WEBSITE = "website";
    /** The optional Wikidata key. */
    public static final String WIKIDATA_ID = "wikidataId";
    /** The Wikidata id pattern. */
    public static final String WIKIDATA_PATTERN = "Q[1-9][0-9]*";
    /** The OSM source kind key. */
    public static final String OSM_TYPE = "osmType";
    /** The valid OSM namespaces. */
    public static final String OSM_TYPE_PATTERN = "node|way|relation";
    /** The OSM identifier number key. */
    public static final String OSM_ID = "osmId";
    /** The name of the data source. */
    public static final String OSM = "OSM";
    /** The base URL of the source of facts. */
    public static final String OSM_URL = "https://www.openstreetmap.org/";
    /** The license of the snapshot data. */
    public static final String LICENSE = "ODbL-1.0";
    /** The OSM license and attribution URL. */
    public static final String LICENSE_URL = "https://www.openstreetmap.org/copyright";
    /** The source attribution string. */
    public static final String ATTRIBUTION = "© OpenStreetMap contributors";
    /** The per-field provenance key. */
    public static final String PROVENANCE = "provenance";
    /** The verification status key. */
    public static final String VERIFICATION = "verificationStatus";
    /** The message for invalid POI data. */
    public static final String INVALID_RECORD = "Dữ liệu POI không hợp lệ hoặc thiếu bằng chứng nguồn.";
    /** Error: the resource cannot be read; parameter is the file name. */
    public static final String FILE_UNREADABLE = "Không đọc được dữ liệu POI: %s";

    private PoiConstants() {
    }
}
