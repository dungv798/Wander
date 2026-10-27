package com.wander.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.rule.SearchText;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.catalog.domain.vocabulary.Verdict;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CatalogDomainTest {

    private static Photo photo() {
        return new Photo("a-1.jpg", "Tác giả", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:A.jpg");
    }

    private static Place place(String id, List<Photo> photos) {
        return new Place(id, "ha-giang", "Tên " + id, PlaceCategory.CANH, "Mèo Vạc", "Một câu điểm nhấn", "Giới thiệu", new GeoPoint(23.1, 105.3),
                List.of(9, 10), "Tháng 9–10", "2 giờ", "Dễ", List.of("a", "b"), Verdict.MUST_SEE, "Lý do", Set.of(TimeSlot.MORNING), "Buổi sáng", List.of("mẹo"), photos, "Bài");
    }

    @Test
    @DisplayName("địa điểm phải có ít nhất một ảnh (spec §3: không có thẻ trống)")
    void placeNeedsPhoto() {
        assertThatThrownBy(() -> place("deo-ma-pi-leng", List.of())).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ít nhất một ảnh");
        assertThat(place("deo-ma-pi-leng", List.of(photo())).photos()).hasSize(1);
    }

    @Test
    @DisplayName("ảnh bắt buộc đủ tác giả, giấy phép, liên kết https và tên tệp không chứa đường dẫn")
    void photoNeedsAttribution() {
        assertThatThrownBy(() -> new Photo("a.jpg", "", "CC BY", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("a.jpg", "T", "", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("a.jpg", "T", "CC BY", "http://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("../etc/passwd", "T", "CC BY", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("a/b.jpg", "T", "CC BY", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("ảnh có dấu.jpg", "T", "CC BY", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("a.svg", "T", "CC BY", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("tháng ngoài 1..12 và mã không phải slug bị từ chối")
    void placeValidatesMonthsAndId() {
        assertThatThrownBy(() -> new Place("ok-id", "ha-giang", "T", PlaceCategory.CANH, "K", "h", "", null, List.of(13), "m", "d", "Dễ", List.of(), Verdict.WORTH_IT, "r", Set.of(), "s", List.of(), List.of(photo()), "w"))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Tháng");
        assertThatThrownBy(() -> place("Có Dấu", List.of(photo()))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("điểm đến: mã địa điểm không trùng, ảnh bìa và cẩm nang phải trỏ tới địa điểm có thật")
    void destinationIntegrity() {
        var ref = new ReferencePoint("hub", "TP Hà Giang", new GeoPoint(22.8, 105.0), true);
        Place a = place("aaa", List.of(photo())), b = place("bbb", List.of(photo()));
        assertThatThrownBy(() -> new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(), List.of(a, a))).hasMessageContaining("Trùng");
        assertThatThrownBy(() -> new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "zzz", List.of(ref), List.of(), List.of(a, b))).hasMessageContaining("bìa");
        var section = new GuideSection("thien", GuideSection.Layout.PLACES, PlaceCategory.CANH, "trees", "Thiên nhiên", "s", List.of(), List.of(), List.of(),
                List.of(new GuideItem("", "x", "", "khong-co")));
        assertThatThrownBy(() -> new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(section), List.of(a, b))).hasMessageContaining("không có");
        assertThat(new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "bbb", List.of(ref), List.of(), List.of(a, b)).coverPlace().id()).isEqualTo("bbb");
    }

    @Test
    @DisplayName("khối cẩm nang: một tháng không thể vừa đẹp nhất vừa mưa nhiều")
    void guideMonthsDoNotOverlap() {
        assertThatThrownBy(() -> new GuideSection("mua", GuideSection.Layout.MONTHS, PlaceCategory.CANH, "", "Mùa", "s", List.of(9, 10), List.of(9), List.of(), List.of()))
                .hasMessageContaining("vừa đẹp nhất vừa mưa nhiều");
    }

    @Test
    @DisplayName("ước tính đi lại: haversine x 1,5 chia 25 km/h; cùng điểm vẫn tối thiểu 1 km")
    void travelEstimate() {
        GeoPoint a = new GeoPoint(21.0, 105.0), b = new GeoPoint(22.0, 105.0); // ~111,2 km chim bay
        assertThat(TravelEstimate.airKm(a, b)).isBetween(110.0, 112.5);
        TravelEstimate t = TravelEstimate.between(a, b);
        assertThat(t.roadKm()).isBetween(165, 169);
        assertThat(t.minutes()).isBetween(395, 410);
        assertThat(TravelEstimate.between(a, a).roadKm()).isEqualTo(1);
    }

    @Test
    @DisplayName("tìm kiếm không phân biệt hoa thường và dấu tiếng Việt, kể cả đ")
    void searchTextNormalizes() {
        assertThat(SearchText.normalize("  Hà Giang ")).isEqualTo("ha giang");
        assertThat(SearchText.normalize("Đà Lạt")).isEqualTo("da lat");
        assertThat(SearchText.normalize(null)).isEmpty();
    }
}
