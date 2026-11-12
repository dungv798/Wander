package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

/** A destination (for example Ha Giang) with its set of places and its editorial guide. Small data, read as a whole. */
public record Destination(
        String id,
        String name,
        String region,
        String tagline,
        String coverPlaceId,
        List<ReferencePoint> references,
        List<GuideSection> guide,
        List<Place> places,
        List<Moment> moments,
        Photo coverPhoto) {

    /** A destination that has no moments library yet and uses the cover photo of the cover place (compatible with old data). */
    public Destination(String id, String name, String region, String tagline, String coverPlaceId, List<ReferencePoint> references,
                       List<GuideSection> guide, List<Place> places) {
        this(id, name, region, tagline, coverPlaceId, references, guide, places, List.of(), null);
    }

    /** A destination that has moments, with the cover photo taken from the cover place. */
    public Destination(String id, String name, String region, String tagline, String coverPlaceId, List<ReferencePoint> references,
                       List<GuideSection> guide, List<Place> places, List<Moment> moments) {
        this(id, name, region, tagline, coverPlaceId, references, guide, places, moments, null);
    }

    public Destination {
        CatalogValidation.require(hasIdentity(id, name, region, tagline), CatalogMessages.DESTINATION_FIELDS_MISSING);
        references = ImmutableLists.copyOrEmpty(references);
        guide = ImmutableLists.copyOrEmpty(guide);
        places = ImmutableLists.copyOrEmpty(places);
        moments = ImmutableLists.copyOrEmpty(moments);
        validateMoments(id, moments);
        CatalogValidation.require(!references.isEmpty(), CatalogMessages.DESTINATION_NEEDS_REFERENCE, id);
        CatalogValidation.require(!places.isEmpty(), CatalogMessages.DESTINATION_NEEDS_PLACE, id);
        Set<String> placeIds = collectPlaceIds(id, places);
        CatalogValidation.require(placeIds.contains(coverPlaceId), CatalogMessages.COVER_PLACE_MISSING, coverPlaceId);
        CatalogValidation.require(places.stream().anyMatch(place -> place.id().equals(coverPlaceId) && !place.photos().isEmpty()),
                CatalogMessages.COVER_PLACE_NEEDS_PHOTO, coverPlaceId);
        validateGuide(guide, placeIds);
    }

    /** A place by id in this destination; returns empty if there is none. */
    public Optional<Place> place(String placeId) {
        return places.stream().filter(place -> place.id().equals(placeId)).findFirst();
    }

    /** The place used as the cover photo of the destination. */
    public Place coverPlace() {
        return place(coverPlaceId).orElseThrow();
    }

    /** All four identifying fields (id, name, region, short description) have content. */
    private static boolean hasIdentity(String id, String name, String region, String tagline) {
        return Stream.of(id, name, region, tagline).noneMatch(Texts::isNullOrBlank);
    }

    /** The set of place ids; each place must belong to the destination {@code destinationId} and ids must not repeat. */
    private static Set<String> collectPlaceIds(String destinationId, List<Place> places) {
        Set<String> ids = new HashSet<>();
        for (Place place : places) {
            CatalogValidation.require(place.destinationId().equals(destinationId), CatalogMessages.PLACE_OF_OTHER_DESTINATION, place.id());
            CatalogValidation.require(ids.add(place.id()), CatalogMessages.PLACE_ID_DUPLICATED, place.id());
        }
        return ids;
    }

    /** The number of moments is within the limit and ids do not repeat. */
    private static void validateMoments(String destinationId, List<Moment> moments) {
        CatalogValidation.require(moments.size() <= CatalogConstants.MAX_MOMENTS_PER_DESTINATION,
                CatalogMessages.DESTINATION_TOO_MANY_MOMENTS, destinationId, CatalogConstants.MAX_MOMENTS_PER_DESTINATION);
        Set<String> ids = new HashSet<>();
        for (Moment moment : moments) {
            CatalogValidation.require(ids.add(moment.id()), CatalogMessages.MOMENT_ID_DUPLICATED, moment.id());
        }
    }

    /** Guide block ids do not repeat and every line that points to a place points to a place in the destination. */
    private static void validateGuide(List<GuideSection> guide, Set<String> placeIds) {
        Set<String> sectionIds = new HashSet<>();
        for (GuideSection section : guide) {
            CatalogValidation.require(sectionIds.add(section.id()), CatalogMessages.GUIDE_SECTION_ID_DUPLICATED, section.id());
            validateGuideLinks(section, placeIds);
        }
    }

    /** Every line of the block that has a {@code placeId} points to a place in the destination. */
    private static void validateGuideLinks(GuideSection section, Set<String> placeIds) {
        for (GuideItem item : section.items()) {
            boolean linkValid = item.placeId() == null || placeIds.contains(item.placeId());
            CatalogValidation.require(linkValid, CatalogMessages.GUIDE_LINKS_UNKNOWN_PLACE, item.placeId());
        }
    }
}
