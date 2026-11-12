package com.wander.shared.web.config;

import java.time.Duration;

/** Constants specific to serving the static UI and the venue-catalog photos ({@link WebConfig}). */
final class StaticWebConstants {

    /** Path pattern of the venue-catalog photos (ADR-010). */
    static final String PHOTO_URL_PATTERN = "/catalog/photos/**";

    /** Location of the venue-catalog photos on the classpath. */
    static final String PHOTO_CLASSPATH_LOCATION = "classpath:/catalog/photos/";

    /**
     * Public cache lifetime of catalog photos: one year plus {@code immutable}. Safe because every photo file name carries a hash
     * of its content (see tools/catalog/optimize-photos.mjs); a changed image gets a new name.
     */
    static final Duration PHOTO_CACHE_DURATION = Duration.ofDays(365);

    /** Pattern that matches every remaining path (for the UI). */
    static final String ALL_PATHS_PATTERN = "/**";

    /** The root path of the site. */
    static final String ROOT_PATH = "/";

    /** The entry file of the UI. */
    static final String INDEX_FILE_NAME = "index.html";

    /** Name of the view that forwards internally to the UI's entry file. */
    static final String INDEX_FORWARD_VIEW = "forward:/index.html";

    /** A dot in the last segment means a file request, not an SPA route. */
    static final String FILE_EXTENSION_SEPARATOR = ".";

    private StaticWebConstants() {
    }
}
