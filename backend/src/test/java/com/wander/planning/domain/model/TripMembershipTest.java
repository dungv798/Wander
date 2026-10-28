package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.vocabulary.MemberRole;
import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Thành viên và liên kết mời của chuyến (Lát 1b, DR-021): bất biến nằm trong aggregate, không Spring, không DB. */
class TripMembershipTest {

    private static final Instant NOW = Instant.parse("2026-10-28T00:00:00Z");
    private static final DateRange RANGE = DateRange.of(LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-03"));
    private final UUID organizer = UUID.randomUUID();

    private Trip trip() {
        return Trip.plan(organizer, "Hà Giang", "ha-giang", RANGE, NOW);
    }

    private static void assertCode(Throwable thrown, String code) {
        assertThat(thrown).isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo(code));
    }

    private Trip withInvite(String hash) {
        Trip t = trip();
        t.circle().createInvite(organizer, hash, NOW);
        return t;
    }

    @Test
    @DisplayName("chuyến mới có đúng một Organizer là chủ chuyến, tên mặc định trung tính (không lấy tên thiết bị)")
    void newTripHasOneOrganizer() {
        Trip t = trip();
        assertThat(t.circle().members()).hasSize(1);
        TripMember o = t.circle().members().get(0);
        assertThat(o.role()).isEqualTo(MemberRole.ORGANIZER);
        assertThat(o.identityId()).isEqualTo(organizer);
        assertThat(o.displayName()).isEqualTo("Organizer");
        assertThat(t.roleOf(organizer)).contains(MemberRole.ORGANIZER);
        assertThat(t.roleOf(UUID.randomUUID())).isEmpty();
    }

    @Test
    @DisplayName("chỉ Organizer tạo liên kết; thành viên bị 403 NOT_ORGANIZER, người ngoài 404")
    void onlyOrganizerCreatesInvite() {
        Trip t = withInvite("h1");
        UUID member = UUID.randomUUID();
        t.joinWithInvite(member, "An", "h1", NOW);
        assertThatThrownBy(() -> t.circle().createInvite(member, "h2", NOW)).satisfies(e -> assertCode(e, "NOT_ORGANIZER"));
        assertThatThrownBy(() -> t.circle().createInvite(UUID.randomUUID(), "h2", NOW)).isInstanceOf(WanderException.class)
                .satisfies(e -> assertThat(((WanderException) e).code()).isNotEqualTo("NOT_ORGANIZER"));
    }

