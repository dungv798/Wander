package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.shared.kernel.constant.CommonConstants;
import java.util.List;
import java.util.Map;

/** Nguồn đã gộp trong batch; giữ tag gốc để có thể review và tách lại. */
public record OsmReference(String osmType, long osmId, String sourceUrl, List<Double> center, Map<String, String> tags) {
    public OsmReference {
        PoiValidation.requireOsmIdentity(osmType, osmId);
        PoiValidation.require((PoiConstants.OSM_URL + osmType + CommonConstants.SLASH + osmId).equals(sourceUrl), PoiConstants.PROVENANCE);
        PoiValidation.require(center != null && center.size() == 2, PoiConstants.CENTER);
        center = List.copyOf(center);
        new GeoPoint(center.getFirst(), center.getLast());
        tags = Map.copyOf(tags);
    }
}
