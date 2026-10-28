package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.rule.Vnd;
import com.wander.planning.domain.vocabulary.BookingStatus;
import com.wander.planning.domain.vocabulary.ItemType;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Patch;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
    @DisplayName("vị trí trong ngày liền mạch 0..n-1 sau thêm và khôi phục; xóa mềm giữ chỗ cho mục đã xóa (cho phép khoảng trống)")
    void positionsStayContiguous() {
        Trip t = trip();
        Item a = t.addItem(D2, details("A"), null, NOW);
        Item b = t.addItem(D2, details("B"), null, NOW);
        t.addItem(D2, details("C"), 0, NOW);
        assertThat(titles(t, D2)).containsExactly("C", "A", "B");

        t.softDelete(a.id(), NOW);
        assertThat(titles(t, D2)).containsExactly("C", "B");
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 2);
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
        assertThat(t.liveItems(null)).extracting(Item::position).as("vùng cũ giữ khoảng trống, vẫn tăng dần").isSorted().doesNotHaveDuplicates();

        t.editItem(second.id(), second.details(), Patch.absent(), null, NOW);
        assertThat(second.day()).as("không nêu ngày thì giữ nguyên").isEqualTo(D2);

        t.editItem(second.id(), second.details(), Patch.of(null), null, NOW);
        assertThat(second.day()).as("nêu null thì về Chưa có ngày").isNull();
        assertThat(titles(t, null)).containsExactly("Một", "Hai");

        assertThatThrownBy(() -> t.editItem(second.id(), second.details(), Patch.of(LocalDate.parse("2027-01-01")), null, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("DAY_OUT_OF_RANGE"));
    }

    @Test
    @DisplayName("D19: xóa vài mục rồi khôi phục theo BẤT KỲ thứ tự nào đều về đúng chỗ cũ (thử mọi tập xóa x mọi thứ tự khôi phục)")
    void restoreInAnyOrderKeepsOriginalOrder() {
        List<String> original = List.of("A", "B", "C", "D", "E");
        for (int mask = 1; mask < (1 << original.size()); mask++) {
            List<String> deleted = new ArrayList<>();
            for (int i = 0; i < original.size(); i++) if ((mask & (1 << i)) != 0) deleted.add(original.get(i));
            for (List<String> restoreOrder : permutations(deleted)) {
                Trip t = trip();
                Map<String, Item> byTitle = new HashMap<>();
                for (String title : original) byTitle.put(title, t.addItem(D2, details(title), null, NOW));
                for (String title : deleted) t.softDelete(byTitle.get(title).id(), NOW);
                for (String title : restoreOrder) t.restore(byTitle.get(title).id(), NOW);
                assertThat(titles(t, D2)).as("xóa %s, khôi phục theo thứ tự %s", deleted, restoreOrder).containsExactlyElementsOf(original);
            }
        }
    }

    /** Mọi hoán vị của danh sách (danh sách nhỏ, chỉ dùng trong test). */
    private static List<List<String>> permutations(List<String> items) {
        if (items.size() <= 1) return List.of(items);
        List<List<String>> result = new ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            List<String> rest = new ArrayList<>(items);
            String head = rest.remove(i);
            for (List<String> tail : permutations(rest)) {
                List<String> permutation = new ArrayList<>();
                permutation.add(head);
                permutation.addAll(tail);
                result.add(permutation);
            }
        }
        return result;
    }

    @Test
    @DisplayName("QA: chuyển một mục sang ngày khác khi còn mục trong thùng rác: khôi phục vẫn về đúng chỗ cạnh hàng xóm cũ")
    void restoreAfterMovingAnotherItemAway() {
        List<String> original = List.of("A", "B", "C", "D", "E");
        LocalDate d3 = LocalDate.parse("2026-08-31");
        for (List<String> restoreOrder : permutations(List.of("A", "B"))) {
            Trip t = trip();
            Map<String, Item> byTitle = new HashMap<>();
            for (String title : original) byTitle.put(title, t.addItem(D2, details(title), null, NOW));
            t.softDelete(byTitle.get("A").id(), NOW);
            t.softDelete(byTitle.get("B").id(), NOW);
            t.assignDays(List.of(new DayAssignment(byTitle.get("C").id(), d3, null)), NOW);
            for (String title : restoreOrder) t.restore(byTitle.get(title).id(), NOW);
            assertThat(titles(t, D2)).as("khôi phục theo thứ tự %s", restoreOrder).containsExactly("A", "B", "D", "E");
            assertThat(titles(t, d3)).containsExactly("C");
        }
    }

    @Test
    @DisplayName("vị trí đã lưu bị mục khác chiếm (sau khi thêm mục): khôi phục vẫn về trước mục đang giữ chỗ và đánh số lại liền mạch")
    void restoreWhenStoredPositionIsTaken() {
        Trip t = trip();
        Item a = t.addItem(D2, details("A"), null, NOW);
        Item b = t.addItem(D2, details("B"), null, NOW);
        Item c = t.addItem(D2, details("C"), null, NOW);
        t.softDelete(b.id(), NOW);
        t.addItem(D2, details("D"), null, NOW);
        // thêm mục đánh số lại liền mạch: C (vị trí 1) nay chiếm chỗ đã lưu của B (vị trí 1)
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1, 2);
        assertThat(b.position()).isEqualTo(1);

        t.restore(b.id(), NOW);
        assertThat(titles(t, D2)).containsExactly("A", "B", "C", "D");
        assertThat(t.liveItems(D2)).extracting(Item::position).containsExactly(0, 1, 2, 3);
        assertThat(a.position()).isZero();
        assertThat(c.position()).isEqualTo(2);
    }

    @Test
    @DisplayName("xóa mềm một mục chưa có ngày rồi khôi phục: vẫn ở \"Chưa có ngày\", đúng chỗ cũ")
    void unscheduledItemRestoresToUnscheduledSlot() {
        Trip t = trip();
        Item a = t.addItem(null, details("A"), null, NOW);
        t.addItem(null, details("B"), null, NOW);
        t.softDelete(a.id(), NOW);
        assertThat(titles(t, null)).containsExactly("B");
        t.restore(a.id(), NOW);
        assertThat(titles(t, null)).containsExactly("A", "B");
        assertThat(a.day()).isNull();
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
        assertThat(t.liveItems(D2)).extracting(Item::position).as("chuyển mục ra khỏi ngày để lại khoảng trống nhưng vẫn tăng dần").isSorted().doesNotHaveDuplicates();

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

    @Test
    @DisplayName("thùng rác đầy (trần 500 mục, DR-020): xóa mềm thêm bị chặn bằng TRASH_FULL, không tự xóa vĩnh viễn mục cũ; xóa vĩnh viễn một mục thì xóa tiếp được")
    void trashHasACeiling() {
        Trip t = trip();
        List<Item> items = new ArrayList<>();
        for (int i = 0; i <= PlanningConstants.MAX_TRASH_ITEMS; i++) items.add(t.addItem(D2, details("M" + i), null, NOW));
        for (int i = 0; i < PlanningConstants.MAX_TRASH_ITEMS; i++) t.softDelete(items.get(i).id(), NOW);
        Item last = items.get(PlanningConstants.MAX_TRASH_ITEMS);
        assertThatThrownBy(() -> t.softDelete(last.id(), NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("TRASH_FULL"));
        assertThat(titles(t, D2)).containsExactly("M" + PlanningConstants.MAX_TRASH_ITEMS);
        t.purge(items.get(0).id());
        t.softDelete(last.id(), NOW);
        assertThat(titles(t, D2)).isEmpty();
    }

    @Test
    @DisplayName("xóa mềm chuyến: ghi thời điểm xóa, không xóa hai lần; khôi phục đưa về như cũ và không khôi phục chuyến chưa xóa")
    void tripSoftDeleteAndRestore() {
        Trip t = trip();
        Item a = t.addItem(D2, details("A"), null, NOW);
        assertThat(t.isDeleted()).isFalse();
        t.moveToTrash(NOW.plusSeconds(5));
        assertThat(t.isDeleted()).isTrue();
        assertThat(t.deletedAt()).isEqualTo(NOW.plusSeconds(5));
        assertThatThrownBy(() -> t.moveToTrash(NOW)).isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("ALREADY_DELETED"));
        t.recoverFromTrash(NOW.plusSeconds(9));
        assertThat(t.isDeleted()).isFalse();
        assertThat(t.deletedAt()).isNull();
        assertThat(titles(t, D2)).containsExactly("A");
        assertThat(a.isDeleted()).isFalse();
        assertThatThrownBy(() -> t.recoverFromTrash(NOW)).isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("NOT_DELETED"));
    }
}
