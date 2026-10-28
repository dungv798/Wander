package com.wander.planning.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.error.WanderException;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Hạng mục checklist chuẩn bị (Q12): tên và nhóm là nhãn tự khai nên được chuẩn hóa; tick theo từng người, không chia sẻ. */
class ChecklistItemTest {

    private static final Instant NOW = Instant.parse("2026-10-28T00:00:00Z");
    private final UUID trip = UUID.randomUUID();

    @Test
    @DisplayName("tạo: chuẩn hóa tên và nhóm; nhóm trống là \"không nhóm\"; tên trống bị từ chối REQUIRED")
    void create() {
        ChecklistItem item = ChecklistItem.create(trip, "  Giấy   tờ ", "  Mang CCCD ", 3, NOW);
        assertThat(item.group()).isEqualTo("Giấy tờ");
        assertThat(item.title()).isEqualTo("Mang CCCD");
        assertThat(item.position()).isEqualTo(3);
        assertThat(ChecklistItem.create(trip, null, "Sạc", 0, NOW).group()).isEmpty();
        assertThatThrownBy(() -> ChecklistItem.create(trip, "A", "   ", 0, NOW))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("REQUIRED"));
    }

    @Test
    @DisplayName("tên quá 120, nhóm quá 60 ký tự, ký tự vô hình đều bị từ chối")
    void limits() {
        assertThatThrownBy(() -> ChecklistItem.create(trip, "", "x".repeat(121), 0, NOW)).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> ChecklistItem.create(trip, "g".repeat(61), "ok", 0, NOW)).isInstanceOf(WanderException.class);
        assertThatThrownBy(() -> ChecklistItem.create(trip, "", "a‮b", 0, NOW)).isInstanceOf(WanderException.class);
    }

    @Test
    @DisplayName("sửa: chỉ trường được nêu đổi; không nêu thì giữ nguyên")
    void edit() {
        ChecklistItem item = ChecklistItem.create(trip, "Giấy tờ", "CCCD", 0, NOW);
        item.edit(null, "Hộ chiếu");
        assertThat(item.group()).isEqualTo("Giấy tờ");
        assertThat(item.title()).isEqualTo("Hộ chiếu");
        item.edit("", null);
        assertThat(item.group()).isEmpty();
    }

    @Test
    @DisplayName("tick theo từng người: người này xong không làm người kia xong; bỏ tick chỉ của mình; idempotent")
    void perPerson() {
        ChecklistItem item = ChecklistItem.create(trip, "", "Sạc", 0, NOW);
        UUID a = UUID.randomUUID();
        UUID b = UUID.randomUUID();
        item.setDone(a, true, NOW);
        item.setDone(a, true, NOW.plusSeconds(1));
        assertThat(item.isDoneBy(a)).isTrue();
        assertThat(item.isDoneBy(b)).isFalse();
        assertThat(item.doneBy()).containsExactly(a);
        item.setDone(b, true, NOW);
        item.setDone(a, false, NOW);
        assertThat(item.doneBy()).containsExactly(b);
    }
}
