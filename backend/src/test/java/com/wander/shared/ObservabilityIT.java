package com.wander.shared;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

import com.wander.support.ApiTestSupport;
import java.time.Duration;
import java.util.Map;
import java.util.Properties;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.YamlPropertiesFactoryBean;
import org.springframework.core.io.ClassPathResource;

/**
 * Observability: every response carries an {@code X-Request-Id}, an error body repeats it as {@code requestId}, the Prometheus endpoint
 * publishes the HTTP and the application metrics, and the {@code free} profile (the public deployment) logs JSON and does not
 * expose metrics. The profile file is checked directly for the same reason as in {@link OpenApiDisabledInFreeProfileIT}.
 */
class ObservabilityIT extends ApiTestSupport {

    private static final String REQUEST_ID = "X-Request-Id";

    private static String requestIdOf(Res res) {
        return res.raw().headers().firstValue(REQUEST_ID).orElse("");
    }

    @Test
    @DisplayName("a response without a caller-supplied id gets a generated UUID in X-Request-Id")
    void generatesRequestId() {
        String id = requestIdOf(call("GET", "/api/destinations", null));
        assertThat(UUID.fromString(id)).isNotNull();
    }

    @Test
    @DisplayName("a short, harmless X-Request-Id from the caller is kept; one with spaces or over 64 characters is replaced")
    void keepsOnlyHarmlessSuppliedIds() {
        assertThat(requestIdOf(callWithHeaders("GET", "/api/destinations", Map.of(REQUEST_ID, "client-trace.42_a")))).isEqualTo("client-trace.42_a");
        String tooLong = "x".repeat(65);
        assertThat(requestIdOf(callWithHeaders("GET", "/api/destinations", Map.of(REQUEST_ID, tooLong)))).isNotEqualTo(tooLong);
        assertThat(requestIdOf(callWithHeaders("GET", "/api/destinations", Map.of(REQUEST_ID, "has space")))).isNotEqualTo("has space");
    }

    @Test
    @DisplayName("an error body carries the same requestId as the response header (400 validation, 404, 401)")
    void errorBodyRepeatsTheRequestId() {
        User user = newUser();
        Res invalid = call("POST", "/api/trips", user.token(), Map.of("destination", "da-lat"));
        assertThat(invalid.status()).isEqualTo(400);
        assertThat(invalid.str("requestId")).isEqualTo(requestIdOf(invalid)).isNotBlank();

        Res missing = call("GET", "/api/trips/" + UUID.randomUUID(), user.token());
        assertThat(missing.str("requestId")).isEqualTo(requestIdOf(missing)).isNotBlank();

        Res unauthorized = call("GET", "/api/trips", null);
        assertThat(unauthorized.status()).isEqualTo(401);
        assertThat(unauthorized.str("requestId")).isEqualTo(requestIdOf(unauthorized)).isNotBlank();
    }

    @Test
    @DisplayName("/actuator/prometheus publishes HTTP metrics by route template and the application metrics")
    void prometheusEndpointPublishesMetrics() {
        User user = newUser();
        call("GET", "/api/trips", user.token());
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            String text = call("GET", "/actuator/prometheus", null).raw().body();
            assertThat(text).contains("http_server_requests_seconds_count").contains("uri=\"/api/trips\"");
            assertThat(text).contains("wander_identity_events_recorded_total{kind=\"created\"");
            assertThat(text).contains("http_server_requests_seconds_bucket").doesNotContain(user.token());
        });
    }

    @Test
    @DisplayName("application-free.yml switches on JSON logs and exposes only the health endpoint")
    void freeProfileLogsJsonAndHidesMetrics() {
        YamlPropertiesFactoryBean yaml = new YamlPropertiesFactoryBean();
        yaml.setResources(new ClassPathResource("application-free.yml"));
        Properties free = yaml.getObject();
        assertThat(free.getProperty("logging.structured.format.console")).isEqualTo("ecs");
        assertThat(free.getProperty("management.endpoints.web.exposure.include")).isEqualTo("health");
    }
}
