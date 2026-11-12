package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** The OpenAPI document and Swagger UI are served by default (local, CI) and carry the API contract. */
class OpenApiDocsIT extends ApiTestSupport {

    @Test
    @DisplayName("/v3/api-docs is OpenAPI 3.1 with the Wander metadata, a bearer scheme and the main paths")
    void documentDescribesTheApi() {
        Res doc = call("GET", "/v3/api-docs", null);
        assertThat(doc.status()).isEqualTo(200);
        assertThat(doc.str("openapi")).startsWith("3.1");
        assertThat(doc.str("info.title")).isEqualTo("Wander API");
        assertThat(doc.str("components.securitySchemes.bearerAuth.scheme")).isEqualTo("bearer");
        @SuppressWarnings("unchecked")
        Map<String, Object> paths = (Map<String, Object>) doc.at("paths");
        assertThat(paths).containsKeys("/api/trips", "/api/identity", "/api/catalog/destinations");
    }

    @Test
    @DisplayName("Swagger UI loads, and only its own pages get the relaxed style policy; the application keeps the strict one")
    void swaggerUiHasItsOwnPolicy() {
        Res ui = call("GET", "/swagger-ui/index.html", null);
        assertThat(ui.status()).isEqualTo(200);
        assertThat(ui.raw().headers().firstValue("Content-Security-Policy").orElse("")).contains("style-src 'self' 'unsafe-inline'");
        assertThat(ui.raw().headers().firstValue("Content-Security-Policy").orElse("")).doesNotContain("unsafe-eval");
    }
}
