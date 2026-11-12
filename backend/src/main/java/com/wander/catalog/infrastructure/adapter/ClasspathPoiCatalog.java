package com.wander.catalog.infrastructure.adapter;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.model.FieldProvenance;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.OsmReference;
import com.wander.catalog.domain.model.PlaceRecord;
import com.wander.catalog.domain.model.PoiCollection;
import com.wander.catalog.domain.model.PoiRecord;
import com.wander.catalog.domain.port.PlaceCatalog;
import com.wander.catalog.domain.port.PoiCatalog;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.catalog.domain.vocabulary.PoiKind;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.json.JsonMapper;

/** A read-only JSON adapter; it makes no network access and rejects a broken batch right at startup. */
@Component
public class ClasspathPoiCatalog implements PoiCatalog {
    private final Map<String, PoiCollection> byDestination;

    /** Loads the POI resource and checks the center against the main landmark in the existing catalog. */
    public ClasspathPoiCatalog(@Value(PoiConstants.LOCATION) String pattern, PlaceCatalog destinations) {
        this.byDestination = loadAll(pattern, destinations);
    }

    @Override
    public Optional<PoiCollection> destination(String destinationId) {
        return Optional.ofNullable(destinationId == null ? null : byDestination.get(destinationId));
    }

    /** Loads all batches; a duplicate destination or a resource that cannot be read makes startup fail. */
    private static Map<String, PoiCollection> loadAll(String pattern, PlaceCatalog destinations) {
        JsonMapper mapper = JsonMapper.builder().enable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES).build();
        Map<String, PoiCollection> loaded = new HashMap<>();
        try {
            for (Resource resource : new PathMatchingResourcePatternResolver().getResources(pattern)) {
                PoiCollection batch = readBatch(mapper, resource, destinations);
                PoiValidation.require(loaded.put(batch.destinationId(), batch) == null, PoiConstants.DESTINATION_ID);
            }
        } catch (IOException | RuntimeException exception) {
            throw new IllegalStateException(PoiConstants.FILE_UNREADABLE.formatted(pattern), exception);
        }
        return Map.copyOf(loaded);
    }

    /** Reads and checks the range: the center must match ONE reference landmark of the destination (Ha Giang has two landmarks, DR-033); keeps the file name in the startup error. */
    private static PoiCollection readBatch(JsonMapper mapper, Resource resource, PlaceCatalog destinations) {
        try (InputStream stream = resource.getInputStream()) {
            PoiFile file = mapper.readValue(stream, PoiFile.class);
            GeoPoint center = toLocation(file.center());
            var destination = destinations.destination(file.destinationId()).orElseThrow();
            PoiValidation.require(destination.references().stream().anyMatch(reference -> reference.location().equals(center)), PoiConstants.CENTER);
            List<PoiRecord> pois = file.pois().stream().map(entry -> toRecord(file.destinationId(), entry)).toList();
            requireSnapshot(file, pois);
            return new PoiCollection(file.destinationId(), center, file.radiusM(), pois);
        } catch (IOException | RuntimeException exception) {
            throw new IllegalStateException(PoiConstants.FILE_UNREADABLE.formatted(resource.getFilename()), exception);
        }
    }

    /** Checks the source date of every field that matches the batch and the count after import. */
    private static void requireSnapshot(PoiFile file, List<PoiRecord> pois) {
        PoiValidation.require(file.statistics() != null && file.statistics().after() == pois.size(), PoiConstants.PROVENANCE);
        PoiValidation.requireText(file.notice(), PoiConstants.PROVENANCE);
        for (PoiRecord poi : pois) {
            for (FieldProvenance evidence : poi.provenance().values()) {
                PoiValidation.require(evidence.snapshotAt().equals(file.snapshotAt()), PoiConstants.PROVENANCE);
                PoiValidation.require(evidence.osmTimestamp().equals(file.osmTimestamp()), PoiConstants.PROVENANCE);
            }
        }
    }

    /** Builds a pure projection and checks that the declared status matches the facts, without raising the verification on its own. */
    private static PoiRecord toRecord(String destinationId, PoiEntry entry) {
        PlaceRecord place = new PlaceRecord(entry.id(), destinationId, entry.osmType(), entry.osmId(), entry.wikidataId(), entry.name(),
                toLocation(entry.center()), entry.coordinateKind(), entry.address(), entry.phone(), entry.website());
        PoiRecord poi = new PoiRecord(place, PoiKind.fromCode(entry.kind()), entry.openingHoursRaw(), entry.provenance(), entry.mergedFrom());
        PoiValidation.require(poi.openingHoursStatus().name().equals(entry.openingHoursStatus()), PoiConstants.HOURS);
        PoiValidation.require(poi.verificationStatus().name().equals(entry.verificationStatus()), PoiConstants.VERIFICATION);
        return poi;
    }

    /** The coordinate pair is required in lat,lon order; one half missing is not accepted. */
    private static GeoPoint toLocation(List<Double> center) {
        PoiValidation.require(center != null && center.size() == 2, PoiConstants.CENTER);
        return new GeoPoint(center.getFirst(), center.getLast());
    }

    record PoiFile(String destinationId, List<Double> center, double radiusM, String snapshotAt, String osmTimestamp,
                   String sourceBbox, String notice, ImportStatistics statistics, List<PoiEntry> pois) {
    }

    record ImportStatistics(int before, int named, int removedUnnamed, int mergedDuplicates, int after,
                            Map<String, Integer> beforeByKind, Map<String, Integer> namedByKind, Map<String, Integer> afterByKind) {
    }

    record PoiEntry(String id, String osmType, long osmId, String wikidataId, String name, String kind, List<Double> center,
                    String coordinateKind, String address, String openingHoursRaw, String openingHoursStatus, String phone, String website,
                    String verificationStatus, Map<String, FieldProvenance> provenance, List<OsmReference> mergedFrom) {
    }
}
