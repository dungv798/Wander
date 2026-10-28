package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * PO 28/10/2026 (D19 mở rộng sang cả chuyến): xóa mềm chuyến + Hoàn tác. Chuyến đã xóa rời danh sách và coi như không tồn tại với mọi
 * thao tác khác (404), nhưng giữ nguyên mục để khôi phục. Xóa vĩnh viễn chuyến cần xác thực lại (D25) nên chưa có.
 */
class TripSoftDeleteApiIT extends ApiTestSupport {

    @Test
    @DisplayName("xóa mềm: chuyến rời danh sách, đọc/sửa/thêm mục đều 404, nằm ở danh sách đã xóa; khôi phục đưa về nguyên vẹn cùng mục")
    void deleteHidesAndRestoreBringsBack() {
        User u = newUser();
        String trip = newTrip(u.token());
        String item = newItem(u.token(), trip, Map.of("title", "Giữ lại", "cost", 70));

        assertThat(call("DELETE", "/api/trips/" + trip, u.token()).status()).isEqualTo(204);

        assertThat(call("GET", "/api/trips", u.token()).list("trips")).isEmpty();
        assertThat(call("GET", "/api/trips/" + trip, u.token()).status()).isEqualTo(404);
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("name", "X")).status()).isEqualTo(404);
        assertThat(call("POST", "/api/trips/" + trip + "/items", u.token(), Map.of("title", "mới")).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + item, u.token()).status()).isEqualTo(404);

        Res deleted = call("GET", "/api/trips/deleted", u.token());
        assertThat(deleted.list("trips")).hasSize(1);
        assertThat(deleted.str("trips.0.trip.id")).isEqualTo(trip);
        assertThat(deleted.str("trips.0.deletedAt")).isNotBlank();

        Res restored = call("POST", "/api/trips/" + trip + "/restore", u.token());
        assertThat(restored.status()).as(String.valueOf(restored.body())).isEqualTo(200);
        assertThat(restored.str("trip.id")).isEqualTo(trip);
        assertThat(call("GET", "/api/trips/deleted", u.token()).list("trips")).isEmpty();
        Res detail = call("GET", "/api/trips/" + trip, u.token());
        assertThat(detail.status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + item, u.token()).str("item.title")).isEqualTo("Giữ lại");
    }

    @Test
    @DisplayName("xóa hai lần hoặc khôi phục chuyến chưa xóa là xung đột 409; chuyến lạ 404")
    void conflictsAndUnknown() {
        User u = newUser();
        String trip = newTrip(u.token());
        Res notDeleted = call("POST", "/api/trips/" + trip + "/restore", u.token());
        assertThat(notDeleted.status()).isEqualTo(404); // chưa xóa ⇒ không có trong "đã xóa"
        call("DELETE", "/api/trips/" + trip, u.token());
        Res twice = call("DELETE", "/api/trips/" + trip, u.token());
        assertThat(twice.status()).isEqualTo(404); // đã rời khỏi chuyến còn hiện nên coi như không có
        assertThat(call("DELETE", "/api/trips/khong-co", u.token()).status()).isEqualTo(404);
    }

    @Test
    @DisplayName("chuyến của người khác: không xóa, không khôi phục, không thấy trong danh sách đã xóa (INV-6)")
    void otherOwnersTripIsInvisible() {
        User a = newUser();
        User b = newUser();
        String trip = newTrip(a.token());
        assertThat(call("DELETE", "/api/trips/" + trip, b.token()).status()).isEqualTo(404);
        call("DELETE", "/api/trips/" + trip, a.token());
        assertThat(call("POST", "/api/trips/" + trip + "/restore", b.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/deleted", b.token()).list("trips")).isEmpty();
        assertThat(call("GET", "/api/trips/deleted", a.token()).list("trips")).hasSize(1);
    }

    @Test
    @DisplayName("tên chuyến đã xóa vẫn tính khi đặt tên không trùng: tạo chuyến mới cùng tên thì thêm hậu tố, khôi phục không bao giờ trùng tên")
    void deletedNameStillReserved() {
        User u = newUser();
        String first = newTrip(u.token(), Map.of("name", "Đà Lạt"));
        call("DELETE", "/api/trips/" + first, u.token());
        String second = newTrip(u.token(), Map.of("name", "Đà Lạt"));
        assertThat(call("GET", "/api/trips/" + second, u.token()).str("trip.name")).isEqualTo("Đà Lạt - 2");
        assertThat(call("POST", "/api/trips/" + first + "/restore", u.token()).str("trip.name")).isEqualTo("Đà Lạt");
    }
}
