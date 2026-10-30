package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import com.wander.catalog.application.query.PoiQueries;
import com.wander.catalog.application.query.PoiSearch;
import com.wander.catalog.application.view.PoiViews;
import com.wander.catalog.domain.model.FieldProvenance;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.PlaceRecord;
import com.wander.catalog.domain.model.PoiCollection;
import com.wander.catalog.domain.model.PoiRecord;
import com.wander.catalog.domain.model.TravelEstimate;
import com.wander.catalog.domain.port.PoiCatalog;
import com.wander.catalog.domain.vocabulary.PoiKind;
import com.wander.shared.kernel.error.WanderException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Kiểm lựa chọn theo khoảng cách và query parser mà không cần Spring. */
class PoiQueriesTest {
    private static final GeoPoint CENTER = new GeoPoint(11.94, 108.44);

    /** Kiểm thứ tự, bán kính và limit bằng tọa độ tổng hợp đã biết. */
    @Test
    @DisplayName("haversine theo mét; lọc trước limit; hòa khoảng cách theo slug; không dùng khoảng cách đường bộ")
    void nearestWithinRadiusIsDeterministic() {
        PoiRecord far = poi(3, PoiKind.FOOD, new GeoPoint(11.941, 108.44));
        PoiRecord second = poi(2, PoiKind.CAFE, CENTER);
        PoiRecord first = poi(1, PoiKind.FOOD, CENTER);
        PoiQueries queries = queries(List.of(far, second, first));
        List<PoiViews.Candidate> all = queries.search("da-lat", PoiSearch.parse(null, null, "5000", "30"));
        assertThat(all).extracting(PoiViews.Candidate::id).containsExactly("poi-1", "poi-2", "poi-3");
        assertThat(all.getLast().distanceM()).isCloseTo(111.1949, within(0.001));
        assertThat(queries.search("da-lat", PoiSearch.parse("food", null, "5000", "1")))
                .extracting(PoiViews.Candidate::id).containsExactly("poi-1");
        double exact = TravelEstimate.airKm(CENTER, far.place().location()) * 1000;
        assertThat(queries.search("da-lat", new PoiSearch("all", CENTER, (int) Math.floor(exact), 30))).hasSize(2);
        assertThat(queries.search("da-lat", new PoiSearch("all", CENTER, (int) Math.ceil(exact), 30))).hasSize(3);
        assertThat(queries.search("da-lat", PoiSearch.parse("rest", null, null, null)))
                .extracting(PoiViews.Candidate::id).containsExactly("poi-2");
        assertThat(queries.search("da-lat", PoiSearch.parse("cafe", null, null, null)))
                .extracting(PoiViews.Candidate::id).containsExactly("poi-2");
        assertThat(queries.search("da-lat", PoiSearch.parse(null, "0,0", null, null))).isEmpty();
        assertThat(queries.search("unknown", PoiSearch.parse(null, null, null, null))).isEmpty();
    }

    /** Kiểm default và các chuỗi query không hợp lệ trước khi gọi cổng. */
    @Test
    @DisplayName("mặc định all, tâm batch, 2000 mét, 20 kết quả; từ chối chuỗi quá dài và số tràn")
    void searchParametersAreValidated() {
        PoiSearch defaults = PoiSearch.parse(null, null, null, null);
        assertThat(defaults.kind()).isEqualTo("all");
        assertThat(defaults.near()).isNull();
        assertThat(defaults.radiusM()).isEqualTo(2000);
        assertThat(defaults.limit()).isEqualTo(20);
        assertThat(PoiSearch.parse("all", "-90,180", "1", "30").near()).isEqualTo(new GeoPoint(-90, 180));
        for (String near : List.of("NaN,1", "1,Infinity", "1,2,3", "foo,bar", "1,", "91,1", "1,181", "x".repeat(81))) {
            assertThatThrownBy(() -> PoiSearch.parse(null, near, null, null)).isInstanceOf(WanderException.class);
        }
        for (String number : List.of("", "0", "-1", "1.5", "5001", "999999999999999999", "x".repeat(81))) {
            assertThatThrownBy(() -> PoiSearch.parse(null, null, number, null)).isInstanceOf(WanderException.class);
            assertThatThrownBy(() -> PoiSearch.parse(null, null, null, number)).isInstanceOf(WanderException.class);
        }
        assertThatThrownBy(() -> PoiSearch.parse("x".repeat(81), null, null, null)).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> PoiSearch.parse("hotel", null, null, null)).isInstanceOf(WanderException.class);
    }

    /** Cổng đọc tổng hợp để giữ test tập trung vào kết quả tìm kiếm. */
    private static PoiQueries queries(List<PoiRecord> pois) {
        PoiCollection batch = new PoiCollection("da-lat", CENTER, 15000, pois);
        PoiCatalog catalog = id -> "da-lat".equals(id) ? Optional.of(batch) : Optional.empty();
        return new PoiQueries(catalog);
    }

    /** Tạo POI có provenance đúng danh tính để kiểm khoảng cách độc lập dữ liệu thật. */
    private static PoiRecord poi(long id, PoiKind kind, GeoPoint location) {
        var source = new FieldProvenance("OSM", "https://www.openstreetmap.org/node/" + id,
                "2026-10-29T02:34:26.802Z", "2026-10-29T02:23:30Z", "ODbL-1.0",
                "https://www.openstreetmap.org/copyright", "© OpenStreetMap contributors");
        var place = new PlaceRecord("poi-" + id, "da-lat", "node", id, null, "Quán", location, "point", null, null, null);
        return new PoiRecord(place, kind, null, Map.of("name", source, "kind", source, "center", source,
                "osmType", source, "osmId", source, "coordinateKind", source), List.of());
    }
}
