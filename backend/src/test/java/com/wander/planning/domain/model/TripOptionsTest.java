package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.vocabulary.TripPace;
import com.wander.planning.domain.vocabulary.TripStyle;
import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Q11 (DR-002): tùy chọn chuyến đi. Không Spring, không DB. */
class TripOptionsTest {

    private static final Instant NOW = Instant.parse("2026-10-24T00:00:00Z");

    private static void assertInvalid(Runnable r, String code, String field) {
        assertThatThrownBy(r::run).isInstanceOfSatisfying(WanderException.class, e -> {
            assertThat(e.code()).isEqualTo(code);
            assertThat(e.field()).isEqualTo(field);
        });
    }

    @Test
    @DisplayName("ngân sách: trống = chưa đặt, 0 = đã đặt bằng 0 (D18); âm hoặc vượt tối đa bị từ chối (D17)")
    void budgetRules() {
        assertThat(new TripOptions(null, List.of(), null).budgetK()).isNull();
        assertThat(new TripOptions(0L, List.of(), null).budgetK()).isZero();
        assertThat(new TripOptions(PlanningConstants.MAX_COST_K, List.of(), null).budgetK()).isEqualTo(PlanningConstants.MAX_COST_K);
        assertInvalid(() -> new TripOptions(-1L, List.of(), null), "NEGATIVE", "budget");
        assertInvalid(() -> new TripOptions(PlanningConstants.MAX_COST_K + 1, List.of(), null), "TOO_LARGE", "budget");
    }

    @Test
    @DisplayName("kiểu chuyến: bỏ trùng, giữ thứ tự khai báo ổn định, tối đa 5")
    void styleRules() {
        TripOptions o = new TripOptions(null, List.of(TripStyle.FRIENDS, TripStyle.RELAX, TripStyle.FRIENDS, TripStyle.BEACH), null);
        assertThat(o.styles()).containsExactly(TripStyle.RELAX, TripStyle.BEACH, TripStyle.FRIENDS);
        assertThat(new TripOptions(null, List.of(TripStyle.values()).subList(0, PlanningConstants.MAX_STYLES), null).styles()).hasSize(5);
        assertInvalid(() -> new TripOptions(null, List.of(TripStyle.values()).subList(0, PlanningConstants.MAX_STYLES + 1), null),
                "TOO_MANY", "styles");
        assertThat(new TripOptions(null, null, null).styles()).isEmpty();
    }

    @Test
    @DisplayName("tạo chuyến với tùy chọn và đổi tùy chọn sau đó (cập nhật thời điểm sửa)")
    void tripKeepsAndChangesOptions() {
        UUID owner = UUID.randomUUID();
        DateRange range = DateRange.of(LocalDate.parse("2026-08-29"), LocalDate.parse("2026-09-06"));
        Trip plain = Trip.plan(owner, "Hà Giang", "Hà Giang", range, NOW);
        assertThat(plain.options()).isEqualTo(TripOptions.NONE);

        TripOptions options = new TripOptions(5_000L, List.of(TripStyle.MOUNTAIN), TripPace.PACKED);
        Trip trip = Trip.plan(owner, "Hà Giang", "Hà Giang", range, options, NOW);
        assertThat(trip.options()).isEqualTo(options);

        Instant later = NOW.plusSeconds(60);
        trip.changeOptions(new TripOptions(null, List.of(), null), later);
        assertThat(trip.options()).isEqualTo(TripOptions.NONE);
        assertThat(trip.updatedAt()).isEqualTo(later);
    }
}
