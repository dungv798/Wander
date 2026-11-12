package com.wander.catalog.api.constant;

/** Constants of the catalog API (FEATURE tier): paths, parameter names and the JSON key names of the response (matching {@code web/src/api.ts}). */
public final class CatalogApiConstants {

    /** Base path of the catalog API. */
    public static final String BASE_PATH = "/api/catalog";

    /** List of destinations (can be filtered by the search parameter). */
    public static final String DESTINATIONS_PATH = "/destinations";

    /** One destination by id. */
    public static final String DESTINATION_PATH = "/destinations/{id}";

    /** The sample itineraries of a destination (N-2). */
    public static final String TEMPLATES_PATH = DESTINATION_PATH + "/templates";

    /** Name of the search parameter. */
    public static final String QUERY_PARAM = "q";

    private CatalogApiConstants() {
    }
}
