package com.wander.shared.kernel;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Chuẩn hóa nhãn do người dùng tự khai (tên thiết bị, tên hiển thị): NFC, gộp khoảng trắng, cấm ký tự điều khiển/vô hình, giới hạn theo code point. */
class LabelsTest {

    @Test
    @DisplayName("chuẩn hóa NFC, gộp khoảng trắng và cắt hai đầu; chỉ khoảng trắng thì rỗng")
    void normalizes() {
        assertThat(Labels.normalize("  é   An  ", 40, "displayName")).isEqualTo("é An");
        assertThat(Labels.normalize("a  　 b", 40, "f")).isEqualTo("a b");
        assertThat(Labels.normalize("   ", 40, "f")).isEmpty();
    }

    @Test
    @DisplayName("ký tự điều khiển, vô hình và đảo chiều (RTL override, zero-width) bị từ chối MALFORMED")
    void rejectsForbidden() {
        for (String bad : new String[] {"a\u0000b", "a‮b", "a​b", "a﻿b", "a b", "ab"}) {
            assertThatThrownBy(() -> Labels.normalize(bad, 40, "f"))
                    .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("MALFORMED"));
        }
    }

    @Test
    @DisplayName("quá giới hạn tính theo code point (emoji là một) thì TOO_LONG")
    void limitsByCodePoints() {
        assertThat(Labels.normalize("😀".repeat(5), 5, "f")).hasSize(10);
        assertThatThrownBy(() -> Labels.normalize("😀".repeat(6), 5, "f"))
                .isInstanceOfSatisfying(WanderException.class, e -> assertThat(e.code()).isEqualTo("TOO_LONG"));
    }
}
