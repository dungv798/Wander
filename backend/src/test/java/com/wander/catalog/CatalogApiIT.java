package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.HashSet;
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
    @DisplayName("cả 12 điểm đến đều có tâm trong biên Việt Nam")
    void destinationCentersAreInVietnam() {
        Res response = call("GET", "/api/catalog/destinations", null);
        assertThat(response.status()).isEqualTo(200);
        assertThat(response.list("destinations")).hasSize(12);
        for (Object value : response.list("destinations")) {
            Map<?, ?> destination = (Map<?, ?>) value;
            assertThat(destination.get("lat")).isInstanceOf(Number.class);
            assertThat(destination.get("lon")).isInstanceOf(Number.class);
            assertThat(((Number) destination.get("lat")).doubleValue()).isBetween(8.0, 24.0);
            assertThat(((Number) destination.get("lon")).doubleValue()).isBetween(102.0, 110.0);
        }
    }

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
    @DisplayName("BE-7 (N-2): lịch mẫu công khai; ba lịch Hà Giang đã được PO duyệt (DR-020), địa điểm có thật trong điểm đến, không giờ/giá")
    void templatesArePublic() {
        Res anonymous = call("GET", "/api/catalog/destinations/ha-giang/templates", null);
        assertThat(anonymous.status()).as(String.valueOf(anonymous.body())).isEqualTo(200);
        assertThat(call("GET", "/api/catalog/destinations/ha-giang/templates", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA").status())
                .isEqualTo(200);

        List<Object> templates = anonymous.list("templates");
        assertThat(templates).hasSize(4);
        assertThat(anonymous.str("templates.0.id")).isEqualTo("vong-cung-3-ngay");
        assertThat(anonymous.str("templates.0.title")).isEqualTo("Vòng cung Đông Bắc 3 ngày");
        assertThat(anonymous.str("templates.0.status")).isEqualTo("approved");
        assertThat(anonymous.list("templates.0.days")).hasSize(3);
        assertThat(anonymous.list("templates.1.days")).hasSize(2);
        assertThat(anonymous.str("templates.2.days.1.note")).contains("Tây Côn Lĩnh");
        assertThat(anonymous.at("templates.0.days.0.note")).as("ngày không có ghi chú trả null").isNull();

        List<String> placeIds = new ArrayList<>();
        for (Object place : call("GET", "/api/catalog/destinations/ha-giang", null).list("destination.places")) {
            placeIds.add((String) ((Map<?, ?>) place).get("id"));
        }
        for (int t = 0; t < templates.size(); t++) {
            Map<?, ?> template = (Map<?, ?>) templates.get(t);
            assertThat(new HashSet<Object>(template.keySet())).as("chỉ có các trường biên tập, không giờ/giá/đánh giá")
                    .containsExactlyInAnyOrder("id", "title", "summary", "status", "days");
            for (Object day : (List<?>) template.get("days")) {
                assertThat(new HashSet<Object>(((Map<?, ?>) day).keySet())).containsExactlyInAnyOrder("placeIds", "note");
                for (Object id : (List<?>) ((Map<?, ?>) day).get("placeIds")) {
                    assertThat(placeIds).as("địa điểm %s của lịch %d có trong kho", id, t).contains((String) id);
                }
            }
        }
    }

    @Test
    @DisplayName("BE-7: điểm đến lạ ⇒ 404 cho lịch mẫu")
    void templatesOfUnknownDestination() {
        assertThat(call("GET", "/api/catalog/destinations/khong-co/templates", null).status()).isEqualTo(404);
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
            // DR-033: địa điểm được phép chưa có ảnh; ảnh đã khai báo vẫn phải đủ ghi công
            if (!r.list(p + ".photos").isEmpty()) {
                assertThat(r.str(p + ".photos.0.author")).isNotBlank();
                assertThat(r.str(p + ".photos.0.license")).isNotBlank();
            }
            assertThat(r.str(p + ".verdictLabel")).isIn("Nên ghé", "Đáng đi", "Chỉ ghé nếu tiện");
            assertThat(r.list(p + ".away")).as(p).isNotEmpty();
            assertThat(r.num(p + ".away.0.km")).isPositive();
            assertThat(((Map<?, ?>) places.get(i)).containsKey("rating")).as("không có điểm sao").isFalse();
        }
        assertThat(call("GET", "/api/catalog/destinations/khong-co", u.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/catalog/destinations/khong-co", u.token()).code()).isEqualTo("NOT_FOUND");
    }

    @Test
    @DisplayName("khoảnh khắc (DR-034): điểm đến có ảnh đời sống trả chủ đề, chú thích và ghi công đủ; điểm đến chưa có thì mảng rỗng, không lỗi")
    void destinationMoments() {
        Res withMoments = call("GET", "/api/catalog/destinations/ha-noi", null);
        assertThat(withMoments.status()).isEqualTo(200);
        List<Object> moments = withMoments.list("destination.moments");
        assertThat(moments).as("Hà Nội đã có khoảnh khắc được duyệt").isNotEmpty();
        for (int i = 0; i < moments.size(); i++) {
            String m = "destination.moments." + i;
            assertThat(withMoments.str(m + ".theme")).isIn("cho", "mon-an", "nguoi", "le-hoi", "nghe");
            assertThat(withMoments.str(m + ".themeLabel")).isNotBlank();
            assertThat(withMoments.str(m + ".caption")).isNotBlank();
            assertThat(withMoments.str(m + ".photo.url")).startsWith("/catalog/photos/");
            assertThat(withMoments.str(m + ".photo.author")).isNotBlank();
            assertThat(withMoments.str(m + ".photo.license")).isNotBlank();
            assertThat(withMoments.str(m + ".photo.sourceUrl")).startsWith("https://");
        }
        Res without = call("GET", "/api/catalog/destinations/vinh-hy", null);
        assertThat(without.status()).isEqualTo(200);
        assertThat(without.list("destination.moments")).as("chưa có dữ liệu thì rỗng nhưng trường vẫn có").isEmpty();
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
