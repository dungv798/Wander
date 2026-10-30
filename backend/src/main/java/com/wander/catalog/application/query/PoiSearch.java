package com.wander.catalog.application.query;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.PoiConstants;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.util.Set;

/** Đầu vào truy vấn đã kiểm định dạng và giới hạn; null near dùng tâm batch. */
public record PoiSearch(String kind, GeoPoint near, int radiusM, int limit) {
    public PoiSearch {
        if (kind == null || !Set.of(PoiConstants.FOOD, PoiConstants.CAFE, PoiConstants.REST, PoiConstants.ALL).contains(kind)) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, PoiConstants.KIND);
        }
        requireRange(radiusM, PoiConstants.MAX_RADIUS_M, PoiConstants.RADIUS_M);
        requireRange(limit, PoiConstants.MAX_LIMIT, PoiConstants.LIMIT);
    }

    /** Chuyển chuỗi query sang giá trị hữu hạn; lỗi luôn có mã/trường và không rơi vào 500. */
    public static PoiSearch parse(String kind, String near, String radiusM, String limit) {
        return new PoiSearch(kind == null ? PoiConstants.ALL : requireLength(kind, PoiConstants.KIND), parseNear(near),
                parseInteger(radiusM, PoiConstants.DEFAULT_RADIUS_M, PoiConstants.RADIUS_M),
                parseInteger(limit, PoiConstants.DEFAULT_LIMIT, PoiConstants.LIMIT));
    }

    /** Tách đúng hai số theo lat,lon; không nhận NaN, vô cực hoặc tọa độ ngoài WGS-84. */
    private static GeoPoint parseNear(String near) {
        if (near == null) return null;
        String[] parts = requireLength(near, PoiConstants.NEAR).split(CommonConstants.COMMA, -1);
        if (parts.length != 2) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PoiConstants.NEAR);
        try {
            double lat = Double.parseDouble(parts[0]);
            double lon = Double.parseDouble(parts[1]);
            boolean latitudeValid = Double.isFinite(lat) && Math.abs(lat) <= CatalogConstants.LATITUDE_LIMIT;
            boolean longitudeValid = Double.isFinite(lon) && Math.abs(lon) <= CatalogConstants.LONGITUDE_LIMIT;
            if (!latitudeValid || !longitudeValid) throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, PoiConstants.NEAR);
            return new GeoPoint(lat, lon);
        } catch (NumberFormatException exception) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, PoiConstants.NEAR);
        }
    }

    /** Đọc số nguyên thập phân; không âm, không số lẻ, không tràn int. */
    private static int parseInteger(String raw, int defaultValue, String field) {
        if (raw == null) return defaultValue;
        if (!requireLength(raw, field).matches(PoiConstants.INTEGER_PATTERN)) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        }
        try {
            return Integer.parseInt(raw);
        } catch (NumberFormatException exception) {
            throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, field);
        }
    }

    /** Chặn chuỗi query quá dài trước khi split hoặc phân tích số. */
    private static String requireLength(String raw, String field) {
        if (raw.length() > PoiConstants.MAX_PARAMETER_LENGTH) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        return raw;
    }

    /** Giới hạn chặt từ 1 tới trần; không âm thầm mở rộng bán kính hoặc cắt đầu vào sai. */
    private static void requireRange(int value, int maximum, String field) {
        if (value < 1 || value > maximum) throw WanderException.invalidValue(ErrorCodes.OUT_OF_RANGE, field);
    }
}
