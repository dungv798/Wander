package com.wander.catalog.application.query;

import com.wander.catalog.application.view.CatalogViews;
import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.GuideSection;
import com.wander.catalog.domain.model.Moment;
import com.wander.catalog.domain.model.Photo;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.domain.model.ReferencePoint;
import com.wander.catalog.domain.model.TravelEstimate;
import com.wander.catalog.domain.model.VenueDetails;
import com.wander.catalog.domain.port.PlaceCatalog;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.shared.kernel.error.WanderException;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;

/**
 * The read side of the catalog. No transaction or aggregate: the editorial data is immutable in memory. This is where
 * 'how far' (an estimate) is computed, so the UI does not have to know the formula.
 */
@Service
public class CatalogQueries {

    private final PlaceCatalog catalog;
    private final PhotoUrls photoUrls;

    /** Takes the port to the venue catalog and the builder of photo paths. */
    public CatalogQueries(PlaceCatalog catalog, PhotoUrls photoUrls) {
        this.catalog = catalog;
        this.photoUrls = photoUrls;
    }

    /** A summary of the destinations that match the search string (empty = all). */
    public List<CatalogViews.DestinationSummary> searchDestinations(String query) {
        return catalog.searchDestinations(query).stream().map(this::toSummary).toList();
    }

    /** The detail of one destination (landmarks, guide, places); if it is not in the catalog a not-found error is thrown. */
    public CatalogViews.DestinationDetail destination(String id) {
        Destination destination = catalog.destination(id).orElseThrow(WanderException::notFound);
        return new CatalogViews.DestinationDetail(destination.id(), destination.name(), destination.region(), destination.tagline(),
                coverUrl(destination),
                destination.references().stream().map(CatalogQueries::toReferenceView).toList(),
                destination.guide().stream().map(CatalogQueries::toSectionView).toList(),
                destination.places().stream().map(place -> toPlaceView(destination, place)).toList(),
                destination.moments().stream().map(this::toMomentView).toList(), toPhotoView(coverPhoto(destination)));
    }

    /** The display form of a moment (the theme code in lowercase as in the API contract). */
    private CatalogViews.MomentView toMomentView(Moment moment) {
        return new CatalogViews.MomentView(moment.id(), moment.theme().code(), moment.theme().label(), moment.caption(),
                toPhotoView(moment.photo()), moment.authorUrl());
    }

    /** The sample itineraries of a destination in editorial order; a destination not in the catalog throws not-found, none yet returns empty. */
    public List<CatalogViews.TemplateView> templates(String destinationId) {
        catalog.destination(destinationId).orElseThrow(WanderException::notFound);
        return catalog.templates(destinationId).stream()
                .map(template -> new CatalogViews.TemplateView(template.id(), template.title(), template.summary(), template.status().code(),
                        template.days().stream().map(day -> new CatalogViews.TemplateDayView(day.placeIds(), day.note())).toList()))
                .toList();
    }

    /** The destination summary; the JSON has no center of its own so it takes the average of the places that have coordinates, and null if none has. */
    private CatalogViews.DestinationSummary toSummary(Destination destination) {
        List<Integer> bestMonths = destination.guide().stream()
                .filter(section -> section.layout() == GuideSection.Layout.MONTHS)
                .findFirst().map(GuideSection::bestMonths).orElse(List.of());
        // A preview takes only places with a real photo: a place with no photo is not faked with another place's photo.
        List<CatalogViews.Preview> previews = destination.places().stream().filter(place -> !place.photos().isEmpty()).limit(CatalogConstants.PREVIEW_PLACE_COUNT)
                .map(place -> new CatalogViews.Preview(place.id(), place.name(), photoUrls.url(place.photos().getFirst()))).toList();
        List<GeoPoint> locations = destination.places().stream().map(Place::location).filter(Objects::nonNull).toList();
        Double lat = locations.isEmpty() ? null : locations.stream().mapToDouble(GeoPoint::lat).average().orElseThrow();
        Double lon = locations.isEmpty() ? null : locations.stream().mapToDouble(GeoPoint::lon).average().orElseThrow();
        return new CatalogViews.DestinationSummary(destination.id(), destination.name(), destination.region(), destination.tagline(),
                destination.places().size(), coverUrl(destination), bestMonths, previews, lat, lon, toPhotoView(coverPhoto(destination)),
                destination.places().stream().map(place -> place.category().code()).distinct().sorted().toList());
    }

