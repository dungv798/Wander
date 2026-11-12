package com.wander.catalog.domain.port;

import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.ItineraryTemplate;
import java.util.List;
import java.util.Optional;

/**
 * The port to the venue catalog (ADR-009, ADR-010). The business logic does not know whether the source is an editorial file, Google or an admin portal.
 * Read only.
 */
public interface PlaceCatalog {

    /** Finds destinations by name/region, case- and accent-insensitive. An empty string returns all. */
    List<Destination> searchDestinations(String query);

    /** A destination by id; a null id or one not in the catalog returns empty. */
    Optional<Destination> destination(String id);

    /** The sample itineraries of a destination in editorial order; a destination with no itinerary yet or an unknown id returns an empty list. */
    List<ItineraryTemplate> templates(String destinationId);
}
