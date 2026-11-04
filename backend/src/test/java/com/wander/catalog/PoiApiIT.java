package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Hợp đồng POI cộng thêm, không đổi Discover và không suy đoán hiện trạng. */
class PoiApiIT extends ApiTestSupport {
    private static final String PATH = "/api/catalog/destinations/da-lat/poi";

    /** Gọi API không phiên và kiểm dữ kiện nguồn trong danh sách gần nhất. */
    @Test
    @DisplayName("POI công khai, theo mét gần nhất; có raw/unknown và ghi công, không ảnh/rating")
    void nearestPoiIsPublic() {
        Res response = call("GET", PATH + "?kind=all&near=11.94,108.44&radiusM=5000&limit=30", null);
        assertThat(response.status()).isEqualTo(200);
        assertThat(response.list("poi")).hasSize(30);
        double previous = -1;
        for (Object value : response.list("poi")) {
            Map<?, ?> poi = (Map<?, ?>) value;
            double distance = ((Number) poi.get("distanceM")).doubleValue();
            assertThat(distance).isBetween(previous, 5000.0);
            previous = distance;
            assertThat(poi.get("verificationStatus")).isEqualTo("SNAPSHOT_UNVERIFIED");
            assertThat(poi.get("openingHoursStatus")).isIn("RAW", "UNKNOWN");
            assertThat(poi.containsKey("rating") || poi.containsKey("photos")).isFalse();
            assertThat(((Map<?, ?>) poi.get("attribution")).get("license")).isEqualTo("ODbL-1.0");
        }
        assertThat(call("GET", PATH, "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA").status()).isEqualTo(200);
        assertThat(call("GET", PATH, null).list("poi")).hasSizeLessThanOrEqualTo(20).isNotEmpty();
    }

    /** Kiểm cách ánh xạ nhu cầu, bán kính, giới hạn và tính ổn định. */
    @Test
    @DisplayName("food không gồm cafe; rest dùng cafe; radius và limit lọc đúng, hòa khoảng cách ổn định")
    void filtersAreApplied() {
        for (String kind : List.of("food", "cafe", "rest")) {
            Res result = call("GET", PATH + "?kind=" + kind + "&near=11.94,108.44&radiusM=5000&limit=30", null);
            assertThat(result.status()).isEqualTo(200);
            assertThat(result.list("poi")).isNotEmpty();
            for (Object value : result.list("poi")) {
                String actual = (String) ((Map<?, ?>) value).get("kind");
                assertThat(actual).isIn(kind.equals("food") ? new String[] {"food", "fast_food"} : new String[] {"cafe"});
            }
        }
        Res first = call("GET", PATH + "?near=11.94,108.44&radiusM=5000&limit=1", null);
        assertThat(first.list("poi")).hasSize(1);
        assertThat(call("GET", PATH + "?near=11.94,108.44&radiusM=5000&limit=1", null).body()).isEqualTo(first.body());
        assertThat(call("GET", PATH + "?near=0,0&radiusM=1", null).list("poi")).isEmpty();
    }

    /** Không biến trạng thái chưa nhập POI thành lỗi tài nguyên. */
    @Test
    @DisplayName("điểm đến không có POI trả danh sách rỗng kể cả mã chưa có (Hà Giang đã có POI từ DR-033)")
    void missingPoiIsEmpty() {
        for (String id : List.of("vinh-hy-khong-co", "khong-co")) {
            Res result = call("GET", "/api/catalog/destinations/" + id + "/poi", null);
            assertThat(result.status()).isEqualTo(200);
            assertThat(result.list("poi")).isEmpty();
        }
    }

    /** Kiểm lỗi định dạng/giới hạn theo thân ApiError chung. */
    @Test
    @DisplayName("query sai trả ApiError 400 có code và field; không rơi vào 500")
    void invalidParametersHaveStableErrors() {
        for (String query : List.of("kind=hotel", "near=NaN,108", "near=91,108", "near=1,2,3", "near=abc",
                "near=1,Infinity", "radiusM=0", "radiusM=5001", "radiusM=1.5", "limit=31", "limit=-1", "limit=foo")) {
            Res result = call("GET", PATH + "?" + query, null);
            assertThat(result.status()).as(query).isEqualTo(400);
            assertThat(result.code()).isIn("MALFORMED", "OUT_OF_RANGE");
            assertThat(result.str("error.field")).isEqualTo(query.split("=")[0]);
        }
    }
}
