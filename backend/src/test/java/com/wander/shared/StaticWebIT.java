package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

/** Phục vụ giao diện đã build cùng nguồn gốc với API (thay cho server/test/static.test.ts). */
class StaticWebIT extends ApiTestSupport {

    static final Path WEB = createWebDir();

    static Path createWebDir() {
        try {
            Path dir = Files.createTempDirectory("wander-web");
            Files.createDirectories(dir.resolve("assets"));
            Files.writeString(dir.resolve("index.html"), "<!doctype html><title>Wander</title>");
            Files.writeString(dir.resolve("assets/app-123.js"), "console.log('wander')");
            Files.writeString(dir.resolve("manifest.webmanifest"), "{\"name\":\"Wander\"}");
            return dir;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    @DynamicPropertySource
    static void web(DynamicPropertyRegistry r) {
        r.add("wander.web.dir", WEB::toString);
    }

    @Test
    @DisplayName("trang chủ và đường dẫn giao diện trả index.html kèm CSP; tệp băm được cache lâu")
    void servesSpa() {
        Res home = call("GET", "/", null);
        assertThat(home.status()).isEqualTo(200);
        assertThat(home.raw().body()).contains("<title>Wander</title>");
        assertThat(home.raw().headers().firstValue("Content-Security-Policy").orElse("")).contains("default-src 'self'");
        // ghim các chỉ thị chặn XSS (RG-6): không script nội tuyến/eval, không plugin, không nhúng khung, không ký tự đại diện
        assertThat(home.raw().headers().firstValue("Content-Security-Policy").orElse(""))
                .contains("script-src 'self';", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'none'")
                .doesNotContain("unsafe-inline", "unsafe-eval", "unsafe-hashes", " * ", "https:;");
        assertThat(home.raw().headers().firstValue("X-Frame-Options")).hasValue("DENY");
        assertThat(home.raw().headers().firstValue("Strict-Transport-Security")).hasValue("max-age=31536000");
        assertThat(home.raw().headers().firstValue("Cache-Control")).hasValue("no-cache");

        Res asset = call("GET", "/assets/app-123.js", null);
        assertThat(asset.status()).isEqualTo(200);
        assertThat(asset.raw().headers().firstValue("Cache-Control")).hasValue("public, max-age=31536000, immutable");

        Res route = call("GET", "/trip/abc", null);
        assertThat(route.status()).isEqualTo(200);
        assertThat(route.raw().body()).contains("<title>Wander</title>");
    }

    @Test
    @DisplayName("không đi ra ngoài thư mục giao diện; API không bị giao diện che")
    void staysInsideWebDir() throws IOException {
        Files.writeString(WEB.getParent().resolve("wander-secret.txt"), "bi mat");
        Res escape = call("GET", "/..%2Fwander-secret.txt", null);
        assertThat(String.valueOf(escape.raw().body())).doesNotContain("bi mat");

        Res api = call("GET", "/api/khong-co", null);
        assertThat(api.status()).isEqualTo(401);
        assertThat(api.raw().headers().firstValue("Cache-Control")).hasValue("no-store");

        User u = newUser();
        Res unknown = call("GET", "/api/khong-co", u.token());
        assertThat(unknown.status()).isEqualTo(404);
        assertThat(unknown.code()).isEqualTo("NOT_FOUND");
        assertThat(unknown.raw().headers().firstValue("Content-Type").orElse("")).as("Safari mở thẳng URL lỗi phải đọc UTF-8, không đoán Latin-1")
                .containsIgnoringCase("charset=UTF-8");
    }

    @Test
    @DisplayName("manifest ứng dụng web được phục vụ đúng kiểu application/manifest+json (iOS Safari dùng nó để chạy toàn màn hình)")
    void servesWebManifestWithItsOwnMediaType() {
        Res manifest = call("GET", "/manifest.webmanifest", null);
        assertThat(manifest.status()).isEqualTo(200);
        assertThat(manifest.raw().headers().firstValue("Content-Type").orElse("")).startsWith("application/manifest+json");
    }

    @Test
    @DisplayName("health check cho load balancer")
    void health() {
        Res h = call("GET", "/actuator/health", null);
        assertThat(h.status()).isEqualTo(200);
        assertThat(h.str("status")).isEqualTo("UP");
    }

    @Test
    @DisplayName("asset thiếu trả 404 không cache, không bị SPA trả HTML với immutable")
    void missingAssetsAreNotSpaRoutes() {
        for (String path : new String[] {"/assets/missing.js", "/assets/no-extension", "/missing.css", "/catalog/photos/missing.jpg"}) {
            Res missing = call("GET", path, null);
            assertThat(missing.status()).as(path).isEqualTo(404);
            assertThat(missing.raw().body()).as(path).doesNotContain("<title>Wander</title>");
            assertThat(missing.raw().headers().firstValue("Cache-Control")).as(path).hasValue("no-store");
        }
    }
}
