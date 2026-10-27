package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
/**
 * Ước tính quãng đường và thời gian đi xe máy giữa hai điểm. Đây là phép tính thô, KHÔNG phải chỉ đường:
 * đường chim bay (haversine) nhân {@value CatalogConstants#ROAD_FACTOR} cho độ quanh co của đường núi, chia cho tốc độ
 * giả định {@value CatalogConstants#SPEED_KMH} km/h. Hai hệ số là giả định chưa kiểm chứng (decisions.md);
 * giao diện luôn ghi "ước tính".
 */
public record TravelEstimate(int roadKm, int minutes) {

    /** Khoảng cách đường chim bay giữa hai tọa độ, tính bằng km (công thức haversine). */
    public static double airKm(GeoPoint from, GeoPoint to) {
        double deltaLat = Math.toRadians(to.lat() - from.lat());
        double deltaLon = Math.toRadians(to.lon() - from.lon());
        double halfChordSquared = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
                + Math.cos(Math.toRadians(from.lat())) * Math.cos(Math.toRadians(to.lat()))
                * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        double angle = 2 * Math.atan2(Math.sqrt(halfChordSquared), Math.sqrt(1 - halfChordSquared));
        return CatalogConstants.EARTH_RADIUS_KM * angle;
    }

    /** Ước tính quãng đường (làm tròn, tối thiểu 1 km) và số phút đi xe máy giữa hai tọa độ. */
    public static TravelEstimate between(GeoPoint from, GeoPoint to) {
        double roadKm = airKm(from, to) * CatalogConstants.ROAD_FACTOR;
        int minutes = (int) Math.round(roadKm / CatalogConstants.SPEED_KMH * CatalogConstants.MINUTES_PER_HOUR);
        return new TravelEstimate(Math.max(1, (int) Math.round(roadKm)), minutes);
    }
}
