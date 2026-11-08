package com.wander.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.vocabulary.VenueKind;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class VenueDetailsTest {
    @Test
    void optionalPublishedDetailsAreTrimmedAndLegacyRowsStayEmpty() {
        var source = "https://example.org/venue";
        var date = LocalDate.of(2026, 11, 7);
        var bar = new VenueDetails(VenueKind.BAR, "Địa chỉ", "", source, date,
                " +84 24 1234 5678 ", " T3–CN 18:00–23:00 ", " Phân khúc tham khảo; xem thực đơn. ");
        assertThat(bar.phone()).isEqualTo("+84 24 1234 5678");
        assertThat(bar.serviceHours()).isEqualTo("T3–CN 18:00–23:00");
        assertThat(bar.priceNote()).isEqualTo("Phân khúc tham khảo; xem thực đơn.");
        assertThat(bar.kind().category()).isEqualTo(com.wander.catalog.domain.vocabulary.PlaceCategory.AM);
        var legacy = new VenueDetails(VenueKind.CAFE, "Địa chỉ", "", source, date);
        assertThat(legacy.phone()).isEmpty();
        assertThat(legacy.serviceHours()).isEmpty();
        assertThat(legacy.priceNote()).isEmpty();
        var unknown = new VenueDetails(VenueKind.LODGING, "Địa chỉ", "", source, date, null, null, null);
        assertThat(unknown.phone()).isEmpty();
        assertThat(unknown.serviceHours()).isEmpty();
        assertThat(unknown.priceNote()).isEmpty();
    }

    @Test
    void publishedDetailsRejectOversizedValuesInsteadOfSilentlyLosingInformation() {
        for (String[] values : new String[][] {{"x".repeat(61), "", ""}, {"", "x".repeat(1001), ""}, {"", "", "x".repeat(241)}}) {
            assertThatThrownBy(() -> new VenueDetails(VenueKind.RESTAURANT, "Địa chỉ", "", "https://example.org/", LocalDate.of(2026, 11, 7),
                    values[0], values[1], values[2])).isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    void explicitKindAndSourceWithoutFakePrices() {
        VenueDetails cafe = new VenueDetails(VenueKind.CAFE, " 39 Nguyễn Hữu Huân ", "https://cafegiang.vn/", "https://cafegiang.vn/", LocalDate.of(2026, 11, 7));
        assertThat(cafe.address()).isEqualTo("39 Nguyễn Hữu Huân");
        assertThat(cafe.kind()).isEqualTo(VenueKind.CAFE);
        assertThat(new VenueDetails(VenueKind.RESTAURANT, "Địa chỉ", null, "https://guide.michelin.com/", cafe.checkedAt()).website()).isEmpty();
    }

    @Test
    void sourceMustBeRealHttpsAndHaveRequiredMetadata() {
        for (String url : new String[] {"javascript:alert(1)", "https://", "http://example.org", "https://user:password@example.org"}) {
            assertThatThrownBy(() -> new VenueDetails(VenueKind.CAFE, "Địa chỉ", url, "https://example.org", LocalDate.of(2026, 11, 7)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> new VenueDetails(null, "Địa chỉ", "", "https://example.org", LocalDate.of(2026, 11, 7)))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new VenueDetails(VenueKind.LODGING, "", "", "https://example.org", LocalDate.of(2026, 11, 7)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
