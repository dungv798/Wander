package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Properties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.context.TestPropertySource;

/**
 * The API documentation endpoints can be switched off, and the {@code free} profile (the public Render deployment) does switch them
 * off. The profile file is checked directly, because booting a second context with that profile would collide with data other tests
 * leave in the shared database; the switch itself is proven by running the application with exactly those two properties.
 */
@TestPropertySource(properties = {"springdoc.api-docs.enabled=false", "springdoc.swagger-ui.enabled=false"})
class OpenApiDisabledInFreeProfileIT extends ApiTestSupport {

    @Test
    @DisplayName("application-free.yml turns the OpenAPI document and Swagger UI off")
    void freeProfileDisablesDocumentation() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application-free.yml"));
        Properties free = yaml.getObject();
        assertThat(free.getProperty("springdoc.api-docs.enabled")).isEqualTo("false");
        assertThat(free.getProperty("springdoc.swagger-ui.enabled")).isEqualTo("false");
    }

    @Test
    @DisplayName("with those properties /v3/api-docs and Swagger UI are not served")
    void documentationIsOff() {
        assertThat(call("GET", "/v3/api-docs", null).status()).isEqualTo(404);
        assertThat(call("GET", "/swagger-ui/index.html", null).status()).isEqualTo(404);
    }
}
