package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.time.DateTimeException;
import java.time.Instant;

/** The evidence for a field in the snapshot; the date the data was captured differs from the date the current state was verified. */
public record FieldProvenance(String sourceKind, String sourceUrl, String snapshotAt, String osmTimestamp,
                              String license, String licenseUrl, String attribution) {
    public FieldProvenance {
        PoiValidation.require(PoiConstants.OSM.equals(sourceKind), PoiConstants.PROVENANCE);
        PoiValidation.requireText(sourceUrl, PoiConstants.PROVENANCE);
        PoiValidation.require(PoiConstants.LICENSE.equals(license), PoiConstants.PROVENANCE);
        PoiValidation.require(PoiConstants.LICENSE_URL.equals(licenseUrl), PoiConstants.PROVENANCE);
        PoiValidation.require(PoiConstants.ATTRIBUTION.equals(attribution), PoiConstants.PROVENANCE);
        PoiValidation.requireText(snapshotAt, PoiConstants.PROVENANCE);
        PoiValidation.requireText(osmTimestamp, PoiConstants.PROVENANCE);
        requireTimestamp(snapshotAt);
        requireTimestamp(osmTimestamp);
        // Checked against a constant: reuses exactly one object instead of hundreds of thousands of copies made by the JSON reader (saves heap).
        sourceKind = PoiConstants.OSM;
        license = PoiConstants.LICENSE;
        licenseUrl = PoiConstants.LICENSE_URL;
        attribution = PoiConstants.ATTRIBUTION;
        snapshotAt = snapshotAt.intern();
        osmTimestamp = osmTimestamp.intern();
    }

    /** Rejects a wrong snapshot date with a domain error instead of silently using the current time. */
    private static void requireTimestamp(String value) {
        try {
            Instant.parse(value);
        } catch (DateTimeException exception) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, PoiConstants.PROVENANCE);
        }
    }
}
