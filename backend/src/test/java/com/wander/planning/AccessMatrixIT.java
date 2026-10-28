package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Ma trận route × vai (rà soát bảo mật T1): MỌI route có {@code {tripId}} phải được khai chính sách ở bảng dưới. Thêm route mới mà quên khai
 * thì test này ĐỎ, nên không ai thêm điểm cuối mà quên kiểm quyền. Chỉ gọi bằng người không phải Organizer nên không phá dữ liệu.
 */
class AccessMatrixIT extends ApiTestSupport {

    /** Chính sách của một route. */
    private enum Policy {
        /** Mọi thành viên. */ MEMBER,
        /** Thành viên nhưng chỉ với mục của mình (có thể 403 NOT_YOUR_ITEM). */ MEMBER_OWN_ITEM,
        /** Chỉ Organizer (thành viên thường 403). */ ORGANIZER,
        /** Chỉ Organizer và chỉ với chuyến đã xóa mềm (chuyến còn hiện hoặc người khác: 404). */ ORGANIZER_DELETED_TRIP
    }

    private static final Map<String, Policy> TRIP_ROUTES = new TreeMap<>(Map.ofEntries(
            Map.entry("GET /api/trips/{tripId}", Policy.MEMBER),
            Map.entry("PATCH /api/trips/{tripId}", Policy.ORGANIZER),
            Map.entry("DELETE /api/trips/{tripId}", Policy.ORGANIZER),
            Map.entry("POST /api/trips/{tripId}/restore", Policy.ORGANIZER_DELETED_TRIP),
            Map.entry("POST /api/trips/{tripId}/items", Policy.MEMBER),
            Map.entry("GET /api/trips/{tripId}/items/{itemId}", Policy.MEMBER),
            Map.entry("PATCH /api/trips/{tripId}/items/{itemId}", Policy.MEMBER_OWN_ITEM),
            Map.entry("DELETE /api/trips/{tripId}/items/{itemId}", Policy.MEMBER_OWN_ITEM),
            Map.entry("POST /api/trips/{tripId}/items/{itemId}/restore", Policy.MEMBER_OWN_ITEM),
            Map.entry("DELETE /api/trips/{tripId}/items/{itemId}/permanent", Policy.ORGANIZER),
            Map.entry("PUT /api/trips/{tripId}/items/{itemId}/done", Policy.MEMBER),
            Map.entry("POST /api/trips/{tripId}/days/{day}/reorder", Policy.ORGANIZER),
            Map.entry("POST /api/trips/{tripId}/schedule", Policy.ORGANIZER),
            Map.entry("GET /api/trips/{tripId}/trash", Policy.MEMBER),
            Map.entry("POST /api/trips/{tripId}/invites", Policy.ORGANIZER),
            Map.entry("GET /api/trips/{tripId}/invites", Policy.ORGANIZER),
            Map.entry("DELETE /api/trips/{tripId}/invites/active", Policy.ORGANIZER),
            Map.entry("GET /api/trips/{tripId}/members", Policy.MEMBER),
            Map.entry("DELETE /api/trips/{tripId}/members/{memberId}", Policy.ORGANIZER),
            Map.entry("DELETE /api/trips/{tripId}/members/me", Policy.MEMBER),
            Map.entry("PATCH /api/trips/{tripId}/members/me", Policy.MEMBER)));

    /** Route không gắn chuyến: cần phiên (trừ preview công khai). */
    private static final Set<String> SESSION_ROUTES = Set.of("GET /api/trips", "POST /api/trips", "GET /api/trips/deleted", "GET /api/preferences",
            "PUT /api/preferences/interests", "POST /api/invites/join");
    private static final Set<String> PUBLIC_ROUTES = Set.of("POST /api/invites/preview");

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mapping;

    /** Mọi "PHƯƠNG_THỨC /đường-dẫn" của các API planning do ứng dụng đăng ký. */
    private Set<String> registeredPlanningRoutes() {
        Set<String> routes = new TreeSet<>();
        for (RequestMappingInfo info : mapping.getHandlerMethods().keySet()) {
            if (info.getPathPatternsCondition() == null) continue;
            for (String pattern : info.getPathPatternsCondition().getPatternValues()) {
                if (!pattern.startsWith("/api/trips") && !pattern.startsWith("/api/invites") && !pattern.startsWith("/api/preferences")) continue;
                info.getMethodsCondition().getMethods().forEach(method -> routes.add(method.name() + " " + pattern));
            }
        }
        return routes;
    }

    @Test
    @DisplayName("mọi route planning đều có chính sách khai báo (route mới mà chưa khai ⇒ test đỏ)")
    void everyRouteHasAPolicy() {
        Set<String> declared = new TreeSet<>(TRIP_ROUTES.keySet());
        declared.addAll(SESSION_ROUTES);
        declared.addAll(PUBLIC_ROUTES);
        assertThat(registeredPlanningRoutes()).as("route đã đăng ký so với bảng chính sách").containsExactlyInAnyOrderElementsOf(declared);
    }

    @Test
    @DisplayName("không phiên ⇒ 401 trên mọi route trừ preview công khai; người ngoài ⇒ 404 và thành viên thường ⇒ 403 ở việc của Organizer")
    void matrix() {
        User org = newUser();
        User member = newUser();
        User outsider = newUser();
        String trip = newTrip(org.token());
        String code = call("POST", "/api/trips/" + trip + "/invites", org.token()).str("invite.code");
        call("POST", "/api/invites/join", member.token(), map("code", code, "displayName", "An"));
        String item = newItem(org.token(), trip, Map.of("title", "Của chủ"));
        String memberId = call("GET", "/api/trips/" + trip + "/members", org.token()).str("members.1.id");

        for (Map.Entry<String, Policy> route : TRIP_ROUTES.entrySet()) {
            String[] parts = route.getKey().split(" ", 2);
            String path = parts[1].replace("{tripId}", trip).replace("{itemId}", item).replace("{memberId}", memberId).replace("{day}", "2026-09-01");
            String label = route.getKey();
            assertThat(call(parts[0], path, null, Map.of()).status()).as(label + " không phiên").isEqualTo(401);
            assertThat(call(parts[0], path, outsider.token(), Map.of()).status()).as(label + " người ngoài").isEqualTo(404);
            if ("DELETE /api/trips/{tripId}/members/me".equals(label)) continue; // thành viên gọi sẽ RỜI chuyến: đã có MembershipApiIT.removeAndLeave
            int asMember = call(parts[0], path, member.token(), Map.of()).status();
            switch (route.getValue()) {
                case ORGANIZER -> assertThat(asMember).as(label + " thành viên thường").isEqualTo(403);
                case ORGANIZER_DELETED_TRIP -> assertThat(asMember).as(label + " thành viên thường").isEqualTo(404);
                case MEMBER_OWN_ITEM -> assertThat(asMember).as(label + " thành viên, mục của Organizer").isEqualTo(403);
                case MEMBER -> assertThat(asMember).as(label + " thành viên").isNotIn(401, 403, 404, 500);
            }
        }
        for (String route : SESSION_ROUTES) {
            String[] parts = route.split(" ", 2);
            assertThat(call(parts[0], parts[1], null, Map.of()).status()).as(route + " không phiên").isEqualTo(401);
        }
    }
}
