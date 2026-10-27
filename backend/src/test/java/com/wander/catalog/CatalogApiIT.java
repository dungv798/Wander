package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * API kho địa điểm (ADR-010, DR-008 Q-a): công khai (không cần phiên, có giới hạn tốc độ theo địa chỉ), tìm không dấu,
 * chi tiết đủ ghi công và khoảng cách ước tính, ảnh công khai.
 */
class CatalogApiIT extends ApiTestSupport {

    @Test
    @DisplayName("công khai: không có phiên vẫn tìm được Hà Giang không dấu; phiên hỏng gửi kèm cũng không làm hỏng")
    void searchIsPublic() {
        Res anonymous = call("GET", "/api/catalog/destinations", null);
        assertThat(anonymous.status()).isEqualTo(200);
        assertThat(anonymous.list("destinations")).isNotEmpty();
        assertThat(call("GET", "/api/catalog/destinations/ha-giang", null).status()).isEqualTo(200);
        assertThat(call("GET", "/api/catalog/destinations", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA").status()).isEqualTo(200);

        User u = newUser();
        Res r = call("GET", "/api/catalog/destinations?q=ha%20giang", u.token());
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.list("destinations")).hasSize(1);
        assertThat(r.str("destinations.0.id")).isEqualTo("ha-giang");
        assertThat(r.num("destinations.0.placeCount")).isGreaterThanOrEqualTo(9);
        assertThat(r.str("destinations.0.coverUrl")).startsWith("/catalog/photos/");
        assertThat(r.list("destinations.0.previews")).hasSize(3);
        assertThat(r.str("destinations.0.previews.0.url")).startsWith("/catalog/photos/");
        assertThat(call("GET", "/api/catalog/destinations?q=sa%20pa", u.token()).list("destinations")).isEmpty();
        assertThat(call("GET", "/api/catalog/destinations", u.token()).list("destinations")).isNotEmpty();
    }

    @Test
    @DisplayName("chi tiết điểm đến: địa điểm có ảnh ghi công, nhãn biên tập (không có sao), khoảng cách ước tính; mã lạ 404")
    void destinationDetail() {
        User u = newUser();
        Res r = call("GET", "/api/catalog/destinations/ha-giang", u.token());
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.str("destination.name")).isEqualTo("Hà Giang");
        assertThat(r.list("destination.guide")).isNotEmpty();
        assertThat(r.list("destination.references")).isNotEmpty();
        assertThat(r.num("destination.references.0.lat")).as("mốc tham chiếu có tọa độ để vẽ bản đồ nhỏ").isBetween(8L, 24L);
        assertThat(r.num("destination.references.0.lon")).isBetween(102L, 110L);
        List<Object> places = r.list("destination.places");
        assertThat(places).hasSizeGreaterThanOrEqualTo(9);
        for (int i = 0; i < places.size(); i++) {
            String p = "destination.places." + i;
            assertThat(r.list(p + ".photos")).as(p).isNotEmpty();
            assertThat(r.str(p + ".photos.0.author")).isNotBlank();
            assertThat(r.str(p + ".photos.0.license")).isNotBlank();
            assertThat(r.str(p + ".verdictLabel")).isIn("Nên ghé", "Đáng đi", "Chỉ ghé nếu tiện");
            assertThat(r.list(p + ".away")).as(p).isNotEmpty();
            assertThat(r.num(p + ".away.0.km")).isPositive();
            assertThat(((Map<?, ?>) places.get(i)).containsKey("rating")).as("không có điểm sao").isFalse();
        }
        assertThat(call("GET", "/api/catalog/destinations/khong-co", u.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/catalog/destinations/khong-co", u.token()).code()).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("ảnh phục vụ công khai (thẻ img không gửi được Bearer), có cache; tệp lạ và đường dẫn thoát đều không lộ gì")
    void photosArePublic() {
        User u = newUser();
        String url = call("GET", "/api/catalog/destinations/ha-giang", u.token()).str("destination.coverUrl");
        Res photo = call("GET", url, null);
        assertThat(photo.status()).isEqualTo(200);
        assertThat(photo.raw().headers().firstValue("Content-Type").orElse("")).startsWith("image/jpeg");
        assertThat(photo.raw().headers().firstValue("Cache-Control").orElse("")).contains("max-age=86400").contains("public");
        assertThat(photo.raw().headers().firstValue("X-Content-Type-Options")).hasValue("nosniff");

        Res missing = call("GET", "/catalog/photos/khong-co.jpg", null);
        assertThat(missing.status()).isEqualTo(404);
        assertThat(missing.raw().headers().firstValue("Cache-Control").orElse("")).doesNotContain("max-age=86400");
        assertThat(call("GET", "/catalog/photos/..%2f..%2fapplication.yml", null).status()).isIn(400, 404);
        assertThat(call("GET", "/catalog/photos/%2e%2e/ha-giang.json", null).status()).isIn(400, 404);
    }
}
