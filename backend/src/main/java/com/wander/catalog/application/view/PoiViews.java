package com.wander.catalog.application.view;

/** The reduced POI contract; the full provenance is kept in the resource and is not sent in the list. */
public final class PoiViews {
    private PoiViews() {
    }

    public record Candidate(String id, String name, String kind, double lat, double lon, double distanceM, String address,
                            String openingHoursRaw, String openingHoursStatus, String phone, String website,
                            String verificationStatus, Attribution attribution) {
    }

    public record Attribution(String sourceKind, String sourceUrl, String snapshotAt, String license, String licenseUrl, String credit) {
    }
}
