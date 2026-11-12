package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
/**
 * An estimate of the distance and the motorbike travel time between two points. This is a rough calculation, NOT directions:
 * the straight-line distance (haversine) times {@value CatalogConstants#ROAD_FACTOR} for the winding of mountain roads, divided by the
 * assumed speed {@value CatalogConstants#SPEED_KMH} km/h. Both factors are unverified assumptions (decisions.md);
 * the UI always says 'estimate'.
 */
public record TravelEstimate(int roadKm, int minutes) {

    /** The straight-line distance between two coordinates, in km (the haversine formula). */
    public static double airKm(GeoPoint from, GeoPoint to) {
        double deltaLat = Math.toRadians(to.lat() - from.lat());
        double deltaLon = Math.toRadians(to.lon() - from.lon());
        double halfChordSquared = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(Math.toRadians(from.lat())) * Math.cos(Math.toRadians(to.lat()))
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        double angle = 2 * Math.atan2(Math.sqrt(halfChordSquared), Math.sqrt(1 - halfChordSquared));
        return CatalogConstants.EARTH_RADIUS_KM * angle;
    }

    /** Estimates the distance (rounded, at least 1 km) and the number of motorbike minutes between two coordinates. */
    public static TravelEstimate between(GeoPoint from, GeoPoint to) {
        double roadKm = airKm(from, to) * CatalogConstants.ROAD_FACTOR;
        int minutes = (int) Math.round(roadKm / CatalogConstants.SPEED_KMH * CatalogConstants.MINUTES_PER_HOUR);
        return new TravelEstimate(Math.max(1, (int) Math.round(roadKm)), minutes);
    }
}
