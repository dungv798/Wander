package com.wander.identity;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Khung xác thực (ADR-005). Hợp đồng công khai được liệt kê ĐỘC LẬP với cấu hình. Endpoint mới dưới /api được đóng
 * theo mặc định (cần phiên), nên test kiểm kê route đỏ khi ai đó MỞ NHẦM một route trong cấu hình, hoặc làm một route
 * công khai trong hợp đồng bị chặn. Muốn thêm route công khai mới: sửa cả PUBLIC_ROUTES và hằng PUBLIC ở đây.
 */
class SecurityIT extends ApiTestSupport {

    /**
     * Hợp đồng: đúng tám điểm cuối này không cần phiên (tạo danh tính, khôi phục, ghép thiết bị, và ba route đọc kho địa
     * điểm — danh sách, chi tiết, lịch mẫu — theo DR-008 Q-a và DR-018 N-2, có giới hạn tốc độ theo địa chỉ).
     */
    private static final Set<String> PUBLIC = Set.of(
            "POST /api/identity",
            "POST /api/recovery/start",
            "POST /api/recovery/complete",
            "POST /api/device-links",
            "GET /api/device-links/{id}",
            "GET /api/catalog/destinations",
            "GET /api/catalog/destinations/{id}",
            "GET /api/catalog/destinations/{id}/templates");

    private static final String WELL_FORMED_UNKNOWN_TOKEN = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    @Autowired
    private ApplicationContext context;

    private record Route(String method, String pattern) {
        String concrete() {
            return pattern.replaceAll("\\{[^}]+}", "x");
        }

        String key() {
            return method + " " + pattern;
        }
    }

    private List<Route> apiRoutes() {
        List<Route> routes = new ArrayList<>();
        for (RequestMappingInfo info : handlerMapping.getHandlerMethods().keySet()) {
            Set<String> patterns = info.getPathPatternsCondition() == null ? Set.of() : info.getPathPatternsCondition().getPatternValues();
            Set<RequestMethod> methods = info.getMethodsCondition().getMethods();
            for (String p : new TreeSet<>(patterns)) {
                if (!p.startsWith("/api/")) continue;
                assertThat(methods).as("route " + p + " phải khai báo phương thức").isNotEmpty();
                for (RequestMethod m : methods) routes.add(new Route(m.name(), p));
            }
        }
        return routes;
    }

    @Test
    @DisplayName("kiểm kê route: đúng 8 điểm cuối công khai, mọi /api còn lại trả 401 UNAUTHENTICATED khi thiếu hoặc sai phiên")
    void routeInventory() {
        List<Route> routes = apiRoutes();
        assertThat(routes.size()).as("kiểm kê không được rỗng (tránh test đạt vì không kiểm gì)").isGreaterThan(20);
        assertThat(routes.stream().map(Route::key).filter(PUBLIC::contains).toList())
                .as("mọi điểm cuối công khai trong hợp đồng phải tồn tại").containsExactlyInAnyOrderElementsOf(PUBLIC);

        for (Route r : routes) {
            if (!PUBLIC.contains(r.key())) {
                // mỗi route một danh tính mới: route ghi (thu hồi/đăng xuất phiên) không làm các route sau 401 giả
                int withSession = call(r.method(), r.concrete(), newUser().token()).status();
                assertThat(withSession).as(r.key() + " có phiên hợp lệ: đi tới controller, không bị chặn hay chuyển hướng")
                        .isNotEqualTo(401).matches(s -> s < 300 || s >= 400);
            }
            if (PUBLIC.contains(r.key())) {
                assertThat(call(r.method(), r.concrete(), null).status()).as(r.key() + " không được đòi phiên").isNotEqualTo(401);
                assertThat(call(r.method(), r.concrete(), WELL_FORMED_UNKNOWN_TOKEN).status())
                        .as(r.key() + " bỏ qua phiên hỏng gửi kèm").isNotEqualTo(401);
            } else {
                Res none = call(r.method(), r.concrete(), null);
                assertThat(none.status()).as(r.key() + " thiếu phiên").isEqualTo(401);
                assertThat(none.code()).as(r.key()).isEqualTo("UNAUTHENTICATED");
                assertThat(call(r.method(), r.concrete(), WELL_FORMED_UNKNOWN_TOKEN).status()).as(r.key() + " phiên lạ").isEqualTo(401);
                assertThat(call(r.method(), r.concrete(), "ngan").status()).as(r.key() + " phiên sai định dạng").isEqualTo(401);
            }
        }
    }

