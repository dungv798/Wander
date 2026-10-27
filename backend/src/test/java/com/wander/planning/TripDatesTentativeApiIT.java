package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Lát 6 (DR-018 A3 "Dự kiến N ngày"): cờ {@code datesTentative} cho chuyến chưa chốt ngày. Ngày đi/về vẫn bắt buộc và vẫn
 * được kiểm như mọi chuyến (thứ trong tuần tính từ ngày đi); cờ chỉ để giao diện gắn nhãn "chưa chắc".
 */
class TripDatesTentativeApiIT extends ApiTestSupport {

    private Res create(User u, Map<String, Object> extra) {
        Map<String, Object> body = map("name", "Hà Giang", "destination", "Hà Giang", "startDate", "2026-08-29", "endDate", "2026-09-06");
        body.putAll(extra);
        return call("POST", "/api/trips", u.token(), body);
    }

    @Test
    @DisplayName("mặc định ngày đã chốt (datesTentative=false) ở tạo, danh sách và chi tiết")
    void defaultsToFalse() {
        User u = newUser();
        Res r = create(u, Map.of());
        assertThat(r.status()).isEqualTo(201);
        assertThat(r.at("trip.datesTentative")).isEqualTo(false);
        String id = r.str("trip.id");
        assertThat(call("GET", "/api/trips/" + id, u.token()).at("trip.datesTentative")).isEqualTo(false);
        assertThat(call("GET", "/api/trips", u.token()).at("trips.0.datesTentative")).isEqualTo(false);
    }

    @Test
    @DisplayName("tạo chuyến với ngày chưa chắc: lưu và trả về ở tạo, danh sách, chi tiết")
    void createTentative() {
        User u = newUser();
        Res r = create(u, map("datesTentative", true));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(201);
        assertThat(r.at("trip.datesTentative")).isEqualTo(true);
        assertThat(call("GET", "/api/trips/" + r.str("trip.id"), u.token()).at("trip.datesTentative")).isEqualTo(true);
        assertThat(call("GET", "/api/trips", u.token()).at("trips.0.datesTentative")).isEqualTo(true);
    }

    @Test
    @DisplayName("sửa cờ: không nêu thì giữ nguyên, false hoặc null thì bỏ; sửa tên không đụng tới cờ")
    void patchFlag() {
        User u = newUser();
        String id = create(u, map("datesTentative", true)).str("trip.id");
        String path = "/api/trips/" + id;

        assertThat(call("PATCH", path, u.token(), map("name", "Tên mới")).at("trip.datesTentative")).isEqualTo(true);
        assertThat(call("PATCH", path, u.token(), map("datesTentative", false)).at("trip.datesTentative")).isEqualTo(false);
        assertThat(call("PATCH", path, u.token(), map("datesTentative", true)).at("trip.datesTentative")).isEqualTo(true);
        assertThat(call("PATCH", path, u.token(), map("datesTentative", null)).at("trip.datesTentative")).isEqualTo(false);
    }

    @Test
    @DisplayName("giá trị không phải boolean bị từ chối MALFORMED và không đổi gì")
    void rejectsNonBoolean() {
        User u = newUser();
        for (Object bad : new Object[] {"true", 1, "yes", java.util.List.of(true)}) {
            Res r = create(u, map("datesTentative", bad));
            assertThat(r.status()).as("tạo với %s", bad).isEqualTo(400);
            assertThat(r.code()).isEqualTo("MALFORMED");
        }
        String id = create(u, map("datesTentative", true)).str("trip.id");
        Res patch = call("PATCH", "/api/trips/" + id, u.token(), map("datesTentative", "false"));
        assertThat(patch.code()).isEqualTo("MALFORMED");
        assertThat(call("GET", "/api/trips/" + id, u.token()).at("trip.datesTentative")).isEqualTo(true);
    }

    @Test
    @DisplayName("ngày chưa chắc vẫn phải có ngày đi/về hợp lệ; cờ không bị mất khi đổi khoảng ngày bằng lệnh lịch")
    void datesStillValidatedAndFlagSurvivesSchedule() {
        User u = newUser();
        Res bad = create(u, map("datesTentative", true, "endDate", "2026-08-01"));
        assertThat(bad.status()).isEqualTo(400);
        assertThat(bad.code()).isEqualTo("END_BEFORE_START");

        String id = create(u, map("datesTentative", true)).str("trip.id");
        Res scheduled = call("POST", "/api/trips/" + id + "/schedule", u.token(), map("endDate", "2026-09-08"));
        assertThat(scheduled.status()).as(String.valueOf(scheduled.body())).isEqualTo(200);
        assertThat(scheduled.at("trip.datesTentative")).isEqualTo(true);
        assertThat(scheduled.str("trip.endDate")).isEqualTo("2026-09-08");
    }
}
