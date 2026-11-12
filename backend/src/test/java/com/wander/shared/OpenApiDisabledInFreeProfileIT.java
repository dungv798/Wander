package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.ActiveProfiles;

/** On the public free-tier deployment (profile {@code free}) the API documentation endpoints do not exist. */
@ActiveProfiles("free")
class OpenApiDisabledInFreeProfileIT extends ApiTestSupport {

    @Test
    @DisplayName("profile free: /v3/api-docs and Swagger UI are not served")
    void documentationIsOff() {
        assertThat(call("GET", "/v3/api-docs", null).status()).isEqualTo(404);
        assertThat(call("GET", "/swagger-ui/index.html", null).status()).isEqualTo(404);
    }
}
