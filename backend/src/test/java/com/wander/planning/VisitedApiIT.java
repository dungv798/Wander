package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Đã ghé dùng API completion cũ: kiểm quyền, trạng thái cá nhân và dữ liệu PostgreSQL thật. */
class VisitedApiIT extends ApiTestSupport {

    /** Hai thành viên với một địa điểm do Organizer thêm. */
    private record Setup(User org, User member, String trip, String item, String memberId, String orgId) {
    }

    /** Dựng dữ liệu độc lập cho từng test và xác nhận thành viên đã vào thành công. */
    private Setup setup() {
        User org = newUser();
        User member = newUser();
        String trip = newTrip(org.token());
        String code = call("POST", "/api/trips/" + trip + "/invites", org.token()).str("invite.code");
        Res joined = call("POST", "/api/invites/join", member.token(), map("code", code, "displayName", "An"));
        assertThat(joined.status()).isEqualTo(201);
        String item = newItem(org.token(), trip, Map.of("placeId", "mot-noi", "type", "food"));
        Res people = call("GET", "/api/trips/" + trip + "/members", org.token());
        return new Setup(org, member, trip, item, joined.str("member.id"), people.str("members.0.id"));
    }

    /** Đường dẫn mục do test sở hữu. */
    private String itemPath(Setup s) {
        return "/api/trips/" + s.trip() + "/items/" + s.item();
    }

    /** Tích/bỏ tích chỉ cho danh tính lấy từ phiên người gọi. */
    private Res tick(Setup s, User actor, boolean done) {
        return call("PUT", itemPath(s) + "/done", actor.token(), Map.of("done", done));
    }

    /** Số dòng completion thực sự lưu cho mục này. */
    private long stored(Setup s) {
        return jdbc.sql("SELECT count(*) FROM item_completions WHERE item_id = ?::uuid")
                .param(s.item()).query(Long.class).single();
    }

    /** Kiểm trạng thái riêng, tiến độ nhóm và hai lượt cùng nơi không ảnh hưởng nhau. */
    @Test
    @DisplayName("thành viên tích địa điểm người khác thêm, Organizer tích riêng, bỏ tích không đổi người khác hay lượt khác")
    void personalCompletionAndSharedProgress() {
        Setup s = setup();
        assertThat(call("GET", itemPath(s), s.member().token()).at("item.done")).isEqualTo(false);
        assertThat(tick(s, s.member(), true).at("item.done")).isEqualTo(true);
        assertThat(tick(s, s.member(), true).status()).isEqualTo(200);
        assertThat(stored(s)).isEqualTo(1);
        Res ownerView = call("GET", itemPath(s), s.org().token());
        assertThat(ownerView.at("item.done")).isEqualTo(false);
        assertThat(ownerView.list("item.doneBy")).containsExactly(s.memberId());
        assertThat(tick(s, s.org(), true).list("item.doneBy")).containsExactly(s.orgId(), s.memberId());
        assertThat(tick(s, s.member(), false).at("item.done")).isEqualTo(false);
        assertThat(call("GET", itemPath(s), s.org().token()).at("item.done")).isEqualTo(true);
        assertThat(stored(s)).isEqualTo(1);
        String repeat = newItem(s.org().token(), s.trip(), Map.of("placeId", "mot-noi"));
        assertThat(call("GET", "/api/trips/" + s.trip() + "/items/" + repeat, s.org().token()).at("item.done")).isEqualTo(false);
        Res detail = call("GET", "/api/trips/" + s.trip(), s.member().token());
        assertThat(detail.list("days.1.items")).hasSize(2);
        assertThat(String.valueOf(detail.body())).doesNotContain(s.org().identityId(), s.member().identityId());
    }

