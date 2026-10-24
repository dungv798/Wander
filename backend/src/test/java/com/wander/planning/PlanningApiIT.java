package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Chuyển từ server/test/api.test.ts: cùng kịch bản, cùng kỳ vọng, chạy trên Spring Boot + PostgreSQL thật. */
class PlanningApiIT extends ApiTestSupport {

    private static final String DAY2 = "2026-08-30";

    // ---- Danh tính và phiên (D15; INV-1, INV-2, INV-6) ----

    @Test
    @DisplayName("yêu cầu không có phiên hợp lệ bị từ chối")
    void rejectsWithoutSession() {
        assertThat(call("GET", "/api/trips", null).status()).isEqualTo(401);
        assertThat(call("GET", "/api/trips", "khong-phai-token-hop-le-nao-ca-1234").status()).isEqualTo(401);
        assertThat(call("GET", "/api/trips", "ngan").status()).isEqualTo(401);
        assertThat(call("GET", "/api/trips", null).code()).isEqualTo("UNAUTHENTICATED");
    }

    @Test
    @DisplayName("token không được lưu nguyên văn trong cơ sở dữ liệu")
    void tokenStoredHashed() {
        User u = newUser();
        List<String> hashes = jdbc.sql("SELECT token_hash FROM sessions WHERE identity_id = ?::uuid")
                .param(u.identityId()).query(String.class).list();
        assertThat(hashes).hasSize(1);
        assertThat(hashes.get(0)).isNotEqualTo(u.token()).matches("^[0-9a-f]{64}$");
    }

    @Test
    @DisplayName("INV-2: phiên đã thu hồi mất quyền ngay ở yêu cầu kế tiếp")
    void revokedSessionLosesAccess() {
        User u = newUser();
        String trip = newTrip(u.token());
        assertThat(call("GET", "/api/trips/" + trip, u.token()).status()).isEqualTo(200);
        jdbc.sql("UPDATE sessions SET revoked_at = now() WHERE identity_id = ?::uuid").param(u.identityId()).update();
        assertThat(call("GET", "/api/trips/" + trip, u.token()).status()).isEqualTo(401);
        assertThat(call("POST", "/api/trips/" + trip + "/items", u.token(), item(Map.of("type", "food", "title", "x"))).status())
                .isEqualTo(401);
    }

