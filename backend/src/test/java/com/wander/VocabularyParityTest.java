package com.wander;

import static org.assertj.core.api.Assertions.assertThat;

import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.planning.domain.vocabulary.TripInterest;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * ADR-014: planning không được import catalog nên tự định nghĩa {@link TripInterest}. Test này (được phép thấy cả hai module)
 * giữ hai tập từ vựng khớp nhau: cùng mã, cùng nhãn, cùng thứ tự. Thêm loại địa điểm ở catalog mà quên ở planning thì đỏ ở đây.
 */
class VocabularyParityTest {

    @Test
    @DisplayName("TripInterest (planning) khớp PlaceCategory (catalog): cùng mã, cùng nhãn, cùng thứ tự")
    void tripInterestMatchesPlaceCategory() {
        List<String> catalogCodes = Arrays.stream(PlaceCategory.values()).map(PlaceCategory::code).toList();
        List<String> catalogLabels = Arrays.stream(PlaceCategory.values()).map(PlaceCategory::label).toList();
        List<String> planningCodes = Arrays.stream(TripInterest.values()).map(TripInterest::code).toList();
        List<String> planningLabels = Arrays.stream(TripInterest.values()).map(TripInterest::label).toList();

        assertThat(planningCodes).containsExactlyElementsOf(catalogCodes);
        assertThat(planningLabels).containsExactlyElementsOf(catalogLabels);
    }
}
