package com.wander.catalog.api.constant;

/** The path and extra response keys of POI. */
public final class PoiApiConstants {
    /** The POI endpoint by destination, inside the existing public catalog pattern. */
    public static final String PATH = CatalogApiConstants.BASE_PATH + CatalogApiConstants.DESTINATION_PATH + "/poi";

    private PoiApiConstants() {
    }
}
