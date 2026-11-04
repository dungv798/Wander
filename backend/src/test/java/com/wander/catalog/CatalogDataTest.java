package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.ItineraryTemplate;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.domain.vocabulary.TemplateStatus;
import com.wander.catalog.infrastructure.adapter.ClasspathPlaceCatalog;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Kiểm tra dữ liệu biên tập thật trong repo và cách adapter xử lý dữ liệu hỏng. Không cần Spring hay Docker. */
class CatalogDataTest {

    private static final String REAL = "classpath*:catalog/*.json";
    private static final String REAL_TEMPLATES = "classpath*:catalog/templates/*.json";
    private static final Set<String> OPEN_LICENSES = Set.of("CC BY 2.0", "CC BY 3.0", "CC BY 4.0", "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0", "CC0", "Public domain");

    @Test
    @DisplayName("kho thật nạp được; mỗi địa điểm có tọa độ; ảnh đã khai báo đủ ghi công, giấy phép mở (địa điểm được phép chưa có ảnh, DR-033)")
    void realCatalogIsValid() {
        var catalog = new ClasspathPlaceCatalog(REAL);
        assertThat(catalog.searchDestinations("")).isNotEmpty();
        Destination ha = catalog.destination("ha-giang").orElseThrow();
        assertThat(ha.places()).hasSizeGreaterThanOrEqualTo(9);
        for (Place p : ha.places()) {
            assertThat(p.location()).as("tọa độ của " + p.id()).isNotNull();
            p.photos().forEach(ph -> assertThat(OPEN_LICENSES).as("giấy phép ảnh " + ph.file()).contains(ph.license()));
        }
    }

    @Test
    @DisplayName("BE-7: lịch mẫu thật nạp được, đã duyệt (DR-020), địa điểm có thật; điểm đến chưa có lịch trả danh sách rỗng")
    void realTemplatesAreValid() {
        var catalog = new ClasspathPlaceCatalog(REAL, REAL_TEMPLATES);
        List<ItineraryTemplate> templates = catalog.templates("ha-giang");
        assertThat(templates).extracting(ItineraryTemplate::id).containsExactly("vong-cung-3-ngay", "dong-van-cuoi-tuan", "tay-bac-leo-nui", "vong-cung-4-ngay");
        assertThat(templates).extracting(ItineraryTemplate::status).containsExactly(TemplateStatus.APPROVED, TemplateStatus.APPROVED, TemplateStatus.APPROVED, TemplateStatus.REFERENCE);
        Set<String> placeIds = catalog.destination("ha-giang").orElseThrow().places().stream().map(Place::id).collect(java.util.stream.Collectors.toSet());
        for (ItineraryTemplate t : templates) {
            t.days().forEach(day -> assertThat(placeIds).containsAll(day.placeIds()));
        }
        for (String destination : List.of("hoi-an", "vinh-hy", "ta-xua")) {
            var reference = catalog.templates(destination);
            assertThat(reference).as("lịch trình tham khảo của " + destination).isNotEmpty().extracting(ItineraryTemplate::status).containsOnly(TemplateStatus.REFERENCE);
            Set<String> ids = catalog.destination(destination).orElseThrow().places().stream().map(Place::id).collect(java.util.stream.Collectors.toSet());
            reference.forEach(t -> t.days().forEach(day -> assertThat(ids).containsAll(day.placeIds())));
        }
        assertThat(catalog.templates("khong-co")).isEmpty();
        assertThat(catalog.templates(null)).isEmpty();
        assertThat(new ClasspathPlaceCatalog(REAL).templates("ha-giang")).as("không cấu hình lịch mẫu thì rỗng").isEmpty();
    }

