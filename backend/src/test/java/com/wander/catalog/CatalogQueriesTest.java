package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.catalog.application.query.CatalogQueries;
import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.GeoPoint;
import com.wander.catalog.domain.model.ItineraryTemplate;
import com.wander.catalog.domain.model.Photo;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.domain.model.ReferencePoint;
import com.wander.catalog.domain.port.PlaceCatalog;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.catalog.domain.vocabulary.Verdict;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Kiểm tra read model qua cổng giả, không khởi động Spring hay đọc classpath. */
class CatalogQueriesTest {

    /** Ảnh bìa tường minh phải được ưu tiên trong cả tóm tắt và chi tiết, kể cả ghi công. */
    @Test
    @DisplayName("ảnh bìa tường minh được ưu tiên hơn ảnh của địa điểm bìa")
    void explicitCoverPhotoTakesPriority() {
        Photo cover = new Photo("cover.jpg", "Tác giả bìa", "CC BY 4.0", "https://example.org/cover");
        CatalogQueries queries = queriesFor(destination(cover));
        String expectedUrl = CatalogConstants.PHOTO_URL_PREFIX + cover.file();

        var summary = queries.searchDestinations("").getFirst();
        var detail = queries.destination("ha-giang");

        assertThat(summary.coverUrl()).isEqualTo(expectedUrl);
        assertThat(detail.coverUrl()).isEqualTo(expectedUrl);
        assertThat(summary.coverPhoto().url()).isEqualTo(expectedUrl);
        assertThat(detail.coverPhoto()).isEqualTo(summary.coverPhoto());
        assertThat(summary.coverPhoto().author()).isEqualTo(cover.author());
        assertThat(summary.coverPhoto().license()).isEqualTo(cover.license());
        assertThat(summary.coverPhoto().sourceUrl()).isEqualTo(cover.sourceUrl());
    }

    /** Domain cho phép thiếu tọa độ; read model giữ null và không ước tính khoảng cách. */
    @Test
    @DisplayName("địa điểm thiếu tọa độ trả tâm null và danh sách khoảng cách rỗng")
    void missingLocationHasNoCenterOrDistances() {
        CatalogQueries queries = queriesFor(destination(null));

        var summary = queries.searchDestinations("").getFirst();
        var place = queries.destination("ha-giang").places().getFirst();

        assertThat(summary.lat()).isNull();
        assertThat(summary.lon()).isNull();
        assertThat(place.lat()).isNull();
        assertThat(place.lon()).isNull();
        assertThat(place.away()).isEmpty();
    }

    /** Dựng điểm đến hợp lệ có mốc tham chiếu nhưng địa điểm bìa không có tọa độ. */
    private static Destination destination(Photo cover) {
        Photo photo = new Photo("place.jpg", "Tác giả địa điểm", "CC BY 4.0", "https://example.org/place");
        Place place = new Place("cover-place", "ha-giang", "Địa điểm bìa", PlaceCategory.CANH, "Khu vực", "Điểm nhấn", "", null,
                List.of(), "Quanh năm", "Hai giờ", "Dễ", List.of(), Verdict.WORTH_IT, "Đáng ghé", Set.of(),
                "Ban ngày", List.of(), List.of(photo), "", null);
        ReferencePoint reference = new ReferencePoint("reference", "Mốc tham chiếu", new GeoPoint(23.1, 105.3), false);
        return new Destination("ha-giang", "Hà Giang", "Đông Bắc", "Cao nguyên đá", place.id(),
                List.of(reference), List.of(), List.of(place), List.of(), cover);
    }

    /** Cổng giả trả đúng điểm đến đã dựng và không có lịch mẫu. */
    private static CatalogQueries queriesFor(Destination destination) {
        return new CatalogQueries(new PlaceCatalog() {
            /** Trả điểm đến duy nhất dùng để kiểm tra ánh xạ. */
            @Override
            public List<Destination> searchDestinations(String query) {
                return List.of(destination);
            }

            /** Chỉ tìm thấy mã của điểm đến trong cổng giả. */
            @Override
            public Optional<Destination> destination(String id) {
                return destination.id().equals(id) ? Optional.of(destination) : Optional.empty();
            }

            /** Bộ dữ liệu thử không có lịch mẫu. */
            @Override
            public List<ItineraryTemplate> templates(String destinationId) {
                return List.of();
            }
        });
    }
}
