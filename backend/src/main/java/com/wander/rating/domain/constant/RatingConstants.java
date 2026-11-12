package com.wander.rating.domain.constant;

/** Constants of Wander rating (DR-032). */
public final class RatingConstants {

    /** The lowest score. */
    public static final int STARS_MIN = 1;

    /** The highest score. */
    public static final int STARS_MAX = 5;

    /** Maximum length of a comment, in code points (matches the DB column length). */
    public static final int COMMENT_MAX_LENGTH = 280;

    /** Maximum length of a venue id (matches the DB column length). */
    public static final int PLACE_REF_MAX_LENGTH = 64;

    /** A valid venue id: letters, digits and : _ . - up to 64 characters (the POI/venue id in the catalog). */
    public static final String PLACE_REF_REGEX = "^[A-Za-z0-9:_.-]{1,64}$";

    /** The number of different reporters that hides a comment. */
    public static final int REPORT_HIDE_THRESHOLD = 3;

    /** The number of newest comments returned for a venue. */
    public static final int COMMENTS_PAGE_SIZE = 10;

    /** The maximum number of venues one identity may rate (stops filling the DB with arbitrary venue ids). */
    public static final int MAX_RATINGS_PER_IDENTITY = 1000;

    /** The factor that rounds the average score to one decimal place. */
    public static final double AVERAGE_ROUNDING_FACTOR = 10.0;

    private RatingConstants() {
    }
}
