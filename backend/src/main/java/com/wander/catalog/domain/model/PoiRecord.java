package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.catalog.domain.vocabulary.OpeningHoursStatus;
import com.wander.catalog.domain.vocabulary.PoiKind;
import com.wander.catalog.domain.vocabulary.PoiVerificationStatus;
import com.wander.shared.kernel.constant.CommonConstants;
import java.util.List;
import java.util.Map;

/** A POI projection needs no photo/rating; every fact that has a value must have evidence from the same source. */
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

    /** The status only reflects that there is a raw value; the opening hours are not read or parsed. */
    public OpeningHoursStatus openingHoursStatus() {
        return openingHoursRaw == null ? OpeningHoursStatus.UNKNOWN : OpeningHoursStatus.RAW;
    }

    /** The first slice is always unverified, even when the source has hours or contact information. */
    public PoiVerificationStatus verificationStatus() {
        return PoiVerificationStatus.SNAPSHOT_UNVERIFIED;
    }

    /** Provenance is required for values that really exist, from the same OSM object that is being chosen. */
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

    /** Does not accept evidence of another establishment or attach a source to a fact that is missing. */
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
