package com.wander.support;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import tools.jackson.databind.json.JsonMapper;

/**
 * Nền chung cho test tích hợp: chạy ứng dụng thật trên cổng ngẫu nhiên, PostgreSQL thật trong Docker (Testcontainers),
 * gọi API qua HTTP như giao diện. Một container dùng chung cho mọi lớp test (singleton) để chạy nhanh;
 * mỗi test tự tạo danh tính mới nên dữ liệu không đụng nhau.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
        "wander.limits.identity-per-hour=100000",
        "wander.limits.recovery-per-hour=100000",
        "wander.limits.approval-per-hour=100000",
        "wander.limits.catalog-per-minute=100000",
        "wander.limits.approval-requests-per-window=100000",
        "wander.security.recovery-pepper=" + ApiTestSupport.TEST_RECOVERY_PEPPER})
public abstract class ApiTestSupport {

    /** Khóa HMAC của mã khôi phục dùng trong test (chỉ cho test; khóa thật nằm ngoài mã nguồn). */
    public static final String TEST_RECOVERY_PEPPER = "test-only-pepper-0123456789-abcdefghijklmnopqrstuv";

    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
    }

    protected static final JsonMapper JSON = JsonMapper.builder().build();
    private static final HttpClient HTTP = HttpClient.newHttpClient();
    private static final SecureRandom RANDOM = new SecureRandom();

    @LocalServerPort
    protected int port;

    @Autowired
    protected JdbcClient jdbc;

    /** Phản hồi HTTP; {@code body} là Map/List/String/Number/Boolean/null như JSON. */
    public record Res(int status, Object body, HttpResponse<String> raw) {
        /** Lấy giá trị theo đường dẫn, ví dụ {@code "error.code"} hay {@code "days.1.items.0.title"}. */
        public Object at(String path) {
            Object cur = body;
            for (String part : path.split("\\.")) {
                if (cur instanceof Map<?, ?> m) cur = m.get(part);
                else if (cur instanceof List<?> l) cur = l.get(Integer.parseInt(part));
                else return null;
            }
            return cur;
        }

        public String str(String path) {
            Object v = at(path);
            return v == null ? null : v.toString();
        }

        public long num(String path) {
            return ((Number) at(path)).longValue();
        }

        @SuppressWarnings("unchecked")
        public List<Object> list(String path) {
            return (List<Object>) at(path);
        }

        public String code() {
            return str("error.code");
        }
    }

    protected Res call(String method, String path, String token, Object body) {
        try {
            String json = body == null ? null : (body instanceof String s ? s : JSON.writeValueAsString(body));
            return send(method, path, token, json);
        } catch (IOException | InterruptedException e) {
            throw new IllegalStateException(e);
        }
    }

    protected Res call(String method, String path, String token) {
        return call(method, path, token, null);
    }

    protected Res callRaw(String method, String path, String token, String rawBody) {
        try {
            return send(method, path, token, rawBody);
        } catch (IOException | InterruptedException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Như {@link #call(String, String, String)} nhưng kèm header tùy ý (ví dụ X-Forwarded-For). */
    protected Res callWithHeaders(String method, String path, Map<String, String> headers) {
        try {
            return send(method, path, null, null, headers);
        } catch (IOException | InterruptedException e) {
            throw new IllegalStateException(e);
        }
    }

    private Res send(String method, String path, String token, String json) throws IOException, InterruptedException {
        return send(method, path, token, json, Map.of());
    }

    private Res send(String method, String path, String token, String json, Map<String, String> headers)
            throws IOException, InterruptedException {
        HttpRequest.Builder b = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + path));
        headers.forEach(b::header);
        if (token != null) b.header("Authorization", "Bearer " + token);
        if (json != null) b.header("Content-Type", "application/json");
        b.method(method, json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json));
        HttpResponse<String> r = HTTP.send(b.build(), HttpResponse.BodyHandlers.ofString());
        Object parsed = r.body() == null || r.body().isEmpty() ? null : parse(r);
        return new Res(r.statusCode(), parsed, r);
    }

    private static Object parse(HttpResponse<String> r) {
        String type = r.headers().firstValue("Content-Type").orElse("");
        return type.contains("json") ? JSON.readValue(r.body(), Object.class) : r.body();
    }

    // ---- dữ liệu dựng sẵn (giống server/test/helpers.ts) ----

    public record User(String token, String identityId, String recoveryCode) {
    }

    protected User newUser() {
        Res r = call("POST", "/api/identity", null);
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        return new User(r.str("token"), r.str("identityId"), r.str("recoveryCode"));
    }

    protected String newTrip(String token) {
        return newTrip(token, Map.of());
    }

    protected String newTrip(String token, Map<String, Object> extra) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", "Hà Giang – Tà Xùa");
        body.put("destination", "Hà Giang");
        body.put("startDate", "2026-08-29");
        body.put("endDate", "2026-09-06");
        body.putAll(extra);
        Res r = call("POST", "/api/trips", token, body);
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        return r.str("trip.id");
    }

    protected String newItem(String token, String tripId, Map<String, Object> fields) {
        Res r = call("POST", "/api/trips/" + tripId + "/items", token, item(fields));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        return r.str("item.id");
    }

    protected static Map<String, Object> item(Map<String, Object> fields) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("day", "2026-08-30");
        body.put("type", "sightseeing");
        body.put("title", "Mục");
        body.putAll(fields);
        return body;
    }

    /** Map cho phép giá trị null (Map.of không cho). */
    protected static Map<String, Object> map(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    protected static String newSessionToken() {
        byte[] b = new byte[32];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    protected static String newAttemptId() {
        byte[] b = new byte[16];
        RANDOM.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
