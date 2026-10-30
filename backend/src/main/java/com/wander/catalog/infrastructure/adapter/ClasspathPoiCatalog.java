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

/** Adapter JSON chỉ đọc; không truy cập mạng và từ chối batch hỏng ngay lúc khởi động. */
@Component
public class ClasspathPoiCatalog implements PoiCatalog {
    private final Map<String, PoiCollection> byDestination;

    /** Nạp tài nguyên POI và đối chiếu tâm với mốc chính trong catalog hiện có. */
    public ClasspathPoiCatalog(@Value(PoiConstants.LOCATION) String pattern, PlaceCatalog destinations) {
        this.byDestination = loadAll(pattern, destinations);
    }

    @Override
    public Optional<PoiCollection> destination(String destinationId) {
        return Optional.ofNullable(destinationId == null ? null : byDestination.get(destinationId));
    }

    /** Nạp tất cả batch; trùng điểm đến hoặc tài nguyên không đọc được đều làm khởi động thất bại. */
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

    /** Đọc và kiểm phạm vi với tâm điểm đến đã có; giữ tên tệp trong lỗi khởi động. */
    private static PoiCollection readBatch(JsonMapper mapper, Resource resource, PlaceCatalog destinations) {
        try (InputStream stream = resource.getInputStream()) {
            PoiFile file = mapper.readValue(stream, PoiFile.class);
            GeoPoint center = toLocation(file.center());
            var destination = destinations.destination(file.destinationId()).orElseThrow();
            PoiValidation.require(destination.references().getFirst().location().equals(center), PoiConstants.CENTER);
            List<PoiRecord> pois = file.pois().stream().map(entry -> toRecord(file.destinationId(), entry)).toList();
            requireSnapshot(file, pois);
            return new PoiCollection(file.destinationId(), center, file.radiusM(), pois);
        } catch (IOException | RuntimeException exception) {
            throw new IllegalStateException(PoiConstants.FILE_UNREADABLE.formatted(resource.getFilename()), exception);
        }
    }

    /** Kiểm ngày nguồn của mọi trường khớp batch và số lượng sau nhập. */
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

    /** Dựng projection thuần và kiểm trạng thái khai báo khớp dữ kiện, không tự nâng xác minh. */
    private static PoiRecord toRecord(String destinationId, PoiEntry entry) {
        PlaceRecord place = new PlaceRecord(entry.id(), destinationId, entry.osmType(), entry.osmId(), entry.wikidataId(), entry.name(),
                toLocation(entry.center()), entry.coordinateKind(), entry.address(), entry.phone(), entry.website());
        PoiRecord poi = new PoiRecord(place, PoiKind.fromCode(entry.kind()), entry.openingHoursRaw(), entry.provenance(), entry.mergedFrom());
        PoiValidation.require(poi.openingHoursStatus().name().equals(entry.openingHoursStatus()), PoiConstants.HOURS);
        PoiValidation.require(poi.verificationStatus().name().equals(entry.verificationStatus()), PoiConstants.VERIFICATION);
        return poi;
    }

    /** Cặp tọa độ bắt buộc theo thứ tự lat,lon; không nhận thiếu một vế. */
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
