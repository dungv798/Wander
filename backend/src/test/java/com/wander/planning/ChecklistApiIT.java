package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Checklist chuẩn bị (Q12): Organizer tạo, mỗi người tick riêng, ai cũng thấy tiến độ chung. */
class ChecklistApiIT extends ApiTestSupport {

    private record Setup(User org, User guest, String trip) {
    }

    private Setup setup() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String code = call("POST", "/api/trips/" + trip + "/invites", org.token()).str("invite.code");
        call("POST", "/api/invites/join", guest.token(), map("code", code, "displayName", "An"));
        return new Setup(org, guest, trip);
    }

    @Test
    @DisplayName("Organizer tạo hạng mục có nhóm; thành viên xem được nhưng không tạo/sửa/xóa (403); người ngoài 404")
    void onlyOrganizerManages() {
        Setup s = setup();
        User outsider = newUser();
        Res created = call("POST", "/api/trips/" + s.trip() + "/checklist", s.org().token(), map("group", "Giấy tờ", "title", "Mang CCCD"));
        assertThat(created.status()).as(String.valueOf(created.body())).isEqualTo(201);
        String id = created.str("item.id");
        assertThat(created.str("item.group")).isEqualTo("Giấy tờ");

        assertThat(call("POST", "/api/trips/" + s.trip() + "/checklist", s.guest().token(), map("title", "Lén")).status()).isEqualTo(403);
        assertThat(call("PATCH", "/api/trips/" + s.trip() + "/checklist/" + id, s.guest().token(), map("title", "X")).status()).isEqualTo(403);
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/checklist/" + id, s.guest().token()).status()).isEqualTo(403);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.guest().token()).list("items")).hasSize(1);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", outsider.token()).status()).isEqualTo(404);
        assertThat(call("PUT", "/api/trips/" + s.trip() + "/checklist/" + id + "/done", outsider.token(), Map.of("done", true)).status()).isEqualTo(404);

        assertThat(call("PATCH", "/api/trips/" + s.trip() + "/checklist/" + id, s.org().token(), map("title", "Mang hộ chiếu")).str("item.title")).isEqualTo("Mang hộ chiếu");
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/checklist/" + id, s.org().token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.org().token()).list("items")).isEmpty();
    }

    @Test
    @DisplayName("tick riêng từng người: tick của An không làm Organizer thành đã xong; ai cũng thấy ai đã xong (theo mã thành viên, không lộ danh tính)")
    void perPersonProgress() {
        Setup s = setup();
        String id = call("POST", "/api/trips/" + s.trip() + "/checklist", s.org().token(), map("title", "Sạc dự phòng")).str("item.id");
        assertThat(call("PUT", "/api/trips/" + s.trip() + "/checklist/" + id + "/done", s.guest().token(), Map.of("done", true)).status()).isEqualTo(200);
        String guestMember = call("GET", "/api/trips/" + s.trip() + "/members", s.org().token()).str("members.1.id");
        Res asOrg = call("GET", "/api/trips/" + s.trip() + "/checklist", s.org().token());
        assertThat(asOrg.str("items.0.done")).isEqualTo("false");
        assertThat(asOrg.list("items.0.doneBy")).containsExactly(guestMember);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.guest().token()).str("items.0.done")).isEqualTo("true");
        assertThat(String.valueOf(asOrg.body())).doesNotContain(s.guest().identityId()).doesNotContain(s.org().identityId());

        call("PUT", "/api/trips/" + s.trip() + "/checklist/" + id + "/done", s.org().token(), Map.of("done", true));
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.org().token()).list("items.0.doneBy")).hasSize(2);
        call("PUT", "/api/trips/" + s.trip() + "/checklist/" + id + "/done", s.guest().token(), Map.of("done", false));
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.org().token()).list("items.0.doneBy")).hasSize(1);
        assertThat(call("PUT", "/api/trips/" + s.trip() + "/checklist/" + id + "/done", s.guest().token(), Map.of("done", "yes")).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("checklist của chuyến này không đụng được từ chuyến khác (hạng mục theo cặp chuyến+mã); thành viên bị gỡ mất quyền ngay; tên trống 400")
    void isolation() {
        Setup s = setup();
        String other = newTrip(s.org().token());
        String id = call("POST", "/api/trips/" + s.trip() + "/checklist", s.org().token(), map("title", "Áo mưa")).str("item.id");
        assertThat(call("PUT", "/api/trips/" + other + "/checklist/" + id + "/done", s.org().token(), Map.of("done", true)).status()).isEqualTo(404);
        assertThat(call("DELETE", "/api/trips/" + other + "/checklist/" + id, s.org().token()).status()).isEqualTo(404);
        assertThat(call("POST", "/api/trips/" + s.trip() + "/checklist", s.org().token(), map("title", "   ")).status()).isEqualTo(400);

        String guestMember = call("GET", "/api/trips/" + s.trip() + "/members", s.org().token()).str("members.1.id");
        call("DELETE", "/api/trips/" + s.trip() + "/members/" + guestMember, s.org().token());
        assertThat(call("GET", "/api/trips/" + s.trip() + "/checklist", s.guest().token()).status()).isEqualTo(404);
    }
}
