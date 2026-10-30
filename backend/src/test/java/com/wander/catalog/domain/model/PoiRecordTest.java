package com.wander.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.vocabulary.OpeningHoursStatus;
import com.wander.catalog.domain.vocabulary.PoiKind;
import com.wander.shared.kernel.error.WanderException;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Bất biến POI thuần Java; không suy ra giờ hoạt động từ snapshot. */
class PoiRecordTest {
    /** Kiểm khoảng cách không vượt phạm vi batch, kể cả trường hợp sát biên. */
    @Test
    @DisplayName("POI phải nằm trong bán kính điểm đến; sát biên được nhận")
    void destinationRadiusIsEnforced() {
        PoiRecord poi = poi(new GeoPoint(11.94, 108.44), null);
        assertThat(new PoiCollection("da-lat", poi.place().location(), 1, List.of(poi)).pois()).hasSize(1);
        assertThatThrownBy(() -> new PoiCollection("da-lat", new GeoPoint(12, 108.44), 100, List.of(poi)))
                .isInstanceOf(WanderException.class);
        double exact = TravelEstimate.airKm(new GeoPoint(11.9401, 108.44), poi.place().location()) * 1000;
        assertThat(new PoiCollection("da-lat", new GeoPoint(11.9401, 108.44), exact, List.of(poi)).pois()).hasSize(1);
        assertThatThrownBy(() -> new PoiCollection("da-lat", poi.place().location(), Double.NaN, List.of(poi)))
                .isInstanceOf(WanderException.class);
    }

    /** Kiểm nhóm loại thực sự được phép phục vụ mỗi bộ lọc. */
    @Test
    @DisplayName("loại lạ bị từ chối; rest chọn cafe, food chỉ food và fast_food")
    void kindsAreExplicit() {
        assertThatThrownBy(() -> PoiKind.fromCode("hotel")).isInstanceOf(WanderException.class);
        assertThat(PoiKind.CAFE.matches("rest")).isTrue();
        assertThat(PoiKind.CAFE.matches("food")).isFalse();
        assertThat(PoiKind.FAST_FOOD.matches("food")).isTrue();
        assertThat(PoiKind.BAR.matches("rest")).isFalse();
        assertThat(PoiKind.OTHER.matches("all")).isTrue();
        assertThat(PoiKind.OTHER.matches("hotel")).isFalse();
        for (PoiKind kind : PoiKind.values()) assertThat(PoiKind.fromCode(kind.code())).isEqualTo(kind);
    }

    /** Phân biệt dữ kiện thiếu với raw chưa được đánh giá. */
    @Test
    @DisplayName("giờ thiếu là UNKNOWN; giờ có giữ nguyên, không kết luận đang mở")
    void hoursStayRaw() {
        assertThat(poi(new GeoPoint(11.94, 108.44), null).openingHoursStatus()).isEqualTo(OpeningHoursStatus.UNKNOWN);
        PoiRecord raw = poi(new GeoPoint(11.94, 108.44), " 24/7 ");
        assertThat(raw.openingHoursRaw()).isEqualTo(" 24/7 ");
        assertThat(raw.openingHoursStatus()).isEqualTo(OpeningHoursStatus.RAW);
        assertThat(raw.verificationStatus().name()).isEqualTo("SNAPSHOT_UNVERIFIED");
    }

