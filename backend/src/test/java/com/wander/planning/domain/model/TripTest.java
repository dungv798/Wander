package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.rule.Vnd;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Patch;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Test đơn vị của aggregate: không Spring, không DB — chạy trong mili-giây. */
class TripTest {

    private static final LocalDate D1 = LocalDate.parse("2026-08-29");
    private static final LocalDate D2 = LocalDate.parse("2026-08-30");
    private static final Instant NOW = Instant.parse("2026-10-24T00:00:00Z");
    private final UUID owner = UUID.randomUUID();

    private Trip trip() {
        return Trip.plan(owner, "Hà Giang", "Hà Giang", DateRange.of(D1, LocalDate.parse("2026-09-06")), NOW);
    }

    private static ItemDetails details(String title) {
        return new ItemDetails(ItemType.SIGHTSEEING, title, null, null, null, ItemCost.UNKNOWN);
    }

    private static List<String> titles(Trip t, LocalDate day) {
        return t.liveItems(day).stream().map(Item::title).toList();
    }

    @Test
    @DisplayName("vị trí trong ngày luôn liền mạch 0..n-1 sau thêm, xóa mềm, khôi phục")
    void positionsStayContiguous() {
        Trip t = trip();
        Item a = t.addItem(D2, details("A"), null, NOW);
        Item b = t.addItem(D2, details("B"), null, NOW);
        t.addItem(D2, details("C"), 0, NOW);
        assertThat(titles(t, D2)).containsExactly("C", "A", "B");

        t.softDelete(a.id(), NOW);
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1);
        t.restore(a.id(), NOW);
        assertThat(titles(t, D2)).containsExactly("C", "A", "B");
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1, 2);
        assertThat(b.position()).isEqualTo(2);
    }

    @Test
    @DisplayName("A-14: loại có đặt chỗ mặc định 'Chờ xác nhận'; Nghỉ và Việc cần làm không có trạng thái đặt chỗ")
    void bookingDefaultsByType() {
        Trip t = trip();
        assertThat(t.addItem(D2, details("Tham quan"), null, NOW).booking()).isEqualTo(BookingStatus.PENDING);
        Item rest = t.addItem(D2, new ItemDetails(ItemType.REST, "Nghỉ", null, null, null, ItemCost.UNKNOWN), null, NOW);
        Item task = t.addItem(D2, new ItemDetails(ItemType.TASK, "In vé", null, null, null, ItemCost.UNKNOWN), null, NOW);
        assertThat(rest.booking()).isNull();
        assertThat(task.booking()).isNull();
        Item booked = t.addItem(D2, new ItemDetails(ItemType.LODGING, "Khách sạn", null, null, null, ItemCost.UNKNOWN,
                BookingStatus.BOOKED), null, NOW);
        assertThat(booked.booking()).isEqualTo(BookingStatus.BOOKED);
    }

    @Test
    @DisplayName("A-14: Nghỉ/Việc cần làm không nhận trạng thái đặt chỗ (BOOKING_NOT_APPLICABLE)")
    void bookingNotApplicableToRestAndTask() {
        Trip t = trip();
        assertThatThrownBy(() -> t.addItem(D2, new ItemDetails(ItemType.REST, "Nghỉ", null, null, null, ItemCost.UNKNOWN,
                BookingStatus.BOOKED), null, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> {
                    assertThat(e.code()).isEqualTo("BOOKING_NOT_APPLICABLE");
                    assertThat(e.field()).isEqualTo("booking");
                });
        assertThat(t.liveItems(D2)).isEmpty();
    }

    @Test
    @DisplayName("A-14: sửa trạng thái đặt chỗ giữ nguyên các trường khác; đổi sang Nghỉ phải bỏ trạng thái, đổi lại thì về 'Chờ xác nhận'")
    void bookingEditAndTypeChange() {
        Trip t = trip();
        Item item = t.addItem(D2, details("Tham quan"), null, NOW);
        ItemDetails cur = t.editableItem(item.id()).details();
        t.editItem(item.id(), new ItemDetails(cur.type(), cur.title(), cur.timeOfDay(), cur.durationMin(), cur.note(), cur.cost(),
                BookingStatus.BOOKED), Patch.absent(), null, NOW);
        assertThat(t.editableItem(item.id()).booking()).isEqualTo(BookingStatus.BOOKED);
        assertThat(t.editableItem(item.id()).title()).isEqualTo("Tham quan");

        t.editItem(item.id(), new ItemDetails(ItemType.REST, "Tham quan", null, null, null, ItemCost.UNKNOWN), Patch.absent(), null, NOW);
        assertThat(t.editableItem(item.id()).booking()).isNull();
        t.editItem(item.id(), new ItemDetails(ItemType.FOOD, "Tham quan", null, null, null, ItemCost.UNKNOWN), Patch.absent(), null, NOW);
        assertThat(t.editableItem(item.id()).booking()).isEqualTo(BookingStatus.PENDING);
    }

    @Test
    @DisplayName("R12 mới (DR-011 A1): đổi khoảng ngày được; mục (kể cả đã xóa mềm) nằm ngoài tự về \"Chưa có ngày\"")
    void rangeChangeMovesOutsideItemsToUnscheduled() {
        Trip t = trip();
        Item a = t.addItem(D1, details("A"), null, NOW);
        Item gone = t.addItem(D1, details("Đã xóa"), null, NOW);
        Item b = t.addItem(D2, details("B"), null, NOW);
        t.softDelete(gone.id(), NOW);

        t.changeDetails("x", "y", DateRange.of(D2, LocalDate.parse("2026-09-06")), NOW);

        assertThat(t.range().dayCount()).isEqualTo(8);
        assertThat(a.day()).as("mục còn hiện ngoài khoảng về Chưa có ngày").isNull();
        assertThat(gone.day()).as("mục đã xóa mềm cũng vậy").isNull();
        assertThat(b.day()).as("mục trong khoảng giữ nguyên").isEqualTo(D2);
        assertThat(titles(t, null)).containsExactly("A");
        assertThat(t.liveItems(null)).extracting(Item::position).containsExactly(0);

        t.restore(gone.id(), NOW);
        assertThat(gone.day()).as("khôi phục mục chưa có ngày không ném DAY_OUT_OF_RANGE").isNull();
        assertThat(titles(t, null)).containsExactly("A", "Đã xóa");
    }

    @Test
    @DisplayName("mục chưa có ngày: thêm không ngày, xếp theo thứ tự thủ công, sửa sang ngày rồi về lại Chưa có ngày")
    void unscheduledItemLifecycle() {
        Trip t = trip();
        Item first = t.addItem(null, details("Một"), null, NOW);
        Item second = t.addItem(null, details("Hai"), 0, NOW);
        assertThat(first.day()).isNull();
        assertThat(titles(t, null)).containsExactly("Hai", "Một");

        t.editItem(second.id(), second.details(), Patch.of(D2), null, NOW);
        assertThat(second.day()).isEqualTo(D2);
        assertThat(titles(t, null)).containsExactly("Một");
        assertThat(t.liveItems(null)).extracting(Item::position).containsExactly(0);

        t.editItem(second.id(), second.details(), Patch.absent(), null, NOW);
        assertThat(second.day()).as("không nêu ngày thì giữ nguyên").isEqualTo(D2);

        t.editItem(second.id(), second.details(), Patch.of(null), null, NOW);
        assertThat(second.day()).as("nêu null thì về Chưa có ngày").isNull();
        assertThat(titles(t, null)).containsExactly("Một", "Hai");

        assertThatThrownBy(() -> t.editItem(second.id(), second.details(), Patch.of(LocalDate.parse("2027-01-01")), null, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("DAY_OUT_OF_RANGE"));
    }

    @Test
    @DisplayName("gán ngày hàng loạt nguyên tử; gửi lại trạng thái cũ (Hoàn tác) khôi phục đúng ngày và thứ tự")
    void bulkAssignmentAndUndoRoundTrip() {
        Trip t = trip();
        LocalDate d3 = LocalDate.parse("2026-08-31");
        Item a = t.addItem(D2, details("A"), null, NOW);
        Item b = t.addItem(D2, details("B"), null, NOW);
        Item c = t.addItem(D2, details("C"), null, NOW);
        Item d = t.addItem(null, details("D"), null, NOW);

        t.assignDays(List.of(new DayAssignment(d.id(), D2, 0), new DayAssignment(a.id(), d3, null),
                new DayAssignment(b.id(), d3, null)), NOW);
        assertThat(titles(t, D2)).containsExactly("D", "C");
        assertThat(titles(t, d3)).containsExactly("A", "B");
        assertThat(titles(t, null)).isEmpty();
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1);

        t.assignDays(List.of(new DayAssignment(d.id(), null, null), new DayAssignment(a.id(), D2, 0),
                new DayAssignment(b.id(), D2, 1), new DayAssignment(c.id(), D2, 2)), NOW);
        assertThat(titles(t, D2)).containsExactly("A", "B", "C");
        assertThat(titles(t, d3)).isEmpty();
        assertThat(titles(t, null)).containsExactly("D");
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1, 2);
    }

    @Test
    @DisplayName("gán ngày hàng loạt sai một phần tử thì không đổi gì: ngày ngoài chuyến, mục trùng, mục đã xóa, mục lạ")
    void invalidBulkAssignmentChangesNothing() {
        Trip t = trip();
        Item a = t.addItem(D2, details("A"), null, NOW);
        Item gone = t.addItem(D2, details("Đã xóa"), null, NOW);
        t.softDelete(gone.id(), NOW);
        LocalDate d3 = LocalDate.parse("2026-08-31");

        assertThatThrownBy(() -> t.assignDays(List.of(new DayAssignment(a.id(), d3, null),
                new DayAssignment(a.id(), D1, null)), NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("DUPLICATE_ASSIGNMENT"));
        assertThatThrownBy(() -> t.assignDays(List.of(new DayAssignment(a.id(), d3, null),
                new DayAssignment(gone.id(), D1, null)), NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("ITEM_DELETED"));
        assertThatThrownBy(() -> t.assignDays(List.of(new DayAssignment(a.id(), d3, null),
                new DayAssignment(UUID.randomUUID(), D1, null)), NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("NOT_FOUND"));
        assertThatThrownBy(() -> t.assignDays(List.of(new DayAssignment(a.id(), d3, null),
                new DayAssignment(a.id(), LocalDate.parse("2027-01-01"), null)), NOW)).isInstanceOf(WanderException.class);
        assertThat(a.day()).as("phần tử hợp lệ đứng trước cũng không được áp dụng").isEqualTo(D2);
    }

    @Test
    @DisplayName("liên kết kho: placeId chuẩn hóa (trống = không có) và chỉ nhận mã dạng slug")
    void placeLinkIsNormalizedAndValidated() {
        assertThat(new ItemDetails(ItemType.SIGHTSEEING, "x", null, null, null, ItemCost.UNKNOWN, null, " cot-co-lung-cu ").placeId())
                .isEqualTo("cot-co-lung-cu");
        assertThat(new ItemDetails(ItemType.SIGHTSEEING, "x", null, null, null, ItemCost.UNKNOWN, null, "  ").placeId()).isNull();
        assertThatThrownBy(() -> new ItemDetails(ItemType.SIGHTSEEING, "x", null, null, null, ItemCost.UNKNOWN, null, "Cột Cờ!"))
                .isInstanceOfSatisfying(WanderException.class, e -> {
                    assertThat(e.code()).isEqualTo("MALFORMED");
                    assertThat(e.field()).isEqualTo("placeId");
                });
        Trip t = trip();
        Item linked = t.addItem(D2, new ItemDetails(ItemType.SIGHTSEEING, "Cột cờ", null, null, null, ItemCost.UNKNOWN, null, "cot-co-lung-cu"),
                null, NOW);
        assertThat(linked.placeId()).isEqualTo("cot-co-lung-cu");
        assertThat(linked.details().placeId()).isEqualTo("cot-co-lung-cu");
    }

    @Test
    @DisplayName("tổng chỉ tính mục còn hiện, không tính mục đã bao gồm hay chưa biết")
    void countedCost() {
        Trip t = trip();
        Item paid = t.addItem(D2, new ItemDetails(ItemType.FOOD, "Phở", null, null, null, new ItemCost(150L, false, null)), null, NOW);
        Item included = t.addItem(D2, new ItemDetails(ItemType.TOUR, "Tour", null, null, null, new ItemCost(300L, true, 300L)), null, NOW);
        assertThat(paid.countedK()).isEqualTo(150);
        assertThat(included.countedK()).isZero();
        t.softDelete(paid.id(), NOW);
        assertThat(paid.countedK()).isZero();
    }

    @Test
    @DisplayName("R4: bỏ tick \"đã bao gồm\" mà không gửi giá tham khảo thì giá tham khảo bị xóa")
    void untickClearsReference() {
        ItemCost c = new ItemCost(200L, true, 200L);
        assertThat(c.change(200L, false, false, null).referenceK()).isNull();
        assertThat(c.change(200L, true, false, null).referenceK()).isEqualTo(200L);
        assertThatThrownBy(() -> new ItemCost(1L, false, 5L)).hasMessageContaining("Giá trị");
    }

    @Test
    @DisplayName("chỉ \"Việc cần làm\" có ô tích, ghi theo người")
    void taskDone() {
        Trip t = trip();
        Item task = t.addItem(D2, new ItemDetails(ItemType.TASK, "In vé", null, null, null, ItemCost.UNKNOWN), null, NOW);
        Item food = t.addItem(D2, details("Phở"), null, NOW);
        t.setTaskDone(task.id(), owner, true, NOW);
        assertThat(task.isDoneBy(owner)).isTrue();
        assertThat(task.isDoneBy(UUID.randomUUID())).isFalse();
        assertThatThrownBy(() -> t.setTaskDone(food.id(), owner, true, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("NOT_A_TASK"));
    }

    @Test
    @DisplayName("ngày có thứ trong tuần đúng (R1)")
    void weekdays() {
        List<DateRange.TripDay> days = DateRange.of(D1, LocalDate.parse("2026-09-06")).days();
        assertThat(days).hasSize(9);
        assertThat(days.get(0).weekdayLabel()).isEqualTo("T7");
        assertThat(days.get(1).weekdayLabel()).isEqualTo("CN");
        assertThat(days.get(1).weekday()).isZero();
    }

    @Test
    @DisplayName("hiển thị VND đầy đủ")
    void vnd() {
        assertThat(Vnd.fromThousands(0)).isEqualTo("0 ₫");
        assertThat(Vnd.fromThousands(150)).isEqualTo("150.000 ₫");
        assertThat(Vnd.fromThousands(1500)).isEqualTo("1.500.000 ₫");
        assertThat(Vnd.fromThousands(1_000_000_000L)).isEqualTo("1.000.000.000.000 ₫");
    }
}
