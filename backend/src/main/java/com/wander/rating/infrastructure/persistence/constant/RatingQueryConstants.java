package com.wander.rating.infrastructure.persistence.constant;

/** The rating queries (JPQL and plain SQL for operations that need one atomic statement). */
public final class RatingQueryConstants {

    /** The average score of a venue. */
    public static final String AVERAGE_STARS = "select avg(r.stars) from PlaceRatingEntity r where r.placeRef = :ref";

    /** Comments that are not hidden (fewer than the threshold of different reporters), newest first. */
    public static final String VISIBLE_COMMENTS = "select r from PlaceRatingEntity r where r.placeRef = :ref and r.comment is not null "
            + "and (select count(p) from RatingReportEntity p where p.ratingId = r.id) < :threshold order by r.updatedAt desc";

    /** Writes or updates the identity's score for the venue in one statement; unique key (identity_id, place_ref). */
    public static final String UPSERT_RATING = "INSERT INTO place_ratings (id, identity_id, place_ref, stars, comment, created_at, updated_at) "
            + "VALUES (:id, :identity, :ref, :stars, CAST(:comment AS varchar), :now, :now) "
            + "ON CONFLICT (identity_id, place_ref) DO UPDATE SET stars = EXCLUDED.stars, comment = EXCLUDED.comment, "
            + "updated_at = EXCLUDED.updated_at";

    /** Deletes the reports of a comment when the author saves it with DIFFERENT content (the old reports were aimed at the old content); kept when only the stars change or the same old text is sent again. */
    public static final String CLEAR_REPORTS_OF_RATING = "DELETE FROM place_rating_reports WHERE rating_id IN "
            + "(SELECT id FROM place_ratings WHERE identity_id = :identity AND place_ref = :ref "
            + "AND comment IS DISTINCT FROM CAST(:comment AS varchar))";

    /** Records a report, ignored if this person has already reported that comment or the author deleted the comment in the meantime (no foreign-key error). */
    public static final String INSERT_REPORT = "INSERT INTO place_rating_reports (rating_id, reporter_id, created_at) "
            + "SELECT :rating, :reporter, :now WHERE EXISTS (SELECT 1 FROM place_ratings WHERE id = :rating) "
            + "ON CONFLICT (rating_id, reporter_id) DO NOTHING";

    private RatingQueryConstants() {
    }
}