    /** Từ chối dữ kiện không có nguồn cùng cơ sở hoặc phá tính duy nhất. */
    @Test
    @DisplayName("không nhận loại rỗng, thiếu provenance, bằng chứng sai cơ sở hoặc collection lặp")
    void inconsistentRecordsAreRejected() {
        PoiRecord valid = poi(new GeoPoint(11.94, 108.44), null);
        assertThatThrownBy(() -> new PoiRecord(valid.place(), null, null, valid.provenance(), List.of()))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new PoiRecord(valid.place(), PoiKind.FOOD, null, Map.of(), List.of()))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new PoiRecord(valid.place(), PoiKind.FOOD, " ", valid.provenance(), List.of()))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new PoiRecord(valid.place(), PoiKind.FOOD, "24/7", valid.provenance(), List.of()))
                .isInstanceOf(WanderException.class);
        var evidence = new java.util.HashMap<>(valid.provenance());
        evidence.put("phone", evidence.get("name"));
        assertThatThrownBy(() -> new PoiRecord(valid.place(), PoiKind.FOOD, null, evidence, List.of()))
                .isInstanceOf(WanderException.class);
        evidence.remove("phone");
        evidence.put("name", new FieldProvenance("OSM", "https://www.openstreetmap.org/node/2",
                "2026-10-29T02:34:26.802Z", "2026-10-29T02:23:30Z", "ODbL-1.0",
                "https://www.openstreetmap.org/copyright", "© OpenStreetMap contributors"));
        assertThatThrownBy(() -> new PoiRecord(valid.place(), PoiKind.FOOD, null, evidence, List.of()))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new PoiCollection("da-lat", valid.place().location(), 15000, List.of(valid, valid)))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> new PoiCollection("ha-giang", valid.place().location(), 15000, List.of(valid)))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> valid.provenance().clear()).isInstanceOf(UnsupportedOperationException.class);
    }

    /** Kiểm namespace nguồn và cặp tọa độ bắt buộc. */
    @Test
    @DisplayName("slug/OSM/QID/tọa độ sai bị từ chối; không giả định một số OSM là đủ định danh")
    void identityAndCoordinatesAreChecked() {
        for (String id : List.of("Tên Quán", "", "x".repeat(61))) {
            assertThatThrownBy(() -> place(id, "node", 1, null, new GeoPoint(11.94, 108.44)))
                    .isInstanceOf(WanderException.class);
        }
        assertThatThrownBy(() -> place("poi-1", "hotel", 1, null, new GeoPoint(11.94, 108.44)))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> place("poi-1", "node", 0, null, new GeoPoint(11.94, 108.44)))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> place("poi-1", "node", 1, "brand", new GeoPoint(11.94, 108.44)))
                .isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> place("poi-1", "node", 1, null, null)).isInstanceOf(WanderException.class);
        assertThat(place("poi-1", "way", 1, "Q123", new GeoPoint(11.94, 108.44)).osmType()).isEqualTo("way");
        assertThatThrownBy(() -> new GeoPoint(Double.NaN, 108)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new GeoPoint(11, Double.POSITIVE_INFINITY)).isInstanceOf(IllegalArgumentException.class);
    }

    /** Không chấp nhận provenance sai định dạng hoặc giấy phép nguồn. */
    @Test
    @DisplayName("provenance sai ngày hoặc giấy phép không được coi là nguồn đã kiểm chứng")
    void provenanceMetadataIsRequired() {
        for (String timestamp : List.of("", "hôm qua")) {
            assertThatThrownBy(() -> new FieldProvenance("OSM", "https://www.openstreetmap.org/node/1",
                    timestamp, "2026-10-29T02:23:30Z", "ODbL-1.0", "https://www.openstreetmap.org/copyright",
                    "© OpenStreetMap contributors")).isInstanceOf(WanderException.class);
        }
        assertThatThrownBy(() -> new FieldProvenance("OSM", "https://www.openstreetmap.org/node/1",
                "2026-10-29T02:34:26.802Z", "2026-10-29T02:23:30Z", "CC0", "https://www.openstreetmap.org/copyright",
                "© OpenStreetMap contributors")).isInstanceOf(WanderException.class);
    }

    /** Dựng phần danh tính với những trường tối thiểu để kiểm bất biến. */
    private static PlaceRecord place(String id, String type, long osmId, String qid, GeoPoint location) {
        return new PlaceRecord(id, "da-lat", type, osmId, qid, "Quán", location, "point", null, null, null);
    }

    /** Tạo bản ghi có đủ bằng chứng tổng hợp cho các trường bắt buộc. */
    private static PoiRecord poi(GeoPoint location, String hours) {
        var evidence = new FieldProvenance("OSM", "https://www.openstreetmap.org/node/1",
                "2026-10-29T02:34:26.802Z", "2026-10-29T02:23:30Z", "ODbL-1.0",
                "https://www.openstreetmap.org/copyright", "© OpenStreetMap contributors");
        var provenance = new java.util.HashMap<>(Map.of("name", evidence, "kind", evidence, "center", evidence,
                "osmType", evidence, "osmId", evidence, "coordinateKind", evidence));
        if (hours != null) provenance.put("openingHoursRaw", evidence);
        return new PoiRecord(new PlaceRecord("poi-da-lat-node-1", "da-lat", "node", 1, null,
                "Quán", location, "point", null, null, null), PoiKind.FOOD, hours, provenance, List.of());
    }
}