    /** The public path of the destination's cover photo (the first photo of the cover place). */
    private String coverUrl(Destination destination) {
        return photoUrls.url(coverPhoto(destination));
    }

    /** Keeps the cover photo that was chosen, and also returns the full attribution instead of only the photo path. */
    private static Photo coverPhoto(Destination destination) {
        return destination.coverPhoto() != null ? destination.coverPhoto() : destination.coverPlace().photos().getFirst();
    }

    /** The display form of a reference landmark. */
    private static CatalogViews.ReferenceView toReferenceView(ReferencePoint reference) {
        return new CatalogViews.ReferenceView(reference.id(), reference.name(), reference.location().lat(), reference.location().lon(),
                reference.approximate());
    }

    /** The display form of a guide block (the display kind in lowercase as in the API contract). */
    private static CatalogViews.GuideSectionView toSectionView(GuideSection section) {
        List<CatalogViews.GuideItemView> items = section.items().stream()
                .map(item -> new CatalogViews.GuideItemView(item.icon(), item.title(), item.text(), item.placeId())).toList();
        return new CatalogViews.GuideSectionView(section.id(), section.layout().name().toLowerCase(Locale.ROOT), section.category().code(), section.icon(),
                section.title(), section.summary(), section.bestMonths(), section.rainyMonths(), section.notes(), items);
    }

    /** The display form of a place, with the estimated distance from each reference landmark of the destination. */
    private CatalogViews.PlaceView toPlaceView(Destination destination, Place place) {
        // Order = the order of the landmarks in the data; the first landmark is the main one.
        List<CatalogViews.Away> away = place.location() == null ? List.of()
                : destination.references().stream().map(reference -> toAway(reference, place)).toList();
        List<String> slots = Stream.of(TimeSlot.values()).filter(place.bestSlots()::contains).map(TimeSlot::code).toList();
        Double lat = place.location() == null ? null : place.location().lat();
        Double lon = place.location() == null ? null : place.location().lon();
        return new CatalogViews.PlaceView(place.id(), place.name(), place.category().code(), place.category().label(), place.area(),
                place.hook(), place.summary(), lat, lon, place.bestMonths(), place.bestLabel(), place.duration(), place.difficulty(),
                place.highlights(), place.verdict().code(), place.verdict().label(), place.verdictReason(), slots, place.slotReason(),
                place.tips(), place.photos().stream().map(this::toPhotoView).toList(), away, place.wikipediaTitle(), toVenueView(place.venue()));
    }

    /** Translates an address that has a source into the read model, so the domain does not pass through the API. */
    private static CatalogViews.VenueView toVenueView(VenueDetails venue) {
        return venue == null ? null : new CatalogViews.VenueView(venue.kind().code(), venue.kind().label(), venue.address(),
                venue.website(), venue.sourceUrl(), venue.checkedAt().toString(), venue.phone(), venue.serviceHours(), venue.priceNote());
    }

    /** The estimated distance from a reference landmark to the place. */
    private static CatalogViews.Away toAway(ReferencePoint reference, Place place) {
        TravelEstimate estimate = TravelEstimate.between(reference.location(), place.location());
        return new CatalogViews.Away(reference.id(), reference.name(), estimate.roadKm(), estimate.minutes(), reference.approximate());
    }

    /** The display form of a photo with its attribution. */
    private CatalogViews.PhotoView toPhotoView(Photo photo) {
        return new CatalogViews.PhotoView(photoUrls.url(photo), photo.author(), photo.license(), photo.sourceUrl(), photo.caption(), photo.authorUrl(),
                photo.id(), photoUrls.thumbUrl(photo), photoUrls.srcSet(photo));
    }
}
