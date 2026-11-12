package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
/** WGS84 coordinates whose valid range has been checked. */
public record GeoPoint(double lat, double lon) {

    public GeoPoint {
        boolean latitudeValid = Math.abs(lat) <= CatalogConstants.LATITUDE_LIMIT;
        boolean longitudeValid = Math.abs(lon) <= CatalogConstants.LONGITUDE_LIMIT;
        CatalogValidation.require(latitudeValid && longitudeValid, CatalogMessages.COORDINATE_OUT_OF_RANGE, lat, lon);
    }
}
