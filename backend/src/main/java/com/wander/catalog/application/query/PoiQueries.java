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

/** Phía đọc POI snapshot, tìm gần nhất mà không nạp aggregate hay sửa lịch. */
@Service
public class PoiQueries {
    private final PoiCatalog catalog;

    /** Nhận cổng đọc bất biến của POI. */
    public PoiQueries(PoiCatalog catalog) {
        this.catalog = catalog;
    }

    /** Lọc bán kính trên số mét chưa làm tròn, hòa khoảng cách theo id; chưa có batch trả rỗng. */
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

    /** Chiếu trường cần cho danh sách; khoảng cách chim bay, không phải quãng đường chỉ dẫn. */
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