    @Test
    @DisplayName("BE-7: lịch mẫu hỏng làm ứng dụng không khởi động: địa điểm lạ, địa điểm lặp, trường lạ (giờ/giá), trạng thái lạ, điểm đến lạ")
    void brokenTemplatesFailFast(@TempDir Path dir) throws IOException {
        Files.writeString(dir.resolve("ha-giang.json"), Files.readString(Path.of("src/main/resources/catalog/ha-giang.json")));
        String valid = Files.readString(Path.of("src/main/resources/catalog/templates/ha-giang.json"));
        Path templates = Files.createDirectory(dir.resolve("templates"));
        String destinations = "file:" + dir + "/ha-giang.json";

        Files.writeString(templates.resolve("ha-giang.json"), valid.replace("cong-troi-quan-ba", "dia-diem-khong-co"));
        assertFails(destinations, templates, "dia-diem-khong-co");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("\"dinh-vuong\"", "\"cong-troi-quan-ba\""));
        assertFails(destinations, templates, "cong-troi-quan-ba");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("\"summary\"", "\"price\": 100000, \"summary\""));
        assertFails(destinations, templates, "ha-giang.json");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("\"id\": \"vong-cung-3-ngay\",", "\"id\": \"vong-cung-3-ngay\", \"startTime\": \"08:00\","));
        assertFails(destinations, templates, "ha-giang.json");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("(\"status\": \")approved(\",\\s+\"days\")", "$1duyet$2"));
        assertFails(destinations, templates, "duyet");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replace("\"destinationId\": \"ha-giang\"", "\"destinationId\": \"sa-pa\""));
        assertFails(destinations, templates, "sa-pa");

        Files.writeString(templates.resolve("ha-giang.json"), "{ không phải json");
        assertFails(destinations, templates, "ha-giang.json");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("\"destinationId\"", "\"status\": \"draft\", \"destinationId\""));
        assertFails(destinations, templates, "ha-giang.json");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replaceFirst("\"destinationId\"", "\"note\": \"ghi chú tệp\", \"destinationId\""));
        assertFails(destinations, templates, "ha-giang.json");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replace("\"id\": \"dong-van-cuoi-tuan\"", "\"id\": \"vong-cung-3-ngay\""));
        assertFails(destinations, templates, "vong-cung-3-ngay");

        Files.writeString(templates.resolve("ha-giang.json"), valid.replace("\"note\": \"Tiếp tục chặng leo Tây Côn Lĩnh (nơi này cần khoảng 2 ngày).\"", "\"note\": \"  \""));
        assertFails(destinations, templates, "ghi chú");
    }

    @Test
    @DisplayName("BE-7: trạng thái draft được giữ nguyên (không tự thành đã duyệt); hai tệp cùng điểm đến bị từ chối")
    void draftIsKeptAndDuplicateFilesRejected(@TempDir Path dir) throws IOException {
        Files.writeString(dir.resolve("ha-giang.json"), Files.readString(Path.of("src/main/resources/catalog/ha-giang.json")));
        String valid = Files.readString(Path.of("src/main/resources/catalog/templates/ha-giang.json"));
        Path templates = Files.createDirectory(dir.resolve("templates"));
        String destinations = "file:" + dir + "/ha-giang.json";

        Files.writeString(templates.resolve("a.json"), valid.replace("\"status\": \"approved\"", "\"status\": \"draft\"").replace("\"status\": \"reference\"", "\"status\": \"draft\""));
        var catalog = new ClasspathPlaceCatalog(destinations, "file:" + templates + "/*.json");
        assertThat(catalog.templates("ha-giang")).hasSize(4).extracting(ItineraryTemplate::status).containsOnly(TemplateStatus.DRAFT);

        Files.writeString(templates.resolve("b.json"), valid);
        assertFails(destinations, templates, "ha-giang");
    }

    /** Khẳng định nạp kho với tệp lịch mẫu này thất bại với lỗi khởi động có chứa {@code fragment}. */
    private static void assertFails(String destinations, Path templates, String fragment) {
        assertThatThrownBy(() -> new ClasspathPlaceCatalog(destinations, "file:" + templates + "/*.json"))
                .isInstanceOf(IllegalStateException.class).hasMessageContaining(fragment);
    }

    @Test
    @DisplayName("tìm điểm đến không phân biệt hoa thường và dấu; không khớp thì rỗng")
    void search() {
        var catalog = new ClasspathPlaceCatalog(REAL);
        assertThat(catalog.searchDestinations("ha giang")).extracting(Destination::id).containsExactly("ha-giang");
        assertThat(catalog.searchDestinations("HÀ GIANG")).hasSize(1);
        assertThat(catalog.searchDestinations("sa pa")).isEmpty();
        assertThat(catalog.destination("khong-co")).isEmpty();
        assertThat(catalog.destination(null)).isEmpty();
    }

    @Test
    @DisplayName("dữ liệu hỏng làm ứng dụng không khởi động: thiếu ảnh, trường lạ, JSON sai")
    void brokenDataFailsFast(@TempDir Path dir) throws IOException {
        String valid = Files.readString(Path.of("src/main/resources/catalog/ha-giang.json"));
        Files.writeString(dir.resolve("missing-photo.json"), valid.replace("hoang-su-phi-1.jpg", "khong-ton-tai.jpg"));
        assertThatThrownBy(() -> new ClasspathPlaceCatalog("file:" + dir + "/missing-photo.json")).isInstanceOf(IllegalStateException.class).hasMessageContaining("Thiếu tệp ảnh");

        Files.writeString(dir.resolve("typo.json"), valid.replaceFirst("\\{", "{ \"truongLa\": 1,"));
        assertThatThrownBy(() -> new ClasspathPlaceCatalog("file:" + dir + "/typo.json")).isInstanceOf(IllegalStateException.class);

        Files.writeString(dir.resolve("nolat.json"), valid.replaceFirst("\"lat\": 22.8233,", ""));
        assertThatThrownBy(() -> new ClasspathPlaceCatalog("file:" + dir + "/nolat.json")).isInstanceOf(IllegalStateException.class).hasMessageContaining("thiếu tọa độ");

        Files.writeString(dir.resolve("bad.json"), "{ không phải json");
        assertThatThrownBy(() -> new ClasspathPlaceCatalog("file:" + dir + "/bad.json")).isInstanceOf(IllegalStateException.class).hasMessageContaining("bad.json");

        Files.writeString(dir.resolve("verdict.json"), valid.replace("\"must\"", "\"sao-5\""));
        assertThatThrownBy(() -> new ClasspathPlaceCatalog("file:" + dir + "/verdict.json")).isInstanceOf(IllegalStateException.class).hasMessageContaining("Nhãn gợi ý");
    }
}
