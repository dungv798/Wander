package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;

/** Danh tính và dữ kiện nền chỉ đọc; hồ sơ Discover hiện có vẫn giữ hợp đồng riêng. */
public record PlaceRecord(String id, String destinationId, String osmType, long osmId, String wikidataId,
                          String name, GeoPoint location, String coordinateKind, String address, String phone, String website) {
    public PlaceRecord {
        PoiValidation.requireText(id, PoiConstants.ID);
        PoiValidation.require(id.matches(CatalogConstants.SLUG_REGEX) && id.length() <= CatalogConstants.PLACE_ID_MAX_LENGTH, PoiConstants.ID);
        PoiValidation.requireText(destinationId, PoiConstants.DESTINATION_ID);
        PoiValidation.require(destinationId.matches(CatalogConstants.SLUG_REGEX), PoiConstants.DESTINATION_ID);
        PoiValidation.requireOsmIdentity(osmType, osmId);
        PoiValidation.require(wikidataId == null || wikidataId.matches(PoiConstants.WIKIDATA_PATTERN), PoiConstants.WIKIDATA_ID);
        PoiValidation.requireText(name, PoiConstants.NAME);
        PoiValidation.require(name.length() <= CatalogConstants.NAME_MAX_LENGTH, PoiConstants.NAME);
        PoiValidation.require(location != null, PoiConstants.CENTER);
        PoiValidation.require(PoiConstants.POINT.equals(coordinateKind) || PoiConstants.CENTER_KIND.equals(coordinateKind), PoiConstants.COORDINATE_KIND);
    }
}
