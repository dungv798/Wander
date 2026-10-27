package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Q11 (DR-002, gói C): ngân sách + kiểu chuyến + nhịp qua API. */
class TripOptionsApiIT extends ApiTestSupport {

    private Res createWith(User u, Map<String, Object> options) {
        Map<String, Object> body = map("name", "Hà Giang", "destination", "Hà Giang", "startDate", "2026-08-29", "endDate", "2026-09-06");
        body.putAll(options);
        return call("POST", "/api/trips", u.token(), body);
    }

    @Test
    @DisplayName("tạo chuyến không nêu tùy chọn: tất cả chưa đặt; chi tiết chuyến không có khối ngân sách")
    void defaultsAreEmpty() {
        User u = newUser();
        Res r = createWith(u, Map.of());
        assertThat(r.status()).isEqualTo(201);
        assertThat(r.at("trip.budgetK")).isNull();
        assertThat(r.at("trip.budgetFormatted")).isNull();
        assertThat(r.list("trip.styles")).isEmpty();
        assertThat(r.at("trip.pace")).isNull();
        assertThat(call("GET", "/api/trips/" + r.str("trip.id"), u.token()).at("budget")).isNull();
    }

    @Test
    @DisplayName("tạo chuyến kèm ngân sách, kiểu (sắp theo thứ tự cố định, bỏ trùng) và nhịp; hiện trong danh sách chuyến")
    void createWithOptions() {
        User u = newUser();
        Res r = createWith(u, map("budget", 5000, "styles", List.of("friends", "relax", "friends"), "pace", "moderate"));
        assertThat(r.status()).isEqualTo(201);
        assertThat(r.num("trip.budgetK")).isEqualTo(5000);
        assertThat(r.str("trip.budgetFormatted")).isEqualTo("5.000.000 ₫");
        assertThat(r.str("trip.styles.0.code")).isEqualTo("relax");
        assertThat(r.str("trip.styles.0.label")).isEqualTo("Nghỉ dưỡng");
        assertThat(r.str("trip.styles.1.code")).isEqualTo("friends");
        assertThat(r.list("trip.styles")).hasSize(2);
        assertThat(r.str("trip.pace.code")).isEqualTo("moderate");
        assertThat(r.str("trip.pace.label")).isEqualTo("Vừa");

        Res list = call("GET", "/api/trips", u.token());
        assertThat(list.num("trips.0.budgetK")).isEqualTo(5000);
        assertThat(list.str("trips.0.pace.label")).isEqualTo("Vừa");
    }

    @Test
    @DisplayName("ngân sách theo D17/D18: để trống là chưa đặt, 0 là đã đặt bằng 0, âm/thập phân/quá lớn bị từ chối")
    void budgetValidation() {
        User u = newUser();
        assertThat(createWith(u, map("budget", "")).at("trip.budgetK")).isNull();
        Res zero = createWith(u, map("budget", 0));
        assertThat(zero.num("trip.budgetK")).isZero();
        assertThat(zero.str("trip.budgetFormatted")).isEqualTo("0 ₫");

        Res negative = createWith(u, map("budget", -1));
        assertThat(negative.code()).isEqualTo("NEGATIVE");
        assertThat(negative.str("error.field")).isEqualTo("budget");
        assertThat(createWith(u, map("budget", 1.5)).code()).isEqualTo("MALFORMED");
        assertThat(createWith(u, map("budget", "150k")).code()).isEqualTo("MALFORMED");
        assertThat(createWith(u, map("budget", 1_000_000_001L)).code()).isEqualTo("TOO_LARGE");
        assertThat(call("GET", "/api/trips", u.token()).list("trips")).hasSize(2); // chuyến lỗi không được tạo
    }

