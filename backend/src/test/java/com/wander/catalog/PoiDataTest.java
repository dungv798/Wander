package com.wander.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.model.PoiRecord;
import com.wander.catalog.domain.vocabulary.PoiKind;
import com.wander.catalog.infrastructure.adapter.ClasspathPlaceCatalog;
import com.wander.catalog.infrastructure.adapter.ClasspathPoiCatalog;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Nạp tài nguyên thật và kiểm fail-fast, không cần Spring hoặc Docker. */
class PoiDataTest {
    private static final String SOURCE = "src/main/resources/catalog/poi/da-lat.json";

    /** Đối chiếu số lượng thật với thống kê batch đã nhập. */
    @Test
    @DisplayName("628 POI có nguồn: 314 food, 256 cafe, 37 fast_food, 20 bar, 1 other; 105 giờ raw")
    void realBatchLoads() {
        var catalog = load("classpath*:catalog/poi/*.json");
        var batch = catalog.destination("da-lat").orElseThrow();
        assertThat(batch.pois()).hasSize(628);
        assertThat(batch.pois().stream().filter(poi -> poi.kind() == PoiKind.FOOD)).hasSize(314);
        assertThat(batch.pois().stream().filter(poi -> poi.kind() == PoiKind.CAFE)).hasSize(256);
        assertThat(batch.pois().stream().filter(poi -> poi.kind() == PoiKind.FAST_FOOD)).hasSize(37);
        assertThat(batch.pois().stream().filter(poi -> poi.kind() == PoiKind.BAR)).hasSize(20);
        assertThat(batch.pois().stream().filter(poi -> poi.kind() == PoiKind.OTHER)).hasSize(1);
        assertThat(batch.pois().stream().filter(poi -> poi.openingHoursRaw() != null)).hasSize(105);
        assertThat(batch.pois().stream().mapToLong(poi -> poi.mergedFrom().size()).sum()).isEqualTo(3);
        assertThat(batch.pois()).extracting(PoiRecord::verificationStatus).allSatisfy(status ->
                assertThat(status.name()).isEqualTo("SNAPSHOT_UNVERIFIED"));
        assertThat(catalog.destination("ha-giang")).isEmpty();
        assertThat(catalog.destination(null)).isEmpty();
    }

    /** Làm hỏng từng nhóm trường và yêu cầu adapter dừng nạp. */
    @Test
    @DisplayName("tọa độ sai, loại lạ, thiếu nguồn, trạng thái sai hoặc trường lạ đều bị từ chối khi nạp")
    void corruptBatchFailsFast(@TempDir Path directory) throws IOException {
        String original = Files.readString(Path.of(SOURCE));
        for (String changed : new String[] {
                original.replaceFirst("11.9404", "21.9404"),
                original.replaceFirst("108.4583", "180.4583"),
                original.replaceFirst("\"kind\": \"food\"", "\"kind\": \"hotel\""),
                original.replaceFirst("\"name\": \\{", "\"wrongField\": {"),
                original.replaceFirst("SNAPSHOT_UNVERIFIED", "VERIFIED"),
                original.replaceFirst("\"openingHoursStatus\": \"UNKNOWN\"", "\"openingHoursStatus\": \"RAW\""),
                original.replaceFirst("\"radiusM\": 15000", "\"radiusM\": 1"),
                original.replaceFirst("\"center\": \\[", "\"rating\": 5, \"center\": ["),
                original.replaceFirst("\"destinationId\": \"da-lat\"", "\"destinationId\": \"khong-co\""),
                original.replaceFirst("2026-10-29T02:34:26.802Z", "2026-10-30T02:34:26.802Z"),
                "{ hỏng json"
        }) {
            Path file = directory.resolve("broken.json");
            Files.writeString(file, changed);
            assertThatThrownBy(() -> load(file.toUri().toString())).isInstanceOf(IllegalStateException.class)
                    .hasStackTraceContaining("broken.json");
        }
    }

    /** Không cho phép tài nguyên thứ hai ghi đè batch đã nạp. */
    @Test
    @DisplayName("hai tài nguyên cùng điểm đến bị từ chối thay vì ghi đè")
    void duplicateFilesFailFast(@TempDir Path directory) throws IOException {
        String original = Files.readString(Path.of(SOURCE));
        Files.writeString(directory.resolve("a.json"), original);
        Files.writeString(directory.resolve("b.json"), original);
        assertThatThrownBy(() -> load(directory.toUri() + "*.json")).isInstanceOf(IllegalStateException.class);
    }

    /** Nạp qua adapter thật với catalog điểm đến có sẵn để kiểm liên kết. */
    private static ClasspathPoiCatalog load(String pattern) {
        return new ClasspathPoiCatalog(pattern, new ClasspathPlaceCatalog("classpath*:catalog/*.json"));
    }
}
