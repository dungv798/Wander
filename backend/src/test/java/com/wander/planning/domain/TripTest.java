package com.wander.planning.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.WanderException;
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
        return new ItemDetails(ItemType.SIGHTSEEING, title, null, null, null, CostInfo.UNKNOWN);
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
    @DisplayName("R12: không đổi được khoảng ngày khi có mục (kể cả đã xóa mềm) nằm ngoài")
    void orphanItemsBlockRangeChange() {
        Trip t = trip();
        Item a = t.addItem(D1, details("A"), null, NOW);
        t.softDelete(a.id(), NOW);
        DateRange shorter = DateRange.of(D2, LocalDate.parse("2026-09-06"));
        assertThatThrownBy(() -> t.changeDetails("x", "y", shorter, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("DATES_ORPHAN_ITEMS"));
        t.purge(a.id());
        t.changeDetails("x", "y", shorter, NOW);
        assertThat(t.range().dayCount()).isEqualTo(8);
    }

    @Test
    @DisplayName("tổng chỉ tính mục còn hiện, không tính mục đã bao gồm hay chưa biết")
    void countedCost() {
        Trip t = trip();
        Item paid = t.addItem(D2, new ItemDetails(ItemType.FOOD, "Phở", null, null, null, new CostInfo(150L, false, null)), null, NOW);
        Item included = t.addItem(D2, new ItemDetails(ItemType.TOUR, "Tour", null, null, null, new CostInfo(300L, true, 300L)), null, NOW);
        assertThat(paid.countedK()).isEqualTo(150);
        assertThat(included.countedK()).isZero();
        t.softDelete(paid.id(), NOW);
        assertThat(paid.countedK()).isZero();
    }

    @Test
    @DisplayName("R4: bỏ tick \"đã bao gồm\" mà không gửi giá tham khảo thì giá tham khảo bị xóa")
    void untickClearsReference() {
        CostInfo c = new CostInfo(200L, true, 200L);
        assertThat(c.change(200L, false, false, null).referenceK()).isNull();
        assertThat(c.change(200L, true, false, null).referenceK()).isEqualTo(200L);
        assertThatThrownBy(() -> new CostInfo(1L, false, 5L)).hasMessageContaining("Giá trị");
    }

    @Test
    @DisplayName("chỉ \"Việc cần làm\" có ô tích, ghi theo người")
    void taskDone() {
        Trip t = trip();
        Item task = t.addItem(D2, new ItemDetails(ItemType.TASK, "In vé", null, null, null, CostInfo.UNKNOWN), null, NOW);
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
