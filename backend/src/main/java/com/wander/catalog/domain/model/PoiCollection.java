package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.shared.kernel.constant.CommonConstants;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** The POI batch of a destination, with identity and range checked as soon as it is loaded. */
public record PoiCollection(String destinationId, GeoPoint center, double radiusM, List<PoiRecord> pois) {
    public PoiCollection {
        PoiValidation.requireText(destinationId, PoiConstants.DESTINATION_ID);
        PoiValidation.require(center != null, PoiConstants.CENTER);
        PoiValidation.require(Double.isFinite(radiusM) && radiusM > 0 && radiusM <= PoiConstants.MAX_DESTINATION_RADIUS_M, PoiConstants.RADIUS_M);
        pois = List.copyOf(pois);
        Set<String> ids = new HashSet<>();
        Set<String> sources = new HashSet<>();
        for (PoiRecord poi : pois) {
            PoiValidation.require(destinationId.equals(poi.place().destinationId()), PoiConstants.DESTINATION_ID);
            PoiValidation.require(ids.add(poi.place().id()), PoiConstants.ID);
            requireSource(sources, poi.place().osmType(), poi.place().osmId());
            requireLocation(center, poi.place().location(), radiusM);
            for (OsmReference merged : poi.mergedFrom()) {
                requireSource(sources, merged.osmType(), merged.osmId());
                requireLocation(center, new GeoPoint(merged.center().getFirst(), merged.center().getLast()), radiusM);
            }
        }
    }

    /** Checks the radius with haversine in meters, accepting a point exactly on the boundary. */
    private static void requireLocation(GeoPoint center, GeoPoint location, double radiusM) {
        PoiValidation.require(TravelEstimate.airKm(center, location) * PoiConstants.METERS_PER_KM <= radiusM, PoiConstants.CENTER);
    }

    /** Each type/id belongs to only one record or one merged source in the batch. */
    private static void requireSource(Set<String> sources, String type, long id) {
        PoiValidation.require(sources.add(type + CommonConstants.SLASH + id), PoiConstants.OSM_ID);
    }
}