    @Test
    @DisplayName("tạo liên kết mới thu hồi liên kết đang bật (kể cả đã hết hạn): luôn chỉ một liên kết chưa thu hồi")
    void newInviteRevokesOld() {
        Trip t = withInvite("h1");
        t.circle().createInvite(organizer, "h2", NOW.plusSeconds(10));
        assertThat(t.circle().invites().stream().filter(i -> !i.isRevoked()).count()).isEqualTo(1);
        assertThat(t.circle().activeInvite(NOW.plusSeconds(11))).get().extracting(TripInvite::codeHash).isEqualTo("h2");
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "Bình", "h1", NOW.plusSeconds(11))).satisfies(e -> assertCode(e, "INVALID_INVITE"));
    }

    @Test
    @DisplayName("liên kết hết hạn sau 7 ngày; mã sai, đã thu hồi, hết hạn đều cùng một lỗi INVALID_INVITE")
    void inviteExpiresAndErrorsAreUniform() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        assertThatThrownBy(() -> t.joinWithInvite(guest, "An", "sai", NOW)).satisfies(e -> assertCode(e, "INVALID_INVITE"));
        assertThatThrownBy(() -> t.joinWithInvite(guest, "An", "h1", NOW.plusSeconds(7 * 86_400L + 1))).satisfies(e -> assertCode(e, "INVALID_INVITE"));
        t.joinWithInvite(guest, "An", "h1", NOW.plusSeconds(7 * 86_400L - 1));
        t.circle().revokeInvite(organizer, NOW);
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "Bình", "h1", NOW)).satisfies(e -> assertCode(e, "INVALID_INVITE"));
        assertThatThrownBy(() -> t.circle().revokeInvite(organizer, NOW)).isInstanceOf(WanderException.class);
    }

    @Test
    @DisplayName("vào chuyến: vai Thành viên; vào lại khi đã là thành viên thì trả đúng người cũ (idempotent), không thêm dòng")
    void joinIsIdempotent() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        TripMember first = t.joinWithInvite(guest, "An", "h1", NOW);
        TripMember again = t.joinWithInvite(guest, "Tên khác", "h1", NOW);
        assertThat(first.role()).isEqualTo(MemberRole.MEMBER);
        assertThat(again.id()).isEqualTo(first.id());
        assertThat(t.circle().members()).hasSize(2);
    }

    @Test
    @DisplayName("trần 10 thành viên kể cả Organizer: người thứ 11 nhận TRIP_FULL")
    void memberCap() {
        Trip t = withInvite("h1");
        for (int i = 1; i < 10; i++) t.joinWithInvite(UUID.randomUUID(), "TV" + i, "h1", NOW);
        assertThat(t.circle().members()).hasSize(10);
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "Thừa", "h1", NOW)).satisfies(e -> assertCode(e, "TRIP_FULL"));
    }

    @Test
    @DisplayName("tên hiển thị: trùng không phân biệt hoa thường thì thêm hậu tố; \"Organizer\" là tên dành riêng; hậu tố không làm vượt 40 ký tự; ký tự vô hình bị từ chối")
    void displayNames() {
        Trip t = withInvite("h1");
        TripMember a = t.joinWithInvite(UUID.randomUUID(), "An", "h1", NOW);
        TripMember b = t.joinWithInvite(UUID.randomUUID(), "aN", "h1", NOW);
        TripMember c = t.joinWithInvite(UUID.randomUUID(), "organizer", "h1", NOW);
        TripMember d = t.joinWithInvite(UUID.randomUUID(), "x".repeat(40), "h1", NOW);
        TripMember e = t.joinWithInvite(UUID.randomUUID(), "x".repeat(40), "h1", NOW);
        assertThat(a.displayName()).isEqualTo("An");
        assertThat(b.displayName()).isEqualTo("aN - 2");
        assertThat(c.displayName()).isEqualTo("organizer - 2");
        assertThat(d.displayName()).hasSize(40);
        assertThat(e.displayName()).hasSize(40).endsWith(" - 2");
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "A‮b", "h1", NOW)).satisfies(x -> assertCode(x, "MALFORMED"));
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "   ", "h1", NOW)).satisfies(x -> assertCode(x, "REQUIRED"));
    }

    @Test
    @DisplayName("gỡ thành viên: chỉ Organizer, không gỡ chính Organizer, gỡ thì thu hồi luôn liên kết đang bật (người bị gỡ không vào lại bằng mã cũ)")
    void removeMember() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        TripMember m = t.joinWithInvite(guest, "An", "h1", NOW);
        assertThatThrownBy(() -> t.circle().removeMember(guest, m.id(), NOW)).satisfies(e -> assertCode(e, "NOT_ORGANIZER"));
        UUID organizerMemberId = t.circle().members().get(0).id();
        assertThatThrownBy(() -> t.circle().removeMember(organizer, organizerMemberId, NOW)).satisfies(e -> assertCode(e, "ORGANIZER_CANNOT_LEAVE"));
        t.circle().removeMember(organizer, m.id(), NOW);
        assertThat(t.roleOf(guest)).isEmpty();
        assertThat(t.circle().activeInvite(NOW)).isEmpty();
        assertThatThrownBy(() -> t.joinWithInvite(guest, "An", "h1", NOW)).satisfies(e -> assertCode(e, "INVALID_INVITE"));
        assertThatThrownBy(() -> t.circle().removeMember(organizer, UUID.randomUUID(), NOW)).isInstanceOf(WanderException.class);
    }

    @Test
    @DisplayName("rời chuyến: thành viên rời được, Organizer thì không (ORGANIZER_CANNOT_LEAVE), người ngoài 404")
    void leave() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        t.joinWithInvite(guest, "An", "h1", NOW);
        t.circle().leave(guest, NOW);
        assertThat(t.roleOf(guest)).isEmpty();
        assertThatThrownBy(() -> t.circle().leave(organizer, NOW)).satisfies(e -> assertCode(e, "ORGANIZER_CANNOT_LEAVE"));
        assertThatThrownBy(() -> t.circle().leave(UUID.randomUUID(), NOW)).isInstanceOf(WanderException.class);
    }

    @Test
    @DisplayName("đổi tên hiển thị của mình theo cùng quy tắc (trùng thì hậu tố, không trùng với chính mình)")
    void renameSelf() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        t.joinWithInvite(guest, "An", "h1", NOW);
        t.joinWithInvite(UUID.randomUUID(), "Bình", "h1", NOW);
        assertThat(t.circle().renameMember(guest, "An", NOW).displayName()).isEqualTo("An");
        assertThat(t.circle().renameMember(guest, "bình", NOW).displayName()).isEqualTo("bình - 2");
    }

    @Test
    @DisplayName("chuyến đã xóa mềm không nhận thành viên mới (INVALID_INVITE)")
    void deletedTripRejectsJoin() {
        Trip t = withInvite("h1");
        t.moveToTrash(NOW);
        assertThatThrownBy(() -> t.joinWithInvite(UUID.randomUUID(), "An", "h1", NOW)).satisfies(e -> assertCode(e, "INVALID_INVITE"));
    }

    @Test
    @DisplayName("quyền sửa mục: Organizer sửa mọi mục; thành viên chỉ mục do mình thêm (403 NOT_YOUR_ITEM), người ngoài 404")
    void itemPermissions() {
        Trip t = withInvite("h1");
        UUID guest = UUID.randomUUID();
        TripMember m = t.joinWithInvite(guest, "An", "h1", NOW);
        Item mine = t.addItem(null, new ItemDetails(com.wander.planning.domain.vocabulary.ItemType.SIGHTSEEING, "Của An", null, null, null, ItemCost.UNKNOWN), null, m.id(), NOW);
        Item organizers = t.addItem(null, new ItemDetails(com.wander.planning.domain.vocabulary.ItemType.SIGHTSEEING, "Của chủ", null, null, null, ItemCost.UNKNOWN), null, NOW);
        t.requireMayChange(guest, mine);
        t.requireMayChange(organizer, mine);
        t.requireMayChange(organizer, organizers);
        assertThatThrownBy(() -> t.requireMayChange(guest, organizers)).satisfies(e -> assertCode(e, "NOT_YOUR_ITEM"));
        assertThatThrownBy(() -> t.requireMayChange(UUID.randomUUID(), mine)).isInstanceOf(WanderException.class)
                .satisfies(e -> assertThat(((WanderException) e).code()).isNotEqualTo("NOT_YOUR_ITEM"));
    }
}
