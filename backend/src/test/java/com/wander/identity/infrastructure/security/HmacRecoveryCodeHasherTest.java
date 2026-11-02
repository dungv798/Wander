package com.wander.identity.infrastructure.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.PropertyPlaceholderAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/** Bộ băm mã khôi phục bằng HMAC-SHA-256 có khóa (DR-018 B3): khóa bắt buộc, đủ dài, không lộ qua lời báo lỗi. */
class HmacRecoveryCodeHasherTest {

    private static final String PEPPER = "unit-test-pepper-0123456789-abcdefghijklmnop";
    private static final String CODE = "7K2QF9X3MPA45TR8VWB6NCD1GHJ0ZE";

    @Test
    @DisplayName("băm: 64 ký tự hex thường, xác định, phụ thuộc cả khóa lẫn mã")
    void deterministicAndKeyed() {
        var hasher = new HmacRecoveryCodeHasher(PEPPER);
        assertThat(hasher.hash(CODE)).matches("^[0-9a-f]{64}$").isEqualTo(hasher.hash(CODE));
        assertThat(hasher.hash(CODE)).isNotEqualTo(hasher.hash(CODE.replace('7', '8')));
        assertThat(hasher.hash(CODE)).as("khác khóa thì khác băm").isNotEqualTo(new HmacRecoveryCodeHasher(PEPPER + "x").hash(CODE));
    }

    @Test
    @DisplayName("hashDisplayed: mã hiển thị (có gạch ngang, chữ thường) chuẩn hóa rồi băm giống hệt mã đã chuẩn hóa")
    void displayedCodeIsNormalizedFirst() {
        var hasher = new HmacRecoveryCodeHasher(PEPPER);
        String displayed = "7K2QF-9X3MP-A45TR-8VWB6-NCD1G-HJ0ZE";
        assertThat(hasher.hashDisplayed(displayed)).isEqualTo(hasher.hash(CODE));
        assertThat(hasher.hashDisplayed(displayed.toLowerCase())).isEqualTo(hasher.hash(CODE));
    }

    @Test
    @DisplayName("khóa thiếu, trống hoặc ngắn hơn 32 byte bị từ chối ngay khi dựng, và lời báo lỗi không chứa khóa")
    void weakPepperIsRejected() {
        for (String weak : new String[] {null, "", "   ", "ngan", "x".repeat(31), "${wander.security.recovery-pepper}"}) {
            assertThatThrownBy(() -> new HmacRecoveryCodeHasher(weak)).isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("WANDER_RECOVERY_PEPPER").hasMessageNotContaining("ngan");
        }
        assertThat(new HmacRecoveryCodeHasher("x".repeat(32)).hash(CODE)).hasSize(64);
    }

    @Test
    @DisplayName("Spring: thiếu thuộc tính khóa hoặc khóa ngắn thì ngữ cảnh KHÔNG khởi động; đủ khóa thì có bean")
    void contextRequiresPepper() {
        var runner = new ApplicationContextRunner().withConfiguration(AutoConfigurations.of(PropertyPlaceholderAutoConfiguration.class))
                .withUserConfiguration(HmacRecoveryCodeHasher.class);
        runner.run(context -> assertThat(context).hasFailed());
        runner.withPropertyValues("wander.security.recovery-pepper=ngan").run(context -> assertThat(context).hasFailed());
        runner.withPropertyValues("wander.security.recovery-pepper=" + PEPPER)
                .run(context -> assertThat(context).hasSingleBean(HmacRecoveryCodeHasher.class));
    }

    @Test
    @DisplayName("xoay khóa: mã mới dùng khóa hiện hành, mã cũ còn xác minh được bằng đúng nhãn")
    void rotationKeepsPreviousKeyWithoutRelabeling() {
        var old = new HmacRecoveryCodeHasher(PEPPER);
        var rotated = new HmacRecoveryCodeHasher(PEPPER + "new", "v2", "v1", PEPPER);
        assertThat(rotated.currentKeyVersion()).isEqualTo("v2");
        assertThat(rotated.keyVersions()).containsExactly("v2", "v1");
        assertThat(rotated.hash(CODE)).isNotEqualTo(old.hash(CODE));
        assertThat(rotated.matches(CODE, old.hash(CODE), "v1")).isTrue();
        assertThat(rotated.matches(CODE, old.hash(CODE), "v2")).isFalse();
        assertThat(rotated.matches(CODE, old.hash(CODE), "retired")).isFalse();
        assertThat(new HmacRecoveryCodeHasher(PEPPER + "new", "v2", "", "")
                .matches(CODE, old.hash(CODE), "v1")).isFalse();
    }

    @Test
    @DisplayName("cấu hình rotation thiếu cặp, trùng nhãn, nhãn hỏng hoặc khóa cũ ngắn đều fail-fast và không lộ secret")
    void invalidRotationCannotStart() {
        for (String[] settings : new String[][] {{"v2", "v1", ""}, {"v2", "", PEPPER}, {"v1", "v1", PEPPER},
                {"bad label", "", ""}, {"v2", "v1", "short-previous-secret"}}) {
            assertThatThrownBy(() -> new HmacRecoveryCodeHasher(PEPPER, settings[0], settings[1], settings[2]))
                    .isInstanceOf(IllegalStateException.class).hasMessageNotContaining(PEPPER).hasMessageNotContaining("short-previous-secret");
        }
    }
}