    @Test
    @DisplayName("kiểu và nhịp không hợp lệ bị từ chối; tối đa 5 kiểu")
    void styleAndPaceValidation() {
        User u = newUser();
        assertThat(createWith(u, map("styles", List.of("khong-co"))).code()).isEqualTo("INVALID_STYLE");
        assertThat(createWith(u, map("styles", "relax")).code()).isEqualTo("INVALID_STYLE");
        assertThat(createWith(u, map("styles", List.of(1))).code()).isEqualTo("INVALID_STYLE");
        assertThat(createWith(u, map("pace", "nhanh")).code()).isEqualTo("INVALID_PACE");
        Res tooMany = createWith(u, map("styles", List.of("relax", "explore", "food", "beach", "mountain", "city")));
        assertThat(tooMany.code()).isEqualTo("TOO_MANY");
        assertThat(createWith(u, map("styles", List.of("relax", "explore", "food", "beach", "mountain"))).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("sửa tùy chọn: không nêu thì giữ nguyên, null hoặc rỗng thì xóa; sửa tên không đụng tới tùy chọn")
    void patchOptions() {
        User u = newUser();
        String trip = createWith(u, map("budget", 3000, "styles", List.of("city"), "pace", "packed")).str("trip.id");

        Res renamed = call("PATCH", "/api/trips/" + trip, u.token(), Map.of("name", "Tên mới"));
        assertThat(renamed.str("trip.name")).isEqualTo("Tên mới");
        assertThat(renamed.num("trip.budgetK")).isEqualTo(3000);
        assertThat(renamed.str("trip.styles.0.code")).isEqualTo("city");
        assertThat(renamed.str("trip.pace.code")).isEqualTo("packed");

        Res changed = call("PATCH", "/api/trips/" + trip, u.token(), map("budget", 0, "styles", List.of("beach", "family"), "pace", null));
        assertThat(changed.num("trip.budgetK")).isZero();
        assertThat(changed.list("trip.styles")).hasSize(2);
        assertThat(changed.at("trip.pace")).isNull();

        Res cleared = call("PATCH", "/api/trips/" + trip, u.token(), map("budget", null, "styles", List.of()));
        assertThat(cleared.at("trip.budgetK")).isNull();
        assertThat(cleared.list("trip.styles")).isEmpty();

        // rỗng ("") cũng là xóa, nhất quán giữa ngân sách, kiểu và nhịp (biểu mẫu gửi chuỗi rỗng)
        call("PATCH", "/api/trips/" + trip, u.token(), map("budget", 10, "styles", List.of("food"), "pace", "relaxed"));
        Res emptied = call("PATCH", "/api/trips/" + trip, u.token(), map("budget", "", "styles", "", "pace", ""));
        assertThat(emptied.status()).isEqualTo(200);
        assertThat(emptied.at("trip.budgetK")).isNull();
        assertThat(emptied.list("trip.styles")).isEmpty();
        assertThat(emptied.at("trip.pace")).isNull();

        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("budget", -5)).code()).isEqualTo("NEGATIVE");
        assertThat(call("GET", "/api/trips/" + trip, u.token()).at("trip.budgetK")).isNull(); // lỗi không làm đổi gì

        User other = newUser();
        assertThat(call("PATCH", "/api/trips/" + trip, other.token(), Map.of("budget", 1)).status()).isEqualTo(404);
    }

    @Test
    @DisplayName("ngân sách so với tổng phải trả thêm: mục chưa rõ giá được đếm riêng (không coi là 0), 'đã bao gồm' và mục đã xóa không tính")
    void budgetComparison() {
        User u = newUser();
        String trip = createWith(u, map("budget", 1000)).str("trip.id");

        Res empty = call("GET", "/api/trips/" + trip, u.token());
        assertThat(empty.num("budget.budgetK")).isEqualTo(1000);
        assertThat(empty.num("budget.extraK")).isZero();
        assertThat(empty.num("budget.unknownCount")).isZero();
        assertThat(empty.at("budget.over")).isEqualTo(false);
        assertThat(empty.num("budget.gapK")).isEqualTo(1000);
        assertThat(empty.str("budget.gapFormatted")).isEqualTo("1.000.000 ₫");

        newItem(u.token(), trip, Map.of("type", "lodging", "title", "Khách sạn", "cost", 400));
        newItem(u.token(), trip, Map.of("type", "food", "title", "Phở")); // chưa rõ giá
        newItem(u.token(), trip, Map.of("type", "tour", "title", "Tour", "cost", 900, "included", true, "referenceCost", 900));
        newItem(u.token(), trip, Map.of("type", "rest", "title", "Nghỉ")); // không có giá: không tính là chưa rõ
        newItem(u.token(), trip, Map.of("type", "task", "title", "In vé"));
        Res mid = call("GET", "/api/trips/" + trip, u.token());
        assertThat(mid.num("budget.extraK")).isEqualTo(400);
        assertThat(mid.num("budget.unknownCount")).isEqualTo(1);
        assertThat(mid.at("budget.over")).isEqualTo(false);
        assertThat(mid.num("budget.gapK")).isEqualTo(600);

        String big = newItem(u.token(), trip, Map.of("type", "transport", "title", "Thuê xe", "cost", 800));
        Res over = call("GET", "/api/trips/" + trip, u.token());
        assertThat(over.num("budget.extraK")).isEqualTo(1200);
        assertThat(over.at("budget.over")).isEqualTo(true);
        assertThat(over.num("budget.gapK")).isEqualTo(200);
        assertThat(over.str("budget.gapFormatted")).isEqualTo("200.000 ₫");

        // xóa mềm rồi khôi phục: chênh lệch đổi theo
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + big, u.token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip, u.token()).at("budget.over")).isEqualTo(false);
        assertThat(call("GET", "/api/trips/" + trip, u.token()).num("budget.gapK")).isEqualTo(600);
        call("POST", "/api/trips/" + trip + "/items/" + big + "/restore", u.token());
        assertThat(call("GET", "/api/trips/" + trip, u.token()).at("budget.over")).isEqualTo(true);

        // ngân sách 0 khác chưa đặt: tổng > 0 thì vượt
        call("PATCH", "/api/trips/" + trip, u.token(), Map.of("budget", 0));
        Res zero = call("GET", "/api/trips/" + trip, u.token());
        assertThat(zero.at("budget.over")).isEqualTo(true);
        assertThat(zero.num("budget.gapK")).isEqualTo(1200);
        // xóa ngân sách: khối ngân sách biến mất
        call("PATCH", "/api/trips/" + trip, u.token(), map("budget", null));
        assertThat(call("GET", "/api/trips/" + trip, u.token()).at("budget")).isNull();
    }
}
