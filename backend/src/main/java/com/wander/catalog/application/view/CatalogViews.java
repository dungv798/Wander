package com.wander.catalog.application.view;

import java.util.List;

/** The read model of the catalog: a flat form for the API, not exposing domain types. Field names match {@code web/src/api.ts}. */
public final class CatalogViews {

    private CatalogViews() {
    }

    /** The photo and name of a representative place, to draw the Discover screen without loading the whole destination. */
    public record Preview(String placeId, String name, String url) {
    }

    public record DestinationSummary(String id, String name, String region, String tagline, int placeCount, String coverUrl, List<Integer> bestMonths,
                                     List<Preview> previews, Double lat, Double lon, PhotoView coverPhoto, List<String> categories) {
    }

    /**
     * A photo with attribution. {@code id} is the stable photo identifier (trip covers store it), {@code thumbUrl} the 480 px
     * variant and {@code srcSet} the ready-made {@code srcset} value; the last three are {@code null} when not applicable.
     */
    public record PhotoView(String url, String author, String license, String sourceUrl, String caption, String authorUrl,
                            String id, String thumbUrl, String srcSet) {
    }

    /** The estimated distance from a reference landmark. {@code approximate} = the landmark's coordinates are not verified. */
    public record Away(String refId, String refName, int km, int minutes, boolean approximate) {
    }

    public record PlaceView(
            String id, String name, String category, String categoryName, String area, String hook, String summary,
            Double lat, Double lon, List<Integer> bestMonths, String bestLabel, String duration, String difficulty,
            List<String> highlights, String verdict, String verdictLabel, String verdictReason, List<String> bestSlots, String slotReason,
            List<String> tips, List<PhotoView> photos, List<Away> away, String wikipediaTitle, VenueView venue) {
    }

    public record VenueView(String kind, String kindName, String address, String website, String sourceUrl, String checkedAt,
                            String phone, String serviceHours, String priceNote) {
    }

    public record GuideItemView(String icon, String title, String text, String placeId) {
    }

    public record GuideSectionView(
            String id, String layout, String category, String icon, String title, String summary,
            List<Integer> bestMonths, List<Integer> rainyMonths, List<String> notes, List<GuideItemView> items) {
    }

    /** A reference landmark for computing distance; it has coordinates so the UI can draw a small map. {@code approximate} = coordinates not verified. */
    /** One day of a sample itinerary: the place ids in visiting order (joined with the destination's places by the caller) and an editorial note. */
    public record TemplateDayView(List<String> placeIds, String note) {
    }

    /** The sample itinerary of a destination (N-2). {@code status} is the review code ({@code draft}/{@code approved}); it has no times, prices or ratings. */
    public record TemplateView(String id, String title, String summary, String status, List<TemplateDayView> days) {
    }

    public record ReferenceView(String id, String name, double lat, double lon, boolean approximate) {
    }

    /** A life moment of a destination (DR-034): an atmosphere photo with a theme, a caption and attribution. */
    public record MomentView(String id, String theme, String themeLabel, String caption, PhotoView photo, String authorUrl) {
    }

    public record DestinationDetail(
            String id, String name, String region, String tagline, String coverUrl, List<ReferenceView> references,
            List<GuideSectionView> guide, List<PlaceView> places, List<MomentView> moments, PhotoView coverPhoto) {
    }
}
