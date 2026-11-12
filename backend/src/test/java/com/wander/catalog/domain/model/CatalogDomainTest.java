package com.wander.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.rule.SearchText;
import com.wander.catalog.domain.vocabulary.MomentTheme;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.catalog.domain.vocabulary.Verdict;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CatalogDomainTest {
    @Test
    @DisplayName("optimized photos: stable id and widths come from the name; legacy names keep their basename as id")
    void photoIdAndWidthsComeFromTheFileName() {
        Photo optimized = new Photo("ho-xuan-huong-1-w1280-3fa9c1d2ab.webp", null, "A", "CC BY 4.0", "https://example.org/p", "", "", "ho-xuan-huong-1-w480-0123456789.webp");
        assertThat(optimized.id()).isEqualTo("ho-xuan-huong-1");
        assertThat(optimized.width()).isEqualTo(1280);
        assertThat(optimized.thumbWidth()).isEqualTo(480);

        Photo legacy = new Photo("ho-xuan-huong-1.jpg", "A", "CC BY 4.0", "https://example.org/p");
        assertThat(legacy.id()).isEqualTo("ho-xuan-huong-1");
        assertThat(legacy.width()).isNull();
        assertThat(legacy.thumbFile()).isNull();
        assertThat(legacy.thumbWidth()).isNull();

        Photo external = new Photo(null, "https://images.unsplash.com/photo-1?w=800", "A", "Unsplash", "https://unsplash.com/photos/1");
        assertThat(external.id()).isNull();
        assertThat(external.width()).isNull();
    }

    @Test
    @DisplayName("a thumbnail needs a local file and a valid name")
    void thumbnailRules() {
        assertThatThrownBy(() -> new Photo(null, "https://images.unsplash.com/photo-1?w=800", "A", "Unsplash", "https://unsplash.com/photos/1", "", "", "t-w480-0123456789.webp"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo("a.webp", null, "A", "CC BY 4.0", "https://example.org/p", "", "", "../etc/passwd"))
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(new Photo("a.webp", null, "A", "CC BY 4.0", "https://example.org/p", "", "", "  ").thumbFile()).isNull();
    }

    @Test
    void photographerProfileLinksAreOptionalAndSafe() {
        assertThat(new Photo("a.jpg", "Author", "CC BY 4.0", "https://example.org/photo").authorUrl()).isEmpty();
        assertThat(new Photo(null, "https://images.unsplash.com/photo-a", "Author", "Unsplash", "https://unsplash.com/photos/a", "", " https://unsplash.com/@author ").authorUrl())
                .isEqualTo("https://unsplash.com/@author");
        for (String invalid : List.of("javascript:alert(1)", "http://example.org/author", "https://user:pass@example.org/author", "https://")) {
            assertThatThrownBy(() -> new Photo("a.jpg", null, "Author", "CC BY 4.0", "https://example.org/photo", "", invalid))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void photoCaptionsAreOptionalAndBounded() {
        assertThat(new Photo("test.jpg", "Tác giả", "CC BY 4.0", "https://example.org/photo").caption()).isEmpty();
        assertThat(new Photo("test.jpg", null, "Tác giả", "CC BY 4.0", "https://example.org/photo", " Ảnh nguồn: 2006 ").caption())
                .isEqualTo("Ảnh nguồn: 2006");
        assertThatThrownBy(() -> new Photo("test.jpg", null, "Tác giả", "CC BY 4.0", "https://example.org/photo", "x".repeat(241)))
                .isInstanceOf(IllegalArgumentException.class);
    }


    private static Photo photo() {
        return new Photo("a-1.jpg", "Tác giả", "CC BY-SA 4.0", "https://commons.wikimedia.org/wiki/File:A.jpg");
    }

    private static Place place(String id, List<Photo> photos) {
        return new Place(id, "ha-giang", "Tên " + id, PlaceCategory.CANH, "Mèo Vạc", "Một câu điểm nhấn", "Giới thiệu", new GeoPoint(23.1, 105.3),
                List.of(9, 10), "Tháng 9–10", "2 giờ", "Dễ", List.of("a", "b"), Verdict.MUST_SEE, "Lý do", Set.of(TimeSlot.MORNING), "Buổi sáng", List.of("mẹo"), photos, "Bài", null);
    }

    @Test
    @DisplayName("ảnh ngoài (DR-034): đúng một nguồn, https và máy chủ trong danh sách cho phép; ghi công vẫn bắt buộc")
    void externalPhotoRules() {
        var ok = new Photo(null, "https://images.unsplash.com/photo-1?w=800", "Tác giả", "Giấy phép Unsplash", "https://unsplash.com/photos/abc?utm_source=wander");
        assertThat(ok.isExternal()).isTrue();
        assertThat(photo().isExternal()).isFalse();
        assertThatThrownBy(() -> new Photo("a.jpg", "https://images.unsplash.com/photo-1", "T", "L", "https://x.org")).hasMessageContaining("đúng một nguồn");
        assertThatThrownBy(() -> new Photo(null, null, "T", "L", "https://x.org")).hasMessageContaining("đúng một nguồn");
        assertThatThrownBy(() -> new Photo(null, "https://evil.example/x.jpg", "T", "L", "https://x.org")).hasMessageContaining("không được phép");
        assertThatThrownBy(() -> new Photo(null, "http://images.unsplash.com/x.jpg", "T", "L", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new Photo(null, "https://images.unsplash.com.evil.example/x.jpg", "T", "L", "https://x.org")).hasMessageContaining("không được phép");
        assertThatThrownBy(() -> new Photo(null, "https://images.unsplash.com/x.jpg", "", "L", "https://x.org")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("khoảnh khắc (DR-034): đủ chủ đề, chú thích, ảnh có ghi công; mã không trùng; dữ liệu cũ không có khoảnh khắc vẫn hợp lệ")
    void momentsAreValidated() {
        var ref = new ReferencePoint("hub", "TP Hà Giang", new GeoPoint(22.8, 105.0), true);
        var a = place("aaa", List.of(photo()));
        assertThatThrownBy(() -> new Moment("m1", null, "Chợ phiên", photo())).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("chủ đề");
        assertThatThrownBy(() -> new Moment("m1", MomentTheme.MARKET, " ", photo())).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("chú thích");
        assertThatThrownBy(() -> new Moment("m1", MomentTheme.MARKET, "Chợ phiên", null)).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ảnh");
        var m1 = new Moment("m1", MomentTheme.MARKET, "Chợ phiên Đồng Văn", photo());
        assertThatThrownBy(() -> new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(), List.of(a), List.of(m1, m1)))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Trùng");
        assertThat(new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(), List.of(a), List.of(m1)).moments()).hasSize(1);
        assertThat(new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(), List.of(a)).moments()).isEmpty();
        assertThat(MomentTheme.fromCode("mon-an")).contains(MomentTheme.FOOD);
        assertThat(MomentTheme.fromCode("la")).isEmpty();
    }

    @Test
    @DisplayName("địa điểm được phép chưa có ảnh (DR-033); ảnh đã khai báo vẫn được giữ")
    void placeMayHaveNoPhoto() {
        assertThat(place("deo-ma-pi-leng", List.of()).photos()).isEmpty();
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
        assertThatThrownBy(() -> new Place("ok-id", "ha-giang", "T", PlaceCategory.CANH, "K", "h", "", null, List.of(13), "m", "d", "Dễ", List.of(), Verdict.WORTH_IT, "r", Set.of(), "s", List.of(), List.of(photo()), "w", null))
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
    @DisplayName("địa điểm bìa của điểm đến phải có ảnh; nơi khác được phép chưa có ảnh")
    void coverPlaceNeedsPhoto() {
        var ref = new ReferencePoint("hub", "TP Hà Giang", new GeoPoint(22.8, 105.0), true);
        Place withPhoto = place("aaa", List.of(photo())), without = place("bbb", List.of());
        assertThatThrownBy(() -> new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "bbb", List.of(ref), List.of(), List.of(withPhoto, without)))
                .hasMessageContaining("phải có ít nhất một ảnh");
        assertThat(new Destination("ha-giang", "Hà Giang", "Đông Bắc", "t", "aaa", List.of(ref), List.of(), List.of(withPhoto, without)).places()).hasSize(2);
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