    /** Kiểm các ranh giới truy cập đều che tài nguyên bằng 404 và không cho người bị gỡ ghi thêm. */
    @Test
    @DisplayName("người lạ, mục khác chuyến, mã lạ, thành viên đã bị gỡ và chuyến đã xóa đều 404")
    void accessBoundaries() {
        Setup s = setup();
        User stranger = newUser();
        assertThat(tick(s, stranger, true).status()).isEqualTo(404);
        assertThat(call("GET", itemPath(s), stranger.token()).status()).isEqualTo(404);
        String otherTrip = newTrip(s.org().token());
        String foreign = newItem(s.org().token(), otherTrip, Map.of("placeId", "noi-khac"));
        String base = "/api/trips/" + s.trip() + "/items/";
        assertThat(call("PUT", base + foreign + "/done", s.org().token(), Map.of("done", true)).status()).isEqualTo(404);
        assertThat(call("PUT", base + UUID.randomUUID() + "/done", s.org().token(), Map.of("done", true)).status()).isEqualTo(404);
        assertThat(tick(s, s.member(), true).status()).isEqualTo(200);
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/members/" + s.memberId(), s.org().token()).status()).isEqualTo(204);
        assertThat(tick(s, s.member(), true).status()).isEqualTo(404);
        assertThat(tick(s, s.member(), false).status()).isEqualTo(404);
        assertThat(call("GET", itemPath(s), s.member().token()).status()).isEqualTo(404);
        assertThat(call("GET", itemPath(s), s.org().token()).list("item.doneBy")).isEmpty();
        assertThat(call("DELETE", "/api/trips/" + s.trip(), s.org().token()).status()).isEqualTo(204);
        assertThat(tick(s, s.org(), true).status()).isEqualTo(404);
    }

    /** Đầu vào sai không ghi dữ liệu, task cũ tiếp tục hoạt động. */
    @Test
    @DisplayName("done thiếu, null, sai kiểu bị từ chối; nghỉ/mục tự do giữ NOT_A_TASK; task vẫn tích được")
    void invalidInputAndTaskCompatibility() {
        Setup s = setup();
        for (Object invalid : new Object[] {null, "true", 1}) {
            Res result = call("PUT", itemPath(s) + "/done", s.member().token(), map("done", invalid));
            assertThat(result.status()).isEqualTo(400);
            assertThat(result.code()).isEqualTo("MALFORMED");
        }
        assertThat(call("PUT", itemPath(s) + "/done", s.member().token(), Map.of()).status()).isEqualTo(400);
        assertThat(stored(s)).isZero();
        for (String type : new String[] {"rest", "food"}) {
            String item = newItem(s.org().token(), s.trip(), Map.of("type", type));
            assertThat(call("PUT", "/api/trips/" + s.trip() + "/items/" + item + "/done", s.member().token(),
                    Map.of("done", true)).code()).isEqualTo("NOT_A_TASK");
        }
        String task = newItem(s.org().token(), s.trip(), Map.of("type", "task"));
        assertThat(call("PUT", "/api/trips/" + s.trip() + "/items/" + task + "/done", s.member().token(),
                Map.of("done", true)).at("item.done")).isEqualTo(true);
    }

    /** Hoàn thành bám theo mã mục qua đổi ngày và vòng đời đề nghị/xóa/khôi phục. */
    @Test
    @DisplayName("đề nghị đang chờ vẫn tích được, đổi ngày không mất dấu; duyệt xóa chặn tích, khôi phục trả dấu cũ, purge xóa dòng")
    void scheduleDeletionRequestAndUndo() {
        Setup s = setup();
        String requests = "/api/trips/" + s.trip() + "/deletion-requests";
        Res request = call("POST", requests, s.member().token(), Map.of("itemId", s.item()));
        assertThat(request.status()).isEqualTo(201);
        assertThat(tick(s, s.member(), true).status()).isEqualTo(200);
        assertThat(call("PATCH", itemPath(s), s.org().token(), Map.of("day", "2026-08-31")).status()).isEqualTo(200);
        assertThat(call("GET", itemPath(s), s.member().token()).at("item.done")).isEqualTo(true);
        assertThat(call("POST", requests + "/" + request.str("request.id") + "/approve", s.org().token()).status()).isEqualTo(200);
        for (boolean done : new boolean[] {true, false}) {
            Res deleted = tick(s, s.member(), done);
            assertThat(deleted.status()).isEqualTo(409);
            assertThat(deleted.code()).isEqualTo("ITEM_DELETED");
        }
        assertThat(stored(s)).isEqualTo(1);
        assertThat(call("POST", itemPath(s) + "/restore", s.org().token()).status()).isEqualTo(200);
        Res restored = call("GET", itemPath(s), s.member().token());
        assertThat(restored.at("item.done")).isEqualTo(true);
        assertThat(restored.str("item.day")).isEqualTo("2026-08-31");
        assertThat(call("DELETE", itemPath(s), s.org().token()).status()).isEqualTo(200);
        assertThat(call("DELETE", itemPath(s) + "/permanent", s.org().token()).status()).isEqualTo(204);
        assertThat(stored(s)).isZero();
        assertThat(tick(s, s.org(), true).status()).isEqualTo(404);
    }
}
