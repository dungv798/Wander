package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Đề nghị xóa (DR-021 H2/H3) qua API: thành viên gửi, Organizer đồng ý/từ chối, người đề nghị thấy kết quả. */
class DeletionRequestApiIT extends ApiTestSupport {

    private record Setup(User org, User guest, String trip, String orgItem, String guestItem) {
    }

    private Setup setup() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String code = call("POST", "/api/trips/" + trip + "/invites", org.token()).str("invite.code");
        call("POST", "/api/invites/join", guest.token(), map("code", code, "displayName", "An"));
        String orgItem = newItem(org.token(), trip, Map.of("title", "Của chủ"));
        String guestItem = call("POST", "/api/trips/" + trip + "/items", guest.token(), map("title", "Của An", "type", "food")).str("item.id");
        return new Setup(org, guest, trip, orgItem, guestItem);
    }

    private Res submit(Setup s, String item, String reason) {
        return call("POST", "/api/trips/" + s.trip() + "/deletion-requests", s.guest().token(), map("itemId", item, "reason", reason));
    }

    @Test
    @DisplayName("gửi → Organizer thấy trong hàng chờ → đồng ý ⇒ mục vào Đã xóa gần đây; người đề nghị thấy approved")
    void approveFlow() {
        Setup s = setup();
        Res sent = submit(s, s.orgItem(), "hết chỗ");
        assertThat(sent.status()).as(String.valueOf(sent.body())).isEqualTo(201);
        assertThat(sent.str("request.status")).isEqualTo("pending");
        assertThat(sent.str("request.requesterName")).isEqualTo("An");
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.org().token()).list("requests")).hasSize(1);
        String id = sent.str("request.id");

        Res approved = call("POST", "/api/trips/" + s.trip() + "/deletion-requests/" + id + "/approve", s.org().token());
        assertThat(approved.status()).isEqualTo(200);
        assertThat(approved.str("request.status")).isEqualTo("approved");
        assertThat(call("GET", "/api/trips/" + s.trip() + "/trash", s.org().token()).list("items")).hasSize(1);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.guest().token()).str("requests.0.status")).isEqualTo("approved");
        assertThat(call("POST", "/api/trips/" + s.trip() + "/deletion-requests/" + id + "/reject", s.org().token()).str("error.code")).isEqualTo("ALREADY_DECIDED");
    }

    @Test
    @DisplayName("từ chối ⇒ mục còn nguyên, người đề nghị thấy rejected; thành viên khác không thấy hay xử lý đề nghị của người khác")
    void rejectAndVisibility() {
        Setup s = setup();
        User other = newUser();
        String code = call("POST", "/api/trips/" + s.trip() + "/invites", s.org().token()).str("invite.code");
        call("POST", "/api/invites/join", other.token(), map("code", code, "displayName", "Bình"));
        String id = submit(s, s.orgItem(), null).str("request.id");
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", other.token()).list("requests")).isEmpty();
        assertThat(call("POST", "/api/trips/" + s.trip() + "/deletion-requests/" + id + "/approve", other.token()).status()).isEqualTo(403);
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/deletion-requests/" + id, other.token()).status()).isEqualTo(404);

        assertThat(call("POST", "/api/trips/" + s.trip() + "/deletion-requests/" + id + "/reject", s.org().token()).str("request.status")).isEqualTo("rejected");
        assertThat(call("GET", "/api/trips/" + s.trip() + "/items/" + s.orgItem(), s.org().token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/trash", s.org().token()).list("items")).isEmpty();
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.guest().token()).str("requests.0.status")).isEqualTo("rejected");
    }

    @Test
    @DisplayName("quy tắc: mục của mình ⇒ xóa thẳng (409); Organizer không cần đề nghị (409); trùng đề nghị (409); lý do quá dài và thiếu mục (400); hủy khi còn chờ")
    void rules() {
        Setup s = setup();
        assertThat(submit(s, s.guestItem(), null).str("error.code")).isEqualTo("OWN_ITEM_DELETE_DIRECTLY");
        assertThat(call("POST", "/api/trips/" + s.trip() + "/deletion-requests", s.org().token(), map("itemId", s.guestItem())).str("error.code")).isEqualTo("ORGANIZER_DELETES_DIRECTLY");
        assertThat(submit(s, s.orgItem(), "x".repeat(201)).status()).isEqualTo(400);
        assertThat(call("POST", "/api/trips/" + s.trip() + "/deletion-requests", s.guest().token(), Map.of()).status()).isEqualTo(400);
        String id = submit(s, s.orgItem(), null).str("request.id");
        assertThat(submit(s, s.orgItem(), null).str("error.code")).isEqualTo("REQUEST_EXISTS");
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/deletion-requests/" + id, s.guest().token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.org().token()).list("requests")).isEmpty();
    }

    @Test
    @DisplayName("thành viên rời chuyến thì đề nghị đang chờ của họ biến mất; xóa vĩnh viễn mục thì đề nghị của mục đó biến mất")
    void cleanup() {
        Setup s = setup();
        submit(s, s.orgItem(), null);
        call("DELETE", "/api/trips/" + s.trip() + "/members/me", s.guest().token());
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.org().token()).list("requests")).isEmpty();

        String code = call("POST", "/api/trips/" + s.trip() + "/invites", s.org().token()).str("invite.code");
        call("POST", "/api/invites/join", s.guest().token(), map("code", code, "displayName", "An"));
        submit(s, s.orgItem(), null);
        call("DELETE", "/api/trips/" + s.trip() + "/items/" + s.orgItem(), s.org().token());
        assertThat(call("DELETE", "/api/trips/" + s.trip() + "/items/" + s.orgItem() + "/permanent", s.org().token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + s.trip() + "/deletion-requests", s.org().token()).list("requests")).isEmpty();
    }
}
