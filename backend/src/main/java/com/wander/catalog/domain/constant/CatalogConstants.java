package com.wander.catalog.domain.constant;

import java.util.Set;

/**
 * Constants of the catalog module (FEATURE tier): editorial content limits, formats, photo paths, estimation factors.
 * Error messages are in {@link CatalogMessages}.
 */
public final class CatalogConstants {

    /** A slug id: lowercase, digits, joined by hyphens. */
    public static final String SLUG_REGEX = "[a-z0-9]+(-[a-z0-9]+)*";

    /** Maximum length of a place id. */
    public static final int PLACE_ID_MAX_LENGTH = 60;

    /** Maximum length of a place name. */
    public static final int NAME_MAX_LENGTH = 120;

    /** Maximum length of an area name. */
    public static final int AREA_MAX_LENGTH = 80;

    /** The address of a service read from the source, not shortened to a regional center. */
    public static final int VENUE_ADDRESS_MAX_LENGTH = 240;

    /** The limits of contact information and opening schedule that the establishment or the profile source published. */
    public static final int VENUE_PHONE_MAX_LENGTH = 60;
    public static final int VENUE_HOURS_MAX_LENGTH = 1000;
    public static final int VENUE_PRICE_NOTE_MAX_LENGTH = 240;

    /** Maximum length of the highlight sentence. */
    public static final int HOOK_MAX_LENGTH = 240;

    /** Maximum length of the season label. */
    public static final int BEST_LABEL_MAX_LENGTH = 60;

    /** Maximum length of the visit duration. */
    public static final int DURATION_MAX_LENGTH = 40;

    /** Maximum length of the difficulty label. */
    public static final int DIFFICULTY_MAX_LENGTH = 20;

    /** Maximum length of a reason (suggestion label, best time of day). */
    public static final int REASON_MAX_LENGTH = 240;

    /** Maximum number of photos of a place. */
    public static final int MAX_PHOTOS_PER_PLACE = 8;

    /** A photo caption that states the year taken or a hotel photo that contains a restaurant. */
    public static final int PHOTO_CAPTION_MAX_LENGTH = 240;

    /** The external photo servers allowed to be hotlinked (DR-034); must match the CSP img-src in HttpConstants. */
    public static final Set<String> EXTERNAL_PHOTO_HOSTS = Set.of("images.unsplash.com");

    /** Maximum number of moments of a destination (DR-034). */
    public static final int MAX_MOMENTS_PER_DESTINATION = 24;

    /** The server allowed for the moment author's profile link. */
    public static final String MOMENT_AUTHOR_HOST = "unsplash.com";

    /** The smallest month. */
    public static final int MONTH_MIN = 1;

    /** The largest month. */
    public static final int MONTH_MAX = 12;

    /** The largest latitude in absolute value. */
    public static final double LATITUDE_LIMIT = 90;

    /** The largest longitude in absolute value. */
    public static final double LONGITUDE_LIMIT = 180;

    /** A valid photo file name: lowercase, digits, hyphens and a common image extension. */
    public static final String PHOTO_FILE_REGEX = "[a-z0-9][a-z0-9-]*\\.(jpg|jpeg|png|webp)";

    /** Optimized variant name {@code <slug>-w<width>-<hash10>.webp}: group 1 = slug (stable photo id), group 2 = pixel width. */
    public static final String PHOTO_VARIANT_REGEX = "^([a-z0-9][a-z0-9-]*)-w(\\d+)-[0-9a-f]{10}\\.webp$";

    /** Property holding the optional origin that serves the catalog photos (empty = this application). */
    public static final String PHOTO_BASE_URL_EXPRESSION = "${wander.catalog.photo-base-url:}";

    /** Accepted photo origin: https host with optional port and path, no query, fragment or credentials. */
    public static final String PHOTO_BASE_URL_REGEX = "^https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\\d{1,5})?(/[A-Za-z0-9._~/-]*)?$";

    /** Startup error for a photo origin that does not match {@link #PHOTO_BASE_URL_REGEX}; parameter: the value. */
    public static final String PHOTO_BASE_URL_INVALID = "wander.catalog.photo-base-url phải là địa chỉ https gốc (ví dụ https://photos.example.com): %s";

    /** URL path separator. */
    public static final String URL_SEPARATOR = "/";

    /** One {@code srcset} entry: URL and its pixel width descriptor. */
    public static final String SRCSET_ENTRY_FORMAT = "%s %dw";

    /** Separator between {@code srcset} entries. */
    public static final String SRCSET_SEPARATOR = ", ";

    /** A photo source link must start with this prefix. */
    public static final String HTTPS_PREFIX = "https://";
    /** The required protocol of an attribution link. */
    public static final String HTTPS_SCHEME = "https";

    /** The public path of a photo (ADR-010 section 6). */
    public static final String PHOTO_URL_PREFIX = "/catalog/photos/";

    /** The photo directory on the classpath. */
    public static final String PHOTO_CLASSPATH_DIR = "catalog/photos/";

    /** The location of the destination files on the classpath and the default of the configuration {@code wander.catalog.location}. */
    public static final String LOCATION_EXPRESSION = "${wander.catalog.location:classpath*:catalog/*.json}";

    /** The maximum number of places previewed on a destination card. */
    public static final int PREVIEW_PLACE_COUNT = 3;

    /** Where to look for the sample-itinerary files (one file per destination {@code catalog/templates/<id>.json}); configurable so tests use their own data. */
    public static final String TEMPLATES_LOCATION_EXPRESSION = "${wander.catalog.templates-location:classpath*:catalog/templates/*.json}";

    /** A sample-itinerary id: a slug of lowercase letters, digits and hyphens. */
    public static final String TEMPLATE_ID_REGEX = "^[a-z0-9]+(-[a-z0-9]+)*$";

    /** Maximum length of a sample-itinerary id. */
    public static final int TEMPLATE_ID_MAX_LENGTH = 60;

    /** Maximum length of a sample-itinerary name. */
    public static final int TEMPLATE_TITLE_MAX_LENGTH = 120;

    /** Maximum length of the description and notes of a sample itinerary. */
    public static final int TEMPLATE_TEXT_MAX_LENGTH = 400;

    /** The maximum number of days of a sample itinerary (matches the UI's defensive ceiling). */
    public static final int TEMPLATE_MAX_DAYS = 30;

    /** The maximum length of a destination search string; the excess is cut. */
    public static final int SEARCH_QUERY_MAX_LENGTH = 80;

    /** The Unicode pattern of combining marks, removed when normalizing the search string. */
    public static final String COMBINING_MARKS_REGEX = "\\p{M}+";

    /** The factor of the real route against the straight line (winding mountain roads); an unverified assumption. */
    public static final double ROAD_FACTOR = 1.5;

    /** The assumed motorbike speed, km/h; an unverified assumption. */
    public static final double SPEED_KMH = 25;

    /** The Earth's radius, km, for the haversine formula. */
    public static final double EARTH_RADIUS_KM = 6371.0;

    /** The number of minutes in an hour. */
    public static final int MINUTES_PER_HOUR = 60;

    private CatalogConstants() {
    }
}
