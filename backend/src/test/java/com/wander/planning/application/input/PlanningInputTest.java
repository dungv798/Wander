package com.wander.planning.application.input;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.FlexibleNumber;
import java.math.BigInteger;
import java.time.LocalTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** The D17 amount rules and the item field rules, as readable example tables. */
class PlanningInputTest {

    private static String error(Runnable r) {
        try {
            r.run();
            return "OK";
        } catch (WanderException e) {
            return e.code();
        }
    }

    @ParameterizedTest(name = "cost text \"{0}\" -> {1}")
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
        assertThat(error(() -> PlanningInput.amountK(FlexibleNumber.ofText(input), "cost"))).isEqualTo(expected);
    }

    @Test
    void costNumbers() {
        assertThat(PlanningInput.amountK(FlexibleNumber.ofNumber(150), "cost")).isEqualTo(150L);
        assertThat(PlanningInput.amountK(FlexibleNumber.ofNumber(150.0), "cost")).isEqualTo(150L);
        assertThat(PlanningInput.amountK(FlexibleNumber.ofText(""), "cost")).isNull();
        assertThat(PlanningInput.amountK(null, "cost")).isNull();
        assertThat(error(() -> PlanningInput.amountK(FlexibleNumber.ofNumber(1.5), "cost"))).isEqualTo("MALFORMED");
        assertThat(error(() -> PlanningInput.amountK(FlexibleNumber.ofNumber(Double.NaN), "cost"))).isEqualTo("MALFORMED");
        assertThat(error(() -> PlanningInput.amountK(FlexibleNumber.ofNumber(-3), "cost"))).isEqualTo("NEGATIVE");
        assertThat(error(() -> PlanningInput.amountK(FlexibleNumber.ofNumber(new BigInteger("99999999999999999999")), "cost"))).isEqualTo("TOO_LARGE");
    }

    @Test
    void timeAndDuration() {
        assertThat(PlanningInput.timeOfDay("07:30")).isEqualTo(LocalTime.of(7, 30));
        assertThat(PlanningInput.timeOfDay(" ")).isNull();
        assertThat(error(() -> PlanningInput.timeOfDay("24:00"))).isEqualTo("OUT_OF_RANGE");
        assertThat(error(() -> PlanningInput.timeOfDay("7:30"))).isEqualTo("MALFORMED");
        assertThat(PlanningInput.durationMin(FlexibleNumber.ofText("90"))).isEqualTo(90);
        assertThat(PlanningInput.durationMin(FlexibleNumber.ofText(""))).isNull();
        assertThat(error(() -> PlanningInput.durationMin(FlexibleNumber.ofNumber(10081)))).isEqualTo("OUT_OF_RANGE");
        assertThat(error(() -> PlanningInput.durationMin(FlexibleNumber.ofText("-5")))).isEqualTo("MALFORMED");
    }

    @Test
    void title() {
        assertThat(PlanningInput.title("  Phở  ")).isEqualTo("Phở");
        assertThatThrownBy(() -> PlanningInput.title(null)).hasFieldOrPropertyWithValue("code", "REQUIRED");
    }

    @Test
    void positionAcceptsOnlyNumbers() {
        assertThat(PlanningInput.position(FlexibleNumber.ofNumber(2))).isEqualTo(2);
        assertThat(PlanningInput.position(FlexibleNumber.ofNumber(2.9))).isEqualTo(2);
        assertThat(PlanningInput.position(FlexibleNumber.ofText("3"))).as("a string position is ignored, as before").isNull();
        assertThat(PlanningInput.position(null)).isNull();
    }
}
