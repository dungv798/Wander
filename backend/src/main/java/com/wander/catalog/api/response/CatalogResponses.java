package com.wander.catalog.api.response;

import com.wander.catalog.application.view.CatalogViews;
import com.wander.catalog.application.view.PoiViews;
import java.util.List;

/** Response bodies of the read-only catalog API. Each wraps one read model under the key the web client reads. */
public final class CatalogResponses {

    private CatalogResponses() {
    }

    /** Destinations matching a search. */
    public record DestinationsResponse(List<CatalogViews.DestinationSummary> destinations) {
    }

    /** One destination with references, guide, places and moments. */
    public record DestinationResponse(CatalogViews.DestinationDetail destination) {
    }

    /** Itinerary templates of a destination (possibly empty). */
    public record TemplatesResponse(List<CatalogViews.TemplateView> templates) {
    }

    /** Points of interest near a point, ranked by distance. */
    public record PoiResponse(List<PoiViews.Candidate> poi) {
    }
}