    @Test
    @DisplayName("route /api không tồn tại cũng cần phiên (đóng theo mặc định): 401, không phải 404")
    void unknownApiRouteIsClosedByDefault() {
        assertThat(call("GET", "/api/khong-co-route-nay", null).status()).isEqualTo(401);
        assertThat(call("POST", "/api/khong-co-route-nay", null).status()).isEqualTo(401);
    }

    @Test
    @DisplayName("401 giữ hợp đồng cũ: JSON UNAUTHENTICATED, Cache-Control no-store, nosniff, WWW-Authenticate Bearer")
    void unauthenticatedResponseContract() {
        Res r = call("GET", "/api/trips", null);
        assertThat(r.status()).isEqualTo(401);
        assertThat(r.code()).isEqualTo("UNAUTHENTICATED");
        assertThat(r.raw().headers().firstValue("Content-Type").orElse("")).contains("application/json");
        assertThat(r.raw().headers().firstValue("Cache-Control")).hasValue("no-store");
        assertThat(r.raw().headers().firstValue("X-Content-Type-Options")).hasValue("nosniff");
        assertThat(r.raw().headers().firstValue("Strict-Transport-Security")).hasValue("max-age=31536000");
        assertThat(r.raw().headers().firstValue("WWW-Authenticate")).hasValue("Bearer");
    }

    @Test
    @DisplayName("điểm cuối công khai không bị phiên cũ/hỏng làm hỏng: tạo danh tính vẫn 201")
    void publicRouteIgnoresStaleAuthorization() {
        assertThat(call("POST", "/api/identity", WELL_FORMED_UNKNOWN_TOKEN).status()).isEqualTo(201);
        assertThat(call("POST", "/api/identity", "ngan").status()).isEqualTo(201);
    }

    @Test
    @DisplayName("ngoài /api không cần phiên: health check cho load balancer hoạt động")
    void nonApiNeedsNoSession() {
        assertThat(call("GET", "/actuator/health", null).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("biến thể đường dẫn không vượt được xác thực: không bao giờ trả dữ liệu khi chưa có phiên")
    void pathVariantsDoNotBypassAuthentication() {
        User u = newUser();
        newTrip(u.token());
        List<String> variants = List.of(
                "/api//trips", "/api/trips/", "/api/trips;x=1", "/api/trips%2f", "/api/trips%2F%2F", "/api/%2e/trips",
                "/api/./trips", "/api/trips%00", "/API/trips", "/api/%74rips", "//api/trips");
        for (String path : variants) {
            Res r = call("GET", path, null);
            assertThat(r.status()).as(path).isBetween(400, 499);
            assertThat(String.valueOf(r.body())).as(path + " không được lộ dữ liệu chuyến").doesNotContain("Hà Giang");
        }
        // biến thể của chính các route công khai: không được thành công như route công khai thật, cũng không lỗi 5xx
        List<String[]> publicVariants = List.of(
                new String[] {"POST", "/api/identity/"}, new String[] {"POST", "/api/identity;x=1"},
                new String[] {"POST", "/api//identity"}, new String[] {"GET", "/api/device-links/"},
                new String[] {"GET", "/api/device-links/x/"}, new String[] {"POST", "/api/recovery/start;x"},
                new String[] {"POST", "/api/recovery/start/"});
        for (String[] v : publicVariants) {
            Res r = call(v[0], v[1], null);
            assertThat(r.status()).as(v[0] + " " + v[1]).isBetween(400, 499);
            assertThat(String.valueOf(r.body())).as(v[0] + " " + v[1] + " không được cấp danh tính").doesNotContain("recoveryCode");
        }
    }

    @Test
    @DisplayName("không có người dùng mặc định có mật khẩu sinh ngẫu nhiên: Wander không có tài khoản mật khẩu")
    void noDefaultUserDetailsService() {
        assertThat(context.getBeanNamesForType(UserDetailsService.class)).isEmpty();
    }
}
