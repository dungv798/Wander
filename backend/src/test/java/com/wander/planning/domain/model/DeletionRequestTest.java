package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.planning.domain.vocabulary.RequestStatus;
import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Đề nghị xóa (DR-021 H2/H3): thành viên đề nghị xóa mục của người khác, Organizer duyệt; không phải "đề xuất thêm". */
class DeletionRequestTest {

    private static final Instant NOW = Instant.parse("2026-10-28T00:00:00Z");
    private final UUID organizer = UUID.randomUUID();
    private final UUID guest = UUID.randomUUID();
    private Trip trip;
    private TripMember guestMember;
    private Item organizersItem;
    private Item guestsItem;

    private static ItemDetails details(String title) {
        return new ItemDetails(ItemType.SIGHTSEEING, title, null, null, null, ItemCost.UNKNOWN);
    }

    private void setUp() {
        trip = Trip.plan(organizer, "Hà Giang", "ha-giang", DateRange.of(LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-03")), NOW);
        trip.circle().createInvite(organizer, "h", NOW);
        guestMember = trip.joinWithInvite(guest, "An", "h", NOW);
        organizersItem = trip.addItem(null, details("Của chủ"), null, trip.circle().memberOf(organizer).orElseThrow().id(), NOW);
        guestsItem = trip.addItem(null, details("Của An"), null, guestMember.id(), NOW);
    }

    private static void assertCode(Throwable thrown, String code) {
        assertThat(thrown).isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo(code));
    }

    @Test
    @DisplayName("thành viên đề nghị xóa mục của người khác (lý do tùy chọn, chuẩn hóa); mục vẫn nằm trên lịch cho tới khi được duyệt")
    void submit() {
        setUp();
        DeletionRequest r = trip.circle().submitDeletion(guest, organizersItem, "  hết  chỗ ", NOW);
        assertThat(r.status()).isEqualTo(RequestStatus.PENDING);
        assertThat(r.reason()).isEqualTo("hết chỗ");
        assertThat(r.requesterMemberId()).isEqualTo(guestMember.id());
        assertThat(organizersItem.isDeleted()).isFalse();
    }

    @Test
    @DisplayName("không đề nghị xóa mục của chính mình (xóa thẳng được), Organizer xóa thẳng không cần đề nghị, người ngoài 404, mục đã xóa thì xung đột")
    void submitRules() {
        setUp();
        assertThatThrownBy(() -> trip.circle().submitDeletion(guest, guestsItem, null, NOW)).satisfies(e -> assertCode(e, "OWN_ITEM_DELETE_DIRECTLY"));
        assertThatThrownBy(() -> trip.circle().submitDeletion(organizer, guestsItem, null, NOW)).satisfies(e -> assertCode(e, "ORGANIZER_DELETES_DIRECTLY"));
        assertThatThrownBy(() -> trip.circle().submitDeletion(UUID.randomUUID(), organizersItem, null, NOW)).isInstanceOf(WanderException.class)
                .satisfies(e -> assertThat(((WanderException) e).code()).isNotEqualTo("OWN_ITEM_DELETE_DIRECTLY"));
        trip.softDelete(organizersItem.id(), NOW);
        assertThatThrownBy(() -> trip.circle().submitDeletion(guest, organizersItem, null, NOW)).satisfies(e -> assertCode(e, "ITEM_DELETED"));
    }

    @Test
    @DisplayName("mỗi mục tối đa một đề nghị đang chờ; mỗi thành viên tối đa 20 đề nghị chờ; lý do quá 200 ký tự bị từ chối")
    void limits() {
        setUp();
        trip.circle().submitDeletion(guest, organizersItem, null, NOW);
        assertThatThrownBy(() -> trip.circle().submitDeletion(guest, organizersItem, null, NOW)).satisfies(e -> assertCode(e, "REQUEST_EXISTS"));
        for (int i = 0; i < 19; i++) {
            Item other = trip.addItem(null, details("M" + i), null, trip.circle().memberOf(organizer).orElseThrow().id(), NOW);
            trip.circle().submitDeletion(guest, other, null, NOW);
        }
        Item extra = trip.addItem(null, details("Thừa"), null, null, NOW);
        assertThatThrownBy(() -> trip.circle().submitDeletion(guest, extra, null, NOW)).satisfies(e -> assertCode(e, "TOO_MANY_REQUESTS"));
        Item fresh = trip.addItem(null, details("Mới"), null, null, NOW);
        assertThatThrownBy(() -> trip.circle().submitDeletion(guest, fresh, "x".repeat(201), NOW)).satisfies(e -> assertCode(e, "TOO_LONG"));
    }

    @Test
    @DisplayName("Organizer duyệt: đồng ý ⇒ trạng thái approved (mục do bộ xử lý xóa mềm); từ chối ⇒ rejected, người đề nghị vẫn thấy; không duyệt hai lần; thành viên không duyệt được")
    void decide() {
        setUp();
        DeletionRequest a = trip.circle().submitDeletion(guest, organizersItem, null, NOW);
        assertThatThrownBy(() -> trip.circle().decideDeletion(guest, a.id(), true, NOW)).satisfies(e -> assertCode(e, "NOT_ORGANIZER"));
        DeletionRequest approved = trip.circle().decideDeletion(organizer, a.id(), true, NOW.plusSeconds(5));
        assertThat(approved.status()).isEqualTo(RequestStatus.APPROVED);
        assertThat(approved.decidedAt()).isEqualTo(NOW.plusSeconds(5));
        assertThatThrownBy(() -> trip.circle().decideDeletion(organizer, a.id(), false, NOW)).satisfies(e -> assertCode(e, "ALREADY_DECIDED"));
        assertThatThrownBy(() -> trip.circle().decideDeletion(organizer, UUID.randomUUID(), true, NOW)).isInstanceOf(WanderException.class);
    }

    @Test
    @DisplayName("người đề nghị tự hủy khi còn chờ; không hủy đề nghị của người khác hay đề nghị đã duyệt")
    void cancel() {
        setUp();
        DeletionRequest a = trip.circle().submitDeletion(guest, organizersItem, null, NOW);
        assertThatThrownBy(() -> trip.circle().cancelDeletion(organizer, a.id())).isInstanceOf(WanderException.class);
        trip.circle().cancelDeletion(guest, a.id());
        assertThat(trip.circle().requests()).isEmpty();
        DeletionRequest b = trip.circle().submitDeletion(guest, organizersItem, null, NOW);
        trip.circle().decideDeletion(organizer, b.id(), false, NOW);
        assertThatThrownBy(() -> trip.circle().cancelDeletion(guest, b.id())).satisfies(e -> assertCode(e, "ALREADY_DECIDED"));
    }

    @Test
    @DisplayName("xóa vĩnh viễn mục thì đề nghị của mục đó biến mất; thành viên rời/bị gỡ thì đề nghị đang chờ của họ biến mất")
    void cleanup() {
        setUp();
        trip.circle().submitDeletion(guest, organizersItem, null, NOW);
        trip.softDelete(organizersItem.id(), NOW);
        trip.purge(organizersItem.id());
        assertThat(trip.circle().requests()).isEmpty();
        Item other = trip.addItem(null, details("Khác"), null, null, NOW);
        trip.circle().submitDeletion(guest, other, null, NOW);
        trip.circle().dropPendingOf(guestMember.id());
        assertThat(trip.circle().requests()).isEmpty();
    }
}
