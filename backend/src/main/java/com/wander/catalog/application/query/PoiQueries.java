package com.wander.catalog.application.query;

import com.wander.catalog.application.view.PoiViews;
import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.model.FieldProvenance;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.PoiRecord;
import com.wander.catalog.domain.model.TravelEstimate;
import com.wander.catalog.domain.port.PoiCatalog;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

/** The read side of the POI snapshot, finding the nearest without loading an aggregate or changing the itinerary. */
@Service
public class PoiQueries {
    private final PoiCatalog catalog;

    /** Takes the immutable POI read port. */
    public PoiQueries(PoiCatalog catalog) {
        this.catalog = catalog;
    }

    /** Filters the radius on the unrounded meters, breaks distance ties by id; with no batch yet returns empty. */
    public List<PoiViews.Candidate> search(String destinationId, PoiSearch search) {
        return catalog.destination(destinationId).map(batch -> {
            GeoPoint near = search.near() == null ? batch.center() : search.near();
            return batch.pois().stream().filter(poi -> poi.kind().matches(search.kind()))
                    .map(poi -> toCandidate(poi, near))
                    .filter(poi -> poi.distanceM() <= search.radiusM())
                    .sorted(Comparator.comparingDouble(PoiViews.Candidate::distanceM).thenComparing(PoiViews.Candidate::id))
                    .limit(search.limit()).toList();
        }).orElse(List.of());
    }

    /** Projects the fields the list needs; the distance is as the crow flies, not a route distance. */
    private static PoiViews.Candidate toCandidate(PoiRecord poi, GeoPoint near) {
        var place = poi.place();
        FieldProvenance source = poi.provenance().get(PoiConstants.NAME);
        PoiViews.Attribution attribution = new PoiViews.Attribution(source.sourceKind(), source.sourceUrl(), source.snapshotAt(),
                source.license(), source.licenseUrl(), source.attribution());
        double distanceM = TravelEstimate.airKm(near, place.location()) * PoiConstants.METERS_PER_KM;
        return new PoiViews.Candidate(place.id(), place.name(), poi.kind().code(), place.location().lat(), place.location().lon(), distanceM,
                place.address(), poi.openingHoursRaw(), poi.openingHoursStatus().name(), place.phone(), place.website(),
                poi.verificationStatus().name(), attribution);
    }
}
