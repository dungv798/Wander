package com.wander.planning.application.input;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.error.WanderException;
import java.math.BigInteger;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Quy tắc nhập chi phí D17 và các trường mục — bảng ví dụ dễ đọc. */
class RawInputTest {

    private static String error(Runnable r) {
        try {
            r.run();
            return "OK";
        } catch (WanderException e) {
            return e.code();
        }
    }

    @ParameterizedTest(name = "chi phí \"{0}\" → {1}")
    @CsvSource({
            "150, OK",
            "0, OK",
            "'  42  ', OK",
            "-1, NEGATIVE",
            "1.5, MALFORMED",
            "150k, MALFORMED",
            "'1.000', MALFORMED",
            "₫150, MALFORMED",
            "1000000001, TOO_LARGE",
            "12345678901, TOO_LARGE",
            "000000000000150, OK"})
    void costText(String input, String expected) {
        assertThat(error(() -> RawInput.amountK(input, "cost"))).isEqualTo(expected);
    }

    @Test
    void costNumbers() {
        assertThat(RawInput.amountK(150, "cost")).isEqualTo(150L);
        assertThat(RawInput.amountK(150.0, "cost")).isEqualTo(150L);
        assertThat(RawInput.amountK("", "cost")).isNull();
        assertThat(RawInput.amountK(null, "cost")).isNull();
        assertThat(error(() -> RawInput.amountK(1.5, "cost"))).isEqualTo("MALFORMED");
        assertThat(error(() -> RawInput.amountK(Double.NaN, "cost"))).isEqualTo("MALFORMED");
        assertThat(error(() -> RawInput.amountK(-3, "cost"))).isEqualTo("NEGATIVE");
        assertThat(error(() -> RawInput.amountK(new BigInteger("99999999999999999999"), "cost"))).isEqualTo("TOO_LARGE");
        assertThat(error(() -> RawInput.amountK(true, "cost"))).isEqualTo("MALFORMED");
    }

    @Test
    void timeAndDuration() {
        assertThat(RawInput.timeOfDay("07:30")).isEqualTo(LocalTime.of(7, 30));
        assertThat(RawInput.timeOfDay(" ")).isNull();
        assertThat(error(() -> RawInput.timeOfDay("24:00"))).isEqualTo("OUT_OF_RANGE");
        assertThat(error(() -> RawInput.timeOfDay("7:30"))).isEqualTo("MALFORMED");
        assertThat(RawInput.durationMin("90")).isEqualTo(90);
        assertThat(RawInput.durationMin("")).isNull();
        assertThat(error(() -> RawInput.durationMin(10081))).isEqualTo("OUT_OF_RANGE");
        assertThat(error(() -> RawInput.durationMin("-5"))).isEqualTo("MALFORMED");
    }

    @Test
    void title() {
        assertThat(RawInput.title("  Phở  ")).isEqualTo("Phở");
        assertThatThrownBy(() -> RawInput.title(null)).hasFieldOrPropertyWithValue("code", "REQUIRED");
        assertThat(error(() -> RawInput.title(5))).isEqualTo("MALFORMED");
    }
}
