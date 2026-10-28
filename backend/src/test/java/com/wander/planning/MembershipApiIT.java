package com.wander.planning;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.support.ApiTestSupport;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Lát 1b (DR-021) mô-đun membership: liên kết mời, vào chuyến, vai, gỡ/rời, và các điều KHÔNG được lộ. */
class MembershipApiIT extends ApiTestSupport {

    private String inviteCode(User organizer, String trip) {
        Res created = call("POST", "/api/trips/" + trip + "/invites", organizer.token());
        assertThat(created.status()).as(String.valueOf(created.body())).isEqualTo(201);
        return created.str("invite.code");
    }

    private Res join(User who, String code, String name) {
        return call("POST", "/api/invites/join", who.token(), map("code", code, "displayName", name));
    }

    @Test
    @DisplayName("luồng đầy đủ: Organizer tạo liên kết, người lạ xem trước (công khai) rồi vào bằng tên hiển thị, thấy chuyến; người ngoài vẫn 404")
    void fullFlow() {
        User org = newUser();
        User guest = newUser();
        User outsider = newUser();
        String trip = newTrip(org.token(), Map.of("name", "Đà Lạt"));
        String code = inviteCode(org, trip);
        assertThat(code).hasSize(43);

        Res preview = call("POST", "/api/invites/preview", null, map("code", code));
        assertThat(preview.status()).isEqualTo(200);
        assertThat(preview.str("invite.tripName")).isEqualTo("Đà Lạt");
        assertThat(preview.str("invite.memberCount")).isEqualTo("1");

        Res joined = join(guest, code, "An");
        assertThat(joined.status()).as(String.valueOf(joined.body())).isEqualTo(201);
        assertThat(joined.str("tripId")).isEqualTo(trip);
        assertThat(joined.str("member.role")).isEqualTo("member");
        assertThat(joined.str("member.displayName")).isEqualTo("An");

        assertThat(call("GET", "/api/trips/" + trip, guest.token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips", guest.token()).list("trips")).hasSize(1);
        assertThat(call("GET", "/api/trips/" + trip, guest.token()).str("trip.role")).isEqualTo("member");
        assertThat(call("GET", "/api/trips/" + trip, org.token()).str("trip.role")).isEqualTo("organizer");
        assertThat(call("GET", "/api/trips/" + trip, outsider.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips", outsider.token()).list("trips")).isEmpty();

        Res members = call("GET", "/api/trips/" + trip + "/members", guest.token());
        assertThat(members.list("members")).hasSize(2);
        assertThat(call("POST", "/api/invites/join", guest.token(), map("code", code, "displayName", "Khác")).status()).as("vào lại = idempotent").isEqualTo(201);
        assertThat(call("GET", "/api/trips/" + trip + "/members", guest.token()).list("members")).hasSize(2);
    }

    @Test
    @DisplayName("mọi liên kết không dùng được (sai dạng, sai mã, thu hồi, hết hạn, chuyến đã xóa) trả CÙNG một lỗi, cùng mã trạng thái và thông báo")
    void uniformInvalidInvite() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String revoked = inviteCode(org, trip);
        assertThat(call("DELETE", "/api/trips/" + trip + "/invites/active", org.token()).status()).isEqualTo(204);
        String expired = inviteCode(org, trip);
        jdbc.sql("update trip_invites set expires_at = now() - interval '1 minute' where revoked_at is null").update();
        String deleted = inviteCode(org, newTrip(org.token()));
        String ofDeletedTrip = inviteCode(org, trip);
        call("DELETE", "/api/trips/" + trip, org.token());

        List<Res> previews = new ArrayList<>();
        List<Res> joins = new ArrayList<>();
        for (String bad : new String[] {"", "ngan", "x".repeat(43), revoked, expired, ofDeletedTrip}) {
            previews.add(call("POST", "/api/invites/preview", null, map("code", bad)));
            joins.add(join(guest, bad, "An"));
        }
        for (Res r : previews) {
            assertThat(r.status()).isEqualTo(400);
            assertThat(r.str("error.code")).isEqualTo("INVALID_INVITE");
            assertThat(r.str("error.message")).isEqualTo(previews.get(0).str("error.message"));
        }
        for (Res r : joins) {
            assertThat(r.status()).isEqualTo(400);
            assertThat(r.str("error.code")).isEqualTo("INVALID_INVITE");
        }
        assertThat(deleted).isNotBlank();
        assertThat(call("GET", "/api/trips", guest.token()).list("trips")).isEmpty();
    }

    @Test
    @DisplayName("trần 10 thành viên: người thứ 11 nhận TRIP_FULL; tên trùng thêm hậu tố, \"Organizer\" là tên dành riêng")
    void capAndNames() {
        User org = newUser();
        String trip = newTrip(org.token());
        String code = inviteCode(org, trip);
        assertThat(join(newUser(), code, "A‮b").status()).as("ký tự đảo chiều bị từ chối").isEqualTo(400);
        assertThat(join(newUser(), code, "organizer").str("member.displayName")).isEqualTo("organizer - 2");
        assertThat(join(newUser(), code, "ORGANIZER - 2").str("member.displayName")).isEqualTo("ORGANIZER - 2 - 2");
        for (int i = 3; i <= 9; i++) assertThat(join(newUser(), code, "TV" + i).status()).isEqualTo(201);
        Res full = join(newUser(), code, "Thừa");
        assertThat(full.status()).isEqualTo(409);
        assertThat(full.str("error.code")).isEqualTo("TRIP_FULL");
    }

    @Test
    @DisplayName("hai người cùng vào khi chỉ còn một chỗ: một người thắng, người kia nhận TRIP_FULL (không 500, không 11 người)")
    void concurrentJoinsRespectCap() throws Exception {
        User org = newUser();
        String trip = newTrip(org.token());
        String code = inviteCode(org, trip);
        for (int i = 1; i <= 8; i++) join(newUser(), code, "TV" + i);
        User a = newUser();
        User b = newUser();
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Callable<Res>> tasks = List.of(() -> join(a, code, "A"), () -> join(b, code, "B"));
            List<Integer> statuses = new ArrayList<>();
            for (Future<Res> f : pool.invokeAll(tasks)) statuses.add(f.get().status());
            assertThat(statuses).doesNotContain(500);
            assertThat(statuses.stream().filter(s -> s == 201).count()).isEqualTo(1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(call("GET", "/api/trips/" + trip + "/members", org.token()).list("members")).hasSize(10);
    }

    @Test
    @DisplayName("gỡ thành viên: người bị gỡ lập tức 404 trên mọi route, không vào lại bằng mã cũ (liên kết bị thu hồi); Organizer không gỡ/rời được")
    void removeAndLeave() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String code = inviteCode(org, trip);
        join(guest, code, "An");
        String memberId = call("GET", "/api/trips/" + trip + "/members", org.token()).str("members.1.id");
        String organizerMemberId = call("GET", "/api/trips/" + trip + "/members", org.token()).str("members.0.id");

        assertThat(call("DELETE", "/api/trips/" + trip + "/members/" + memberId, guest.token()).status()).as("thành viên không gỡ ai").isEqualTo(403);
        Res selfRemove = call("DELETE", "/api/trips/" + trip + "/members/" + organizerMemberId, org.token());
        assertThat(selfRemove.status()).isEqualTo(409);
        assertThat(selfRemove.str("error.code")).isEqualTo("ORGANIZER_CANNOT_LEAVE");
        assertThat(call("DELETE", "/api/trips/" + trip + "/members/me", org.token()).status()).isEqualTo(409);

        assertThat(call("DELETE", "/api/trips/" + trip + "/members/" + memberId, org.token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + trip, guest.token()).status()).isEqualTo(404);
        assertThat(call("GET", "/api/trips/" + trip + "/members", guest.token()).status()).isEqualTo(404);
        assertThat(join(guest, code, "An").str("error.code")).isEqualTo("INVALID_INVITE");
        assertThat(call("GET", "/api/trips/" + trip + "/invites", org.token()).str("invite")).isNull();

        String fresh = inviteCode(org, trip);
        join(guest, fresh, "An");
        assertThat(call("DELETE", "/api/trips/" + trip + "/members/me", guest.token()).status()).isEqualTo(204);
        assertThat(call("GET", "/api/trips/" + trip, guest.token()).status()).isEqualTo(404);
    }

    @Test
    @DisplayName("quyền theo vai: thành viên không tạo/xem liên kết, không sửa chuyến, không xếp ngày, không xóa chuyến, không xóa vĩnh viễn (403); người ngoài 404")
    void roleGates() {
        User org = newUser();
        User guest = newUser();
        User outsider = newUser();
        String trip = newTrip(org.token());
        join(guest, inviteCode(org, trip), "An");
        String item = newItem(org.token(), trip, Map.of("title", "Của chủ"));
        for (Object[] c : new Object[][] {
                {"POST", "/api/trips/" + trip + "/invites"}, {"GET", "/api/trips/" + trip + "/invites"}, {"DELETE", "/api/trips/" + trip + "/invites/active"},
                {"PATCH", "/api/trips/" + trip}, {"DELETE", "/api/trips/" + trip}, {"POST", "/api/trips/" + trip + "/schedule"},
                {"DELETE", "/api/trips/" + trip + "/items/" + item + "/permanent"}}) {
            String m = (String) c[0];
            String p = (String) c[1];
            Res asMember = call(m, p, guest.token(), Map.of("name", "X"));
            assertThat(asMember.status()).as(m + " " + p + " thành viên").isEqualTo(403);
            assertThat(asMember.str("error.code")).isEqualTo("NOT_ORGANIZER");
            assertThat(call(m, p, outsider.token(), Map.of("name", "X")).status()).as(m + " " + p + " người ngoài").isEqualTo(404);
        }
        assertThat(call("GET", "/api/trips/" + trip, org.token()).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("mục: thành viên thêm trực tiếp; sửa/xóa/khôi phục chỉ mục của mình (403 NOT_YOUR_ITEM với mục người khác); Organizer làm được mọi mục")
    void itemOwnership() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        join(guest, inviteCode(org, trip), "An");
        String orgItem = newItem(org.token(), trip, Map.of("title", "Của chủ"));
        Res added = call("POST", "/api/trips/" + trip + "/items", guest.token(), map("title", "Của An", "type", "food"));
        assertThat(added.status()).as(String.valueOf(added.body())).isEqualTo(201);
        String mine = added.str("item.id");
        assertThat(added.str("item.addedBy")).isNotBlank();

        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + mine, guest.token(), Map.of("note", "ghi chú")).status()).isEqualTo(200);
        Res others = call("PATCH", "/api/trips/" + trip + "/items/" + orgItem, guest.token(), Map.of("note", "x"));
        assertThat(others.status()).isEqualTo(403);
        assertThat(others.str("error.code")).isEqualTo("NOT_YOUR_ITEM");
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + orgItem, guest.token()).status()).isEqualTo(403);
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + mine, guest.token()).status()).isEqualTo(200);
        assertThat(call("POST", "/api/trips/" + trip + "/items/" + mine + "/restore", guest.token()).status()).isEqualTo(200);
        assertThat(call("PATCH", "/api/trips/" + trip + "/items/" + mine, org.token(), Map.of("note", "chủ sửa")).status()).isEqualTo(200);
        assertThat(call("DELETE", "/api/trips/" + trip + "/items/" + mine, org.token()).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip + "/trash", guest.token()).list("items")).hasSize(1);
    }

    @Test
    @DisplayName("tick việc cần làm theo từng người: tick của An không làm Organizer thành đã xong, và ngược lại")
    void perMemberCompletion() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        join(guest, inviteCode(org, trip), "An");
        String task = newItem(org.token(), trip, Map.of("title", "Mang sạc", "type", "task"));
        assertThat(call("PUT", "/api/trips/" + trip + "/items/" + task + "/done", guest.token(), Map.of("done", true)).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + task, guest.token()).str("item.done")).isEqualTo("true");
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + task, org.token()).str("item.done")).isEqualTo("false");
        String guestMemberId = call("GET", "/api/trips/" + trip + "/members", org.token()).str("members.1.id");
        String organizerMemberId = call("GET", "/api/trips/" + trip + "/members", org.token()).str("members.0.id");
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + task, org.token()).list("item.doneBy")).containsExactly(guestMemberId);
        assertThat(call("PUT", "/api/trips/" + trip + "/items/" + task + "/done", org.token(), Map.of("done", true)).status()).isEqualTo(200);
        assertThat(call("GET", "/api/trips/" + trip + "/items/" + task, guest.token()).list("item.doneBy")).containsExactly(organizerMemberId, guestMemberId);
        assertThat(String.valueOf(call("GET", "/api/trips/" + trip, guest.token()).body())).doesNotContain(guest.identityId()).doesNotContain(org.identityId());
    }

    @Test
    @DisplayName("không lộ: phản hồi thành viên không chứa mã danh tính; trạng thái liên kết không chứa mã hay băm; mã chỉ có ở lần tạo")
    void noLeaks() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String code = inviteCode(org, trip);
        join(guest, code, "An");
        String members = String.valueOf(call("GET", "/api/trips/" + trip + "/members", guest.token()).body());
        assertThat(members).doesNotContain(org.identityId()).doesNotContain(guest.identityId());
        String status = String.valueOf(call("GET", "/api/trips/" + trip + "/invites", org.token()).body());
        assertThat(status).doesNotContain(code).doesNotContain("codeHash").doesNotContain("code_hash");
        String stored = jdbc.sql("select code_hash from trip_invites limit 1").query(String.class).single();
        assertThat(stored).isNotEqualTo(code).hasSize(64);
    }

    @Test
    @DisplayName("tạo liên kết mới thu hồi liên kết cũ (luôn tối đa một đang bật) và đổi tên hiển thị của mình")
    void newInviteReplacesOldAndRename() {
        User org = newUser();
        User guest = newUser();
        String trip = newTrip(org.token());
        String first = inviteCode(org, trip);
        String second = inviteCode(org, trip);
        assertThat(join(newUser(), first, "Cũ").str("error.code")).isEqualTo("INVALID_INVITE");
        assertThat(join(guest, second, "An").status()).isEqualTo(201);
        Res renamed = call("PATCH", "/api/trips/" + trip + "/members/me", guest.token(), Map.of("displayName", "An Nguyễn", "role", "organizer"));
        assertThat(renamed.status()).isEqualTo(200);
        assertThat(renamed.str("member.displayName")).isEqualTo("An Nguyễn");
        assertThat(renamed.str("member.role")).as("không đổi được vai bằng body (mass assignment)").isEqualTo("member");
        assertThat(jdbc.sql("select count(*) from trip_invites where revoked_at is null and trip_id = ?::uuid").param(trip).query(Integer.class).single()).isEqualTo(1);
    }
}
