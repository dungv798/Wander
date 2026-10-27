package com.wander.catalog.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.wander.catalog.domain.vocabulary.TemplateStatus;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/** Bất biến của lịch mẫu (N-2, DR-018, DR-020): chỉ là danh sách địa điểm theo ngày, không giờ/giá, mỗi địa điểm một lần. */
class ItineraryTemplateTest {

    private static TemplateDay day(String... placeIds) {
        return new TemplateDay(List.of(placeIds), null);
    }

    private static ItineraryTemplate template(List<TemplateDay> days) {
        return new ItineraryTemplate("vong-cung", "Vòng cung", "Tóm tắt", TemplateStatus.APPROVED, days);
    }

    @Test
    @DisplayName("lịch hợp lệ: đếm số địa điểm khác nhau, ghi chú rỗng thành null, tóm tắt thiếu thành chuỗi rỗng")
    void validTemplate() {
        ItineraryTemplate t = new ItineraryTemplate("a-b", "  Tên  ", null, TemplateStatus.DRAFT,
                List.of(day("p1", "p2"), new TemplateDay(List.of(), " Nghỉ ngơi "), new TemplateDay(List.of("p3"), " Ghi chú ")));
        assertThat(t.title()).isEqualTo("Tên");
        assertThat(t.summary()).isEmpty();
        assertThat(t.status()).isEqualTo(TemplateStatus.DRAFT);
        assertThat(t.placeCount()).isEqualTo(3);
        assertThat(t.days().get(1).note()).isEqualTo("Nghỉ ngơi");
        assertThat(t.days().get(2).note()).isEqualTo("Ghi chú");
        assertThatThrownBy(() -> t.days().add(day("x"))).isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    @DisplayName("lịch sai bị từ chối: thiếu mã/tên, mã không phải slug, trạng thái null, không có ngày, quá nhiều ngày")
    void invalidTemplates() {
        List<TemplateDay> one = List.of(day("p1"));
        assertThatThrownBy(() -> new ItineraryTemplate(" ", "Tên", "", TemplateStatus.DRAFT, one)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new ItineraryTemplate("Sai Mã", "Tên", "", TemplateStatus.DRAFT, one)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new ItineraryTemplate("a", " ", "", TemplateStatus.DRAFT, one)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new ItineraryTemplate("a", "Tên", "", null, one)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> template(List.of())).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> template(null)).isInstanceOf(IllegalArgumentException.class);
        List<TemplateDay> tooMany = new ArrayList<>();
        for (int i = 0; i < 31; i++) tooMany.add(day("p" + i));
        assertThatThrownBy(() -> template(tooMany)).isInstanceOf(IllegalArgumentException.class);
        assertThat(template(tooMany.subList(0, 30)).days()).hasSize(30);
    }

    @Test
    @DisplayName("mỗi địa điểm chỉ một lần trong cả lịch; mã địa điểm trống bị từ chối; lịch phải có ít nhất một địa điểm")
    void placesAreUniqueAndPresent() {
        assertThatThrownBy(() -> template(List.of(day("p1"), day("p2", "p1")))).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("p1");
        assertThatThrownBy(() -> template(List.of(day("p1", "p1")))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> template(List.of(day(" ")))).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> template(List.of(new TemplateDay(List.of(), "chỉ ghi chú")))).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("mỗi ngày phải có địa điểm hoặc ghi chú: ngày trống trơn (hoặc ghi chú toàn khoảng trắng) bị từ chối")
    void everyDayNeedsContent() {
        assertThatThrownBy(() -> new TemplateDay(List.of(), null)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TemplateDay(List.of(), "   ")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new TemplateDay(null, null)).isInstanceOf(IllegalArgumentException.class);
        assertThat(new TemplateDay(List.of(), "Nghỉ").placeIds()).isEmpty();
    }

    @Test
    @DisplayName("requirePlacesIn: mọi địa điểm phải có trong điểm đến; mã lạ nêu rõ trong lời báo")
    void placesMustExistInDestination() {
        ItineraryTemplate t = template(List.of(day("p1"), day("p2")));
        t.requirePlacesIn(Set.of("p1", "p2", "p3"), "ha-giang");
        assertThatThrownBy(() -> t.requirePlacesIn(Set.of("p1"), "ha-giang")).isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("p2").hasMessageContaining("ha-giang");
    }

    @Test
    @DisplayName("TemplateStatus: mã draft/approved; mã lạ trả rỗng (không tự coi là đã duyệt)")
    void statusCodes() {
        assertThat(TemplateStatus.fromCode("draft")).contains(TemplateStatus.DRAFT);
        assertThat(TemplateStatus.fromCode("approved")).contains(TemplateStatus.APPROVED);
        assertThat(TemplateStatus.fromCode("duyet")).isEmpty();
        assertThat(TemplateStatus.fromCode(null)).isEmpty();
    }
}
