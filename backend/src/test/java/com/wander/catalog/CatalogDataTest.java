package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.model.Destination;
import com.wander.catalog.domain.model.Place;
import com.wander.catalog.infrastructure.adapter.ClasspathPlaceCatalog;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Kiểm tra dữ liệu biên tập thật trong repo và cách adapter xử lý dữ liệu hỏng. Không cần Spring hay Docker. */
class CatalogDataTest {

    private static final String REAL = "classpath*:catalog/*.json";
    private static final Set<String> OPEN_LICENSES = Set.of("CC BY 2.0", "CC BY 3.0", "CC BY 4.0", "CC BY-SA 2.0", "CC BY-SA 2.5", "CC BY-SA 3.0", "CC BY-SA 4.0", "CC0", "Public domain");

    @Test
    @DisplayName("kho thật nạp được; mỗi địa điểm có tọa độ, ít nhất một ảnh, đủ ghi công, giấy phép mở")
    void realCatalogIsValid() {
        var catalog = new ClasspathPlaceCatalog(REAL);
        assertThat(catalog.searchDestinations("")).isNotEmpty();
        Destination ha = catalog.destination("ha-giang").orElseThrow();
        assertThat(ha.places()).hasSizeGreaterThanOrEqualTo(9);
        for (Place p : ha.places()) {
            assertThat(p.location()).as("tọa độ của " + p.id()).isNotNull();
            assertThat(p.photos()).as("ảnh của " + p.id()).isNotEmpty();
            p.photos().forEach(ph -> assertThat(OPEN_LICENSES).as("giấy phép ảnh " + ph.file()).contains(ph.license()));
        }
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
