package com.wander.catalog.domain.port;

import com.wander.catalog.domain.model.PoiCollection;
import java.util.Optional;

/** The port that reads the broad POI set; it does not force a POI with no photo into the Discover catalog. */
public interface PoiCatalog {
    /** Reads the batch of a destination; if there is no data yet it returns an empty Optional. */
    Optional<PoiCollection> destination(String destinationId);
}