    @Test
    @DisplayName("INV-6: chuyến của người khác trả về không tìm thấy, giống chuyến không tồn tại")
    void foreignTripLooksMissing() {
        User a = newUser();
        User b = newUser();
        String trip = newTrip(a.token());
        String it = newItem(a.token(), trip, Map.of());

        Res missing = call("GET", "/api/trips/00000000-0000-0000-0000-000000000000", b.token());
        Res foreign = call("GET", "/api/trips/" + trip, b.token());
        assertThat(foreign.status()).isEqualTo(404);
        assertThat(foreign.body()).isEqualTo(missing.body());
        assertThat(call("GET", "/api/trips/khong-phai-uuid", b.token()).status()).isEqualTo(404);

        assertThat(call("PATCH", "/api/trips/" + trip, b.token(), Map.of("name", "bị chiếm")).status()).isEqualTo(404);
        assertThat(call("POST", "/api/trips/" + trip + "/items", b.token(), item(Map.of("type", "food", "title", "x"))).status())
                .isEqualTo(404);
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + it, b.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/" + trip + "/trash", b.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips", b.token()).list("trips")).isEmpty();
        assertThat(call("GET", "/api/trips/" + trip, a.token()).str("trip.name")).isEqualTo("Hà Giang – Tà Xùa");
    }

    @Test
    @DisplayName("nội dung gửi lên: JSON hỏng bị chặn, nội dung quá lớn bị chặn")
    void bodyValidation() {
        User u = newUser();
        Res bad = callRaw("POST", "/api/trips", u.token(), "{khong phai json");
        assertThat(bad.status()).isEqualTo(400);
        assertThat(bad.code()).isEqualTo("INVALID_JSON");
        assertThat(callRaw("POST", "/api/trips", u.token(), "[1,2]").code()).isEqualTo("INVALID_JSON");
        Res big = call("POST", "/api/trips", u.token(), Map.of("name", "x".repeat(70_000)));
        assertThat(big.status()).isEqualTo(413);
        assertThat(big.code()).isEqualTo("BODY_TOO_LARGE");
    }

    // ---- Chuyến: A-1, A-2 ----

    @Test
    @DisplayName("A-1: tạo chuyến cần tên, điểm đến, ngày đi, ngày về hợp lệ")
    void createTripValidation() {
        User u = newUser();
        assertThat(call("POST", "/api/trips", u.token(), trip(map("startDate", null))).code()).isEqualTo("START_REQUIRED");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("endDate", ""))).code()).isEqualTo("END_REQUIRED");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("endDate", "2026-08-01"))).code()).isEqualTo("END_BEFORE_START");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("endDate", "2026-02-30"))).code()).isEqualTo("INVALID_DATE");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("endDate", "2028-01-01"))).code()).isEqualTo("TOO_LONG");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("name", "  "))).code()).isEqualTo("REQUIRED");
        assertThat(call("POST", "/api/trips", u.token(), trip(map("destination", null))).status()).isEqualTo(400);
        assertThat(call("POST", "/api/trips", u.token(), trip(map())).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("A-2: chuyến 29/08–06/09/2026 có 9 ngày kèm thứ trong tuần")
    void tripDays() {
        User u = newUser();
        Res d = call("GET", "/api/trips/" + newTrip(u.token()), u.token());
        assertThat(d.num("dayCount")).isEqualTo(9);
        assertThat(d.list("days")).hasSize(9);
        assertThat(d.str("days.0.date")).isEqualTo("2026-08-29");
        assertThat(d.str("days.0.weekdayLabel")).isEqualTo("T7");
        assertThat(d.str("days.8.date")).isEqualTo("2026-09-06");
        assertThat(d.num("totals.extraK")).isZero();
        assertThat(d.str("totals.extraFormatted")).isEqualTo("0 ₫");
    }

    // ---- Mục: A-3…A-7, A-9…A-11 ----

    @Test
    @DisplayName("A-3/A-4/A-9/A-10: thêm mục vào ngày đã chọn; đủ 9 loại; Nghỉ và Việc cần làm")
    void allNineTypes() {
        User u = newUser();
        String trip = newTrip(u.token());
        List<String> types = List.of("sightseeing", "food", "transport", "lodging", "car_rental", "shopping", "tour", "rest", "task");
        for (String t : types) {
            Res r = call("POST", "/api/trips/" + trip + "/items", u.token(), map("day", "2026-08-31", "type", t, "title", "Mục " + t));
            assertThat(r.status()).as(t).isEqualTo(201);
            assertThat(r.str("item.day")).isEqualTo("2026-08-31");
        }
        Res d = call("GET", "/api/trips/" + trip, u.token());
        List<Object> items = d.list("days.2.items");
        assertThat(items).hasSize(9);
        assertThat(labelOf(items, "rest")).isEqualTo("Nghỉ");
        assertThat(labelOf(items, "task")).isEqualTo("Việc cần làm");
        assertThat(call("POST", "/api/trips/" + trip + "/items", u.token(), map("day", "2026-08-31", "type", "khong-co", "title", "x"))
                .code()).isEqualTo("INVALID_TYPE");
    }

    @Test
    @DisplayName("A-3: tiêu đề và ngày bắt buộc; ngày phải nằm trong chuyến")
    void itemFieldValidation() {
        User u = newUser();
        String path = "/api/trips/" + newTrip(u.token()) + "/items";
        Map<String, Object> base = map("day", DAY2, "type", "food", "title", "Phở");
        assertThat(call("POST", path, u.token(), with(base, "title", " ")).code()).isEqualTo("REQUIRED");
        assertThat(call("POST", path, u.token(), with(base, "day", null)).code()).isEqualTo("INVALID_DATE");
        assertThat(call("POST", path, u.token(), with(base, "day", "2026-09-07")).code()).isEqualTo("DAY_OUT_OF_RANGE");
        assertThat(call("POST", path, u.token(), with(base, "timeOfDay", "25:00")).status()).isEqualTo(400);
        assertThat(call("POST", path, u.token(), with(base, "timeOfDay", "9h")).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), with(base, "durationMin", -5)).status()).isEqualTo(400);
        assertThat(call("POST", path, u.token(), with(base, "durationMin", 1.5)).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), with(base, "title", "x".repeat(201))).code()).isEqualTo("TOO_LONG");
    }

    @Test
    @DisplayName("D16/A-5: giờ và thời lượng để trống được; thứ tự thủ công không bị đổi giờ làm xáo trộn")
    void manualOrderKept() {
        User u = newUser();
        String trip = newTrip(u.token());
        String a = newItem(u.token(), trip, Map.of("title", "A", "timeOfDay", "09:00"));
        String b = newItem(u.token(), trip, Map.of("title", "B"));
        String c = newItem(u.token(), trip, Map.of("title", "C", "timeOfDay", "08:00"));
        assertThat(titles(u, trip, 1)).containsExactly("A", "B", "C");

        Res re = call("POST", "/api/trips/" + trip + "/days/" + DAY2 + "/reorder", u.token(), Map.of("orderedIds", List.of(c, a, b)));
        assertThat(re.status()).isEqualTo(200);
        assertThat(re.list("items")).hasSize(3);
        assertThat(titles(u, trip, 1)).containsExactly("C", "A", "B");

        call("PATCH", "/api/trips/" + trip + "/items/" + a, u.token(), Map.of("timeOfDay", "05:00"));
        assertThat(titles(u, trip, 1)).containsExactly("C", "A", "B");
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + a, u.token()).str("item.timeOfDay")).isEqualTo("05:00");
    }

    @Test
    @DisplayName("A-5: sắp xếp phải gồm đúng các mục đang hiện trong ngày")
    void reorderValidation() {
        User u = newUser();
        String trip = newTrip(u.token());
        String a = newItem(u.token(), trip, Map.of("title", "A"));
        String b = newItem(u.token(), trip, Map.of("title", "B"));
        String path = "/api/trips/" + trip + "/days/" + DAY2 + "/reorder";
        assertThat(call("POST", path, u.token(), Map.of("orderedIds", List.of(a))).code()).isEqualTo("INVALID_ORDER");
        assertThat(call("POST", path, u.token(), Map.of("orderedIds", List.of(a, a))).code()).isEqualTo("INVALID_ORDER");
        assertThat(call("POST", path, u.token(), Map.of("orderedIds", List.of(a, "khong-co"))).code()).isEqualTo("INVALID_ORDER");
        assertThat(call("POST", path, u.token(), Map.of("orderedIds", "abc")).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), Map.of("orderedIds", List.of(b, a))).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("A-7: sửa mọi trường và chuyển mục sang ngày khác (xuống cuối ngày mới, ngày cũ liền mạch)")
    void editAndMoveItem() {
        User u = newUser();
        String trip = newTrip(u.token());
        String a = newItem(u.token(), trip, Map.of("title", "A"));
        newItem(u.token(), trip, Map.of("title", "B"));
        newItem(u.token(), trip, Map.of("title", "X", "day", "2026-08-31"));

        Res r = call("PATCH", "/api/trips/" + trip + "/items/" + a, u.token(), Map.of(
                "title", "A đã sửa", "type", "food", "note", "ghi chú", "timeOfDay", "12:15", "durationMin", 60, "day", "2026-08-31"));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(200);
        assertThat(r.str("item.day")).isEqualTo("2026-08-31");
        assertThat(r.str("item.title")).isEqualTo("A đã sửa");
        assertThat(r.str("item.type")).isEqualTo("food");
        assertThat(r.num("item.position")).isEqualTo(1);

        Res d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(titlesAndPositions(d, 1)).containsExactly("B@0");
        assertThat(titlesAndPositions(d, 2)).containsExactly("X@0", "A đã sửa@1");

        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + a, u.token(), Map.of("day", "2026-12-01")).code())
                .isEqualTo("DAY_OUT_OF_RANGE");
        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + a, u.token(), map("note", null)).str("item.note")).isNull();
    }

    // ---- Tiền: A-6, R2–R4 ----

    @Test
    @DisplayName("A-6/R4: trống = chưa biết, 0 = đã biết bằng 0, đã bao gồm không cộng vào tổng")
    void costSemantics() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("cost", 150));
        newItem(u.token(), trip, Map.of("cost", 0));
        newItem(u.token(), trip, Map.of());
        newItem(u.token(), trip, Map.of("cost", "", "included", true, "referenceCost", 500));
        Res d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(d.num("totals.extraK")).isEqualTo(150);
        assertThat(d.str("totals.extraFormatted")).isEqualTo("150.000 ₫");
        assertThat(d.str("days.1.items.0.costFormatted")).isEqualTo("150.000 ₫");
        assertThat(d.num("days.1.items.1.costK")).isZero();
        assertThat(d.str("days.1.items.1.costFormatted")).isEqualTo("0 ₫");
        assertThat(d.at("days.1.items.2.costK")).isNull();
        assertThat(d.at("days.1.items.2.costFormatted")).isNull();
        assertThat(d.at("days.1.items.3.included")).isEqualTo(true);
        assertThat(d.str("days.1.items.3.referenceFormatted")).isEqualTo("500.000 ₫");
    }

    @Test
    @DisplayName("R3: chi phí âm và định dạng sai bị chặn khi tạo và khi sửa")
    void costValidation() {
        User u = newUser();
        String trip = newTrip(u.token());
        String path = "/api/trips/" + trip + "/items";
        Map<String, Object> base = map("day", DAY2, "type", "food", "title", "x");
        assertThat(call("POST", path, u.token(), with(base, "cost", -1)).code()).isEqualTo("NEGATIVE");
        assertThat(call("POST", path, u.token(), with(base, "cost", "-7")).code()).isEqualTo("NEGATIVE");
        assertThat(call("POST", path, u.token(), with(base, "cost", "1.5")).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), with(base, "cost", 1.5)).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), with(base, "cost", "150k")).code()).isEqualTo("MALFORMED");
        assertThat(call("POST", path, u.token(), with(base, "cost", "abc")).str("error.field")).isEqualTo("cost");
        assertThat(call("POST", path, u.token(), with(base, "cost", 1_000_000_001L)).code()).isEqualTo("TOO_LARGE");
        assertThat(call("POST", path, u.token(), with(base, "cost", "00000000000150")).status()).isEqualTo(201);
        assertThat(call("POST", path, u.token(), map("day", DAY2, "type", "food", "title", "x", "cost", 100, "referenceCost", 5))
                .code()).isEqualTo("REFERENCE_REQUIRES_INCLUDED");
        String it = newItem(u.token(), trip, Map.of("cost", 10));
        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + it, u.token(), Map.of("cost", -3)).status()).isEqualTo(400);
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + it, u.token()).num("item.costK")).isEqualTo(10);
    }

    @Test
    @DisplayName("R4: bỏ tick \"đã bao gồm\" thì tổng cộng lại chi phí và giá tham khảo bị xóa")
    void untickIncluded() {
        User u = newUser();
        String trip = newTrip(u.token());
        String it = newItem(u.token(), trip, Map.of("cost", 200, "included", true, "referenceCost", 200));
        assertThat(call("GET", "/api/trips/" + trip, u.token()).num("totals.extraK")).isZero();
        Res r = call("PATCH", "/api/trips/" + trip + "/items/" + it, u.token(), Map.of("included", false));
        assertThat(r.status()).as(String.valueOf(r.body())).isEqualTo(200);
        assertThat(r.at("item.referenceK")).isNull();
        assertThat(call("GET", "/api/trips/" + trip, u.token()).num("totals.extraK")).isEqualTo(200);
    }

    // ---- Xóa mềm, Hoàn tác, Đã xóa gần đây: D19, R7, A-8 ----

    @Test
    @DisplayName("R7/A-8: xóa mềm bỏ mục khỏi lịch và tổng; khôi phục về đúng ngày và vị trí cũ")
    void softDeleteAndRestore() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("title", "A", "cost", 100));
        String b = newItem(u.token(), trip, Map.of("title", "B", "cost", 200));
        newItem(u.token(), trip, Map.of("title", "C", "cost", 300));

        Res del = call("DELETE", "/api/trips/" + trip + "/items/" + b, u.token());
        assertThat(del.status()).isEqualTo(200);
        assertThat(del.str("item.deletedAt")).isNotNull();
        assertThat(titles(u, trip, 1)).containsExactly("A", "C");
        Res d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(d.num("totals.extraK")).isEqualTo(400);
        assertThat(d.num("trashCount")).isEqualTo(1);
        assertThat(call("GET", "/api/trips/" + trip + "/trash", u.token()).str("items.0.title")).isEqualTo("B");

        Res restored = call("POST", "/api/trips/" + trip + "/items/" + b + "/restore", u.token());
        assertThat(restored.status()).isEqualTo(200);
        assertThat(restored.at("item.deletedAt")).isNull();
        assertThat(titles(u, trip, 1)).containsExactly("A", "B", "C");
        d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(d.num("totals.extraK")).isEqualTo(600);
        assertThat(d.num("trashCount")).isZero();
    }

    @Test
    @DisplayName("D19: mục đã xóa giữ đến khi xóa vĩnh viễn, không tự hết hạn")
    void trashDoesNotExpire() {
        User u = newUser();
        String trip = newTrip(u.token());
        String it = newItem(u.token(), trip, Map.of("title", "A"));
        call("DELETE", "/api/trips/" + trip + "/items/" + it, u.token());
        jdbc.sql("UPDATE items SET deleted_at = '2020-01-01T00:00:00Z' WHERE id = ?::uuid").param(it).update();
        assertThat(call("GET", "/api/trips/" + trip + "/trash", u.token()).list("items")).hasSize(1);
        assertThat(call("POST", "/api/trips/" + trip + "/items/" + it + "/restore", u.token()).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("A-8: xóa vĩnh viễn chỉ áp dụng cho mục trong \"Đã xóa gần đây\" và không khôi phục được")
    void permanentDelete() {
        User u = newUser();
        String trip = newTrip(u.token());
        String it = newItem(u.token(), trip, Map.of("title", "A"));
        String base = "/api/trips/" + trip + "/items/" + it;
        assertThat(call("DELETE", base + "/permanent", u.token()).code()).isEqualTo("NOT_IN_TRASH");
        call("DELETE", base, u.token());
        assertThat(call("DELETE", base, u.token()).code()).isEqualTo("ALREADY_DELETED");
        assertThat(call("DELETE", base + "/permanent", u.token()).status()).isEqualTo(204);
        assertThat(call("POST", base + "/restore", u.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/" + trip + "/trash", u.token()).list("items")).isEmpty();
    }

    @Test
    @DisplayName("A-8: không khôi phục mục chưa xóa; không sửa mục đã xóa")
    void deletedItemRules() {
        User u = newUser();
        String trip = newTrip(u.token());
        String it = newItem(u.token(), trip, Map.of("title", "A"));
        String base = "/api/trips/" + trip + "/items/" + it;
        assertThat(call("POST", base + "/restore", u.token()).code()).isEqualTo("NOT_DELETED");
        call("DELETE", base, u.token());
        assertThat(call("PATCH", base, u.token(), Map.of("title", "B")).code()).isEqualTo("ITEM_DELETED");
    }

    // ---- R12: đổi ngày chuyến ----

    @Test
    @DisplayName("R12: không cho đổi khoảng ngày nếu còn mục nằm ngoài, kể cả mục đã xóa mềm")
    void dateChangeBlockedByOrphans() {
        User u = newUser();
        String trip = newTrip(u.token());
        String live = newItem(u.token(), trip, Map.of("day", "2026-08-29"));
        Res blocked = call("PATCH", "/api/trips/" + trip, u.token(), Map.of("startDate", DAY2));
        assertThat(blocked.status()).isEqualTo(409);
        assertThat(blocked.code()).isEqualTo("DATES_ORPHAN_ITEMS");
        assertThat(blocked.list("error.details.dates")).containsExactly("2026-08-29");

        call("DELETE", "/api/trips/" + trip + "/items/" + live, u.token());
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("startDate", DAY2)).status()).isEqualTo(409);

        call("DELETE", "/api/trips/" + trip + "/items/" + live + "/permanent", u.token());
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("startDate", DAY2)).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip, u.token()).num("dayCount")).isEqualTo(8);
    }

    @Test
    @DisplayName("A-1: đổi tên chuyến không bị R12 chặn; đổi sang khoảng sai bị từ chối")
    void renameTrip() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("day", "2026-08-29"));
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("name", "Tên mới")).str("trip.name")).isEqualTo("Tên mới");
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("endDate", "2026-01-01")).code()).isEqualTo("END_BEFORE_START");
        assertThat(call("PATCH", "/api/trips/" + trip, u.token(), Map.of("endDate", "2026-09-10")).status()).isEqualTo(200);
    }

    // ---- Việc cần làm: A-10, D10, P5 ----

    @Test
    @DisplayName("A-10: chỉ \"Việc cần làm\" có ô tích; trạng thái giữ khi mở lại")
    void taskCheckbox() {
        User u = newUser();
        String trip = newTrip(u.token());
        String task = newItem(u.token(), trip, Map.of("type", "task", "title", "In vé"));
        String food = newItem(u.token(), trip, Map.of("type", "food", "title", "Phở"));
        String base = "/api/trips/" + trip + "/items/";

        assertThat(call("PUT", base + food + "/done", u.token(), Map.of("done", true)).code()).isEqualTo("NOT_A_TASK");
        assertThat(call("PUT", base + task + "/done", u.token(), Map.of("done", "có")).status()).isEqualTo(400);

        assertThat(call("PUT", base + task + "/done", u.token(), Map.of("done", true)).at("item.done")).isEqualTo(true);
        Res d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(doneOf(d.list("days.1.items"), task)).isTrue();
        assertThat(doneOf(d.list("days.1.items"), food)).isFalse();
        assertThat(call("PUT", base + task + "/done", u.token(), Map.of("done", false)).at("item.done")).isEqualTo(false);
    }

    @Test
    @DisplayName("A-0 (phần dữ liệu): cùng phiên mở từ thiết bị khác thấy đủ dữ liệu đã lưu phía server")
    void dataLivesOnServer() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("title", "Giữ nguyên", "cost", 123));
        Res other = call("GET", "/api/trips/" + trip, u.token());
        assertThat(other.str("days.1.items.0.title")).isEqualTo("Giữ nguyên");
        assertThat(other.num("totals.extraK")).isEqualTo(123);
    }

    // ---- A-13, A-16 ----

    @Test
    @DisplayName("A-13: tổng theo ngày và theo loại khớp tổng cả chuyến và cùng quy tắc loại trừ")
    void totalsByDayAndType() {
        User u = newUser();
        String trip = newTrip(u.token());
        newItem(u.token(), trip, Map.of("day", DAY2, "type", "food", "cost", 100));
        newItem(u.token(), trip, Map.of("day", DAY2, "type", "food"));
        newItem(u.token(), trip, Map.of("day", "2026-08-31", "type", "lodging", "cost", 700));
        newItem(u.token(), trip, Map.of("day", "2026-08-31", "type", "tour", "cost", 300, "included", true, "referenceCost", 300));
        String gone = newItem(u.token(), trip, Map.of("day", "2026-08-31", "type", "shopping", "cost", 999));
        call("DELETE", "/api/trips/" + trip + "/items/" + gone, u.token());

        Res d = call("GET", "/api/trips/" + trip, u.token());
        assertThat(d.num("totals.extraK")).isEqualTo(800);
        List<Object> byDay = d.list("totals.byDay");
        assertThat(byDay).hasSize(9);
        assertThat(totalFor(byDay, "date", DAY2)).isEqualTo(100);
        assertThat(totalFor(byDay, "date", "2026-08-31")).isEqualTo(700);
        assertThat(totalFor(byDay, "date", "2026-09-01")).isZero();
        assertThat(byDay.stream().mapToLong(x -> ((Number) ((Map<?, ?>) x).get("extraK")).longValue()).sum()).isEqualTo(800);

        List<Object> byType = d.list("totals.byType");
        assertThat(byType.stream().map(x -> String.valueOf(((Map<?, ?>) x).get("type"))).toList()).containsExactly("food", "lodging", "tour");
        assertThat(totalFor(byType, "type", "tour")).isZero();
        assertThat(byType.stream().filter(x -> "lodging".equals(((Map<?, ?>) x).get("type"))).findFirst()
                .map(x -> ((Map<?, ?>) x).get("extraFormatted")).orElseThrow()).isEqualTo("700.000 ₫");
    }

    @Test
    @DisplayName("A-16: danh sách việc cần làm chưa xong khớp ô tích, theo ngày và thứ tự trong ngày")
    void pendingTasks() {
        User u = newUser();
        String trip = newTrip(u.token());
        String t2 = newItem(u.token(), trip, Map.of("day", "2026-08-31", "type", "task", "title", "Đổi tiền"));
        String t1a = newItem(u.token(), trip, Map.of("day", DAY2, "type", "task", "title", "In vé"));
        String t1b = newItem(u.token(), trip, Map.of("day", DAY2, "type", "task", "title", "Mua thuốc", "timeOfDay", "08:00"));
        newItem(u.token(), trip, Map.of("day", DAY2, "type", "food", "title", "Phở"));
        String base = "/api/trips/" + trip + "/items/";

        assertThat(pending(u, trip)).containsExactly("In vé", "Mua thuốc", "Đổi tiền");
        call("PUT", base + t1a + "/done", u.token(), Map.of("done", true));
        assertThat(pending(u, trip)).containsExactly("Mua thuốc", "Đổi tiền");

        List<Object> ids = new ArrayList<>(call("GET", "/api/trips/" + trip, u.token()).list("days.1.items").stream()
                .map(x -> ((Map<?, ?>) x).get("id")).toList());
        Collections.reverse(ids);
        assertThat(call("POST", "/api/trips/" + trip + "/days/" + DAY2 + "/reorder", u.token(), Map.of("orderedIds", ids)).status())
                .isEqualTo(200);

        call("DELETE", base + t1b, u.token());
        assertThat(pending(u, trip)).containsExactly("Đổi tiền");
        call("POST", base + t1b + "/restore", u.token());
        assertThat(pending(u, trip)).containsExactly("Mua thuốc", "Đổi tiền");
        call("PUT", base + t2 + "/done", u.token(), Map.of("done", true));
        call("PUT", base + t1b + "/done", u.token(), Map.of("done", true));
        assertThat(pending(u, trip)).isEmpty();
    }

    // ---- hỗ trợ ----

    private static Map<String, Object> trip(Map<String, Object> overrides) {
        Map<String, Object> m = map("name", "Chuyến", "destination", "Hà Giang", "startDate", "2026-08-29", "endDate", "2026-09-06");
        m.putAll(overrides);
        return m;
    }

    private static Map<String, Object> with(Map<String, Object> base, String key, Object value) {
        Map<String, Object> m = map();
        m.putAll(base);
        m.put(key, value);
        return m;
    }

    private List<String> titles(User u, String trip, int dayIndex) {
        return call("GET", "/api/trips/" + trip, u.token()).list("days." + dayIndex + ".items").stream()
                .map(x -> (String) ((Map<?, ?>) x).get("title")).toList();
    }

    private static List<String> titlesAndPositions(Res d, int dayIndex) {
        return d.list("days." + dayIndex + ".items").stream()
                .map(x -> ((Map<?, ?>) x).get("title") + "@" + ((Map<?, ?>) x).get("position")).toList();
    }

    private List<String> pending(User u, String trip) {
        return call("GET", "/api/trips/" + trip, u.token()).list("pendingTasks").stream()
                .map(x -> (String) ((Map<?, ?>) x).get("title")).toList();
    }

    private static Object labelOf(List<Object> items, String type) {
        return items.stream().map(x -> (Map<?, ?>) x).filter(x -> type.equals(x.get("type"))).findFirst()
                .map(x -> x.get("typeLabel")).orElseThrow();
    }

    private static boolean doneOf(List<Object> items, String id) {
        return items.stream().map(x -> (Map<?, ?>) x).filter(x -> id.equals(x.get("id"))).findFirst()
                .map(x -> (Boolean) x.get("done")).orElseThrow();
    }

    private static long totalFor(List<Object> rows, String key, String value) {
        return rows.stream().map(x -> (Map<?, ?>) x).filter(x -> value.equals(x.get(key))).findFirst()
                .map(x -> ((Number) x.get("extraK")).longValue()).orElseThrow();
    }
}
