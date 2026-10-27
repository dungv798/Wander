package com.wander.planning.domain.rule;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Quy tắc đặt tên chuyến không trùng (DR-006): hậu tố " - 2", " - 3"… với số nhỏ nhất chưa dùng. */
class TripNamingTest {

    @Test
    @DisplayName("tên chưa có ai dùng thì giữ nguyên")
    void freeNameIsKept() {
        assertThat(TripNaming.uniqueName(Set.of(), "Hà Giang")).isEqualTo("Hà Giang");
        assertThat(TripNaming.uniqueName(Set.of("Đà Lạt"), "Hà Giang")).isEqualTo("Hà Giang");
    }

    @Test
    @DisplayName("tên trùng thì thêm hậu tố là số nhỏ nhất từ 2 chưa dùng")
    void duplicateGetsSmallestFreeSuffix() {
        assertThat(TripNaming.uniqueName(Set.of("Hà Giang"), "Hà Giang")).isEqualTo("Hà Giang - 2");
        assertThat(TripNaming.uniqueName(Set.of("Hà Giang", "Hà Giang - 2"), "Hà Giang")).isEqualTo("Hà Giang - 3");
        assertThat(TripNaming.uniqueName(Set.of("Hà Giang", "Hà Giang - 2", "Hà Giang - 4"), "Hà Giang")).isEqualTo("Hà Giang - 3");
    }

    @Test
    @DisplayName("tên dài đúng giới hạn: cắt phần đầu để cả hậu tố vẫn không quá 120 ký tự")
    void longNameStaysWithinLimit() {
        String base = "a".repeat(120);
        String result = TripNaming.uniqueName(Set.of(base), base);
        assertThat(result).hasSize(120).endsWith(" - 2");
    }

    @Test
    @DisplayName("hết hậu tố (2..199) thì thêm mã ngắn ngẫu nhiên, vẫn không trùng")
    void exhaustedSuffixesFallBackToShortCode() {
        Set<String> taken = new HashSet<>();
        taken.add("X");
        for (int n = 2; n < 200; n++) taken.add("X - " + n);
        String result = TripNaming.uniqueName(taken, "X");
        assertThat(result).matches("X - [0-9a-f]{4}").isNotIn(taken);
    }
}
