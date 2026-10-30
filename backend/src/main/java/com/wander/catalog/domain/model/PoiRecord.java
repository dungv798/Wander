package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.catalog.domain.vocabulary.OpeningHoursStatus;
import com.wander.catalog.domain.vocabulary.PoiKind;
import com.wander.catalog.domain.vocabulary.PoiVerificationStatus;
import com.wander.shared.kernel.constant.CommonConstants;
import java.util.List;
import java.util.Map;

/** Projection POI không cần ảnh/rating; mọi dữ kiện có giá trị phải có bằng chứng cùng nguồn. */
public record PoiRecord(PlaceRecord place, PoiKind kind, String openingHoursRaw,
                        Map<String, FieldProvenance> provenance, List<OsmReference> mergedFrom) {
    public PoiRecord {
        PoiValidation.require(place != null, PoiConstants.ID);
        PoiValidation.require(kind != null, PoiConstants.KIND);
        PoiValidation.require(openingHoursRaw == null || !openingHoursRaw.isBlank(), PoiConstants.HOURS);
        PoiValidation.require(provenance != null, PoiConstants.PROVENANCE);
        provenance = Map.copyOf(provenance);
        mergedFrom = List.copyOf(mergedFrom);
        requireEvidence(place, openingHoursRaw, provenance);
    }

    /** Trạng thái chỉ phản ánh có raw; không đọc hoặc parse lịch mở cửa. */
    public OpeningHoursStatus openingHoursStatus() {
        return openingHoursRaw == null ? OpeningHoursStatus.UNKNOWN : OpeningHoursStatus.RAW;
    }

    /** Lát đầu luôn chưa xác minh, kể cả khi nguồn có giờ hoặc liên hệ. */
    public PoiVerificationStatus verificationStatus() {
        return PoiVerificationStatus.SNAPSHOT_UNVERIFIED;
    }

    /** Bắt buộc provenance cho các giá trị thực sự có, cùng đối tượng OSM đang được chọn. */
    private static void requireEvidence(PlaceRecord place, String raw, Map<String, FieldProvenance> evidence) {
        requireField(evidence, PoiConstants.OSM_TYPE, place.osmType(), place);
        requireField(evidence, PoiConstants.OSM_ID, place.osmId(), place);
        requireField(evidence, PoiConstants.COORDINATE_KIND, place.coordinateKind(), place);
        requireField(evidence, PoiConstants.NAME, place.name(), place);
        requireField(evidence, PoiConstants.KIND, place, place);
        requireField(evidence, PoiConstants.CENTER, place.location(), place);
        requireField(evidence, PoiConstants.ADDRESS, place.address(), place);
        requireField(evidence, PoiConstants.HOURS, raw, place);
        requireField(evidence, PoiConstants.PHONE, place.phone(), place);
        requireField(evidence, PoiConstants.WEBSITE, place.website(), place);
        requireField(evidence, PoiConstants.WIKIDATA_ID, place.wikidataId(), place);
    }

    /** Không nhận bằng chứng của cơ sở khác hoặc gán nguồn cho dữ kiện đang thiếu. */
    private static void requireField(Map<String, FieldProvenance> evidence, String field, Object value, PlaceRecord place) {
        if (value == null) {
            PoiValidation.require(!evidence.containsKey(field), PoiConstants.PROVENANCE);
            return;
        }
        FieldProvenance source = evidence.get(field);
        PoiValidation.require(source != null, PoiConstants.PROVENANCE);
        String url = PoiConstants.OSM_URL + place.osmType() + CommonConstants.SLASH + place.osmId();
        PoiValidation.require(url.equals(source.sourceUrl()), PoiConstants.PROVENANCE);
    }
}
