package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.rule.PoiValidation;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.time.DateTimeException;
import java.time.Instant;

/** Bằng chứng cho một trường trong snapshot; ngày chụp dữ liệu khác ngày xác minh hiện trạng. */
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
        // Đã kiểm bằng hằng số: dùng lại đúng một đối tượng thay vì hàng trăm nghìn bản sao do trình đọc JSON tạo ra (tiết kiệm heap).
        sourceKind = PoiConstants.OSM;
        license = PoiConstants.LICENSE;
        licenseUrl = PoiConstants.LICENSE_URL;
        attribution = PoiConstants.ATTRIBUTION;
        snapshotAt = snapshotAt.intern();
        osmTimestamp = osmTimestamp.intern();
    }

    /** Từ chối ngày snapshot sai bằng lỗi miền thay vì tự dùng thời gian hiện tại. */
    private static void requireTimestamp(String value) {
        try {
            Instant.parse(value);
        } catch (DateTimeException exception) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, PoiConstants.PROVENANCE);
        }
    }
}
