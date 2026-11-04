package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.PlaceCategory;
import com.wander.catalog.domain.vocabulary.TimeSlot;
import com.wander.catalog.domain.vocabulary.Verdict;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Một địa điểm trong bộ thẻ quẹt. Nội dung biên tập (hook, nhãn gợi ý, buổi nên đi, mẹo) là bản nháp cho tới khi
 * PO duyệt. Ảnh KHÔNG bắt buộc (PO 03/11/2026, DR-033): địa điểm đủ căn cứ vẫn nhập được khi chưa có ảnh đã tuyển, giao diện
 * dùng ô giữ chỗ theo loại; mỗi ảnh đã khai báo vẫn phải đủ ghi công và tệp phải tồn tại.
 */
public record Place(
        String id,
        String destinationId,
        String name,
        PlaceCategory category,
        String area,
        String hook,
        String summary,
        GeoPoint location,
        List<Integer> bestMonths,
        String bestLabel,
        String duration,
        String difficulty,
        List<String> highlights,
        Verdict verdict,
        String verdictReason,
        Set<TimeSlot> bestSlots,
        String slotReason,
        List<String> tips,
        List<Photo> photos,
        String wikipediaTitle) {

    private static final Pattern SLUG = Pattern.compile(CatalogConstants.SLUG_REGEX);

    public Place {
        CatalogValidation.require(isSlug(id) && id.length() <= CatalogConstants.PLACE_ID_MAX_LENGTH, CatalogMessages.PLACE_ID_INVALID, id);
        CatalogValidation.require(isSlug(destinationId), CatalogMessages.DESTINATION_ID_INVALID, destinationId);
        name = CatalogValidation.requiredText(name, CatalogMessages.LABEL_NAME, CatalogConstants.NAME_MAX_LENGTH);
        area = CatalogValidation.requiredText(area, CatalogMessages.LABEL_AREA, CatalogConstants.AREA_MAX_LENGTH);
        hook = CatalogValidation.requiredText(hook, CatalogMessages.LABEL_HOOK, CatalogConstants.HOOK_MAX_LENGTH);
        CatalogValidation.require(category != null && verdict != null, CatalogMessages.PLACE_KIND_MISSING, id);
        bestLabel = CatalogValidation.requiredText(bestLabel, CatalogMessages.LABEL_BEST_LABEL, CatalogConstants.BEST_LABEL_MAX_LENGTH);
        duration = CatalogValidation.requiredText(duration, CatalogMessages.LABEL_DURATION, CatalogConstants.DURATION_MAX_LENGTH);
        difficulty = CatalogValidation.requiredText(difficulty, CatalogMessages.LABEL_DIFFICULTY, CatalogConstants.DIFFICULTY_MAX_LENGTH);
        verdictReason = CatalogValidation.requiredText(verdictReason, CatalogMessages.LABEL_VERDICT_REASON, CatalogConstants.REASON_MAX_LENGTH);
        slotReason = CatalogValidation.requiredText(slotReason, CatalogMessages.LABEL_SLOT_REASON, CatalogConstants.REASON_MAX_LENGTH);
        summary = Texts.trimToEmpty(summary);
        bestMonths = ImmutableLists.copyOrEmpty(bestMonths);
        CatalogValidation.requireMonths(bestMonths, CatalogMessages.MONTH_OUT_OF_RANGE_IN_PLACE, id);
        highlights = ImmutableLists.copyOrEmpty(highlights);
        tips = ImmutableLists.copyOrEmpty(tips);
        bestSlots = bestSlots == null || bestSlots.isEmpty() ? Set.of() : Set.copyOf(bestSlots);
        photos = ImmutableLists.copyOrEmpty(photos);
        CatalogValidation.require(photos.size() <= CatalogConstants.MAX_PHOTOS_PER_PLACE, CatalogMessages.PLACE_TOO_MANY_PHOTOS,
                id, CatalogConstants.MAX_PHOTOS_PER_PLACE);
    }

    /** Chuỗi có đúng dạng slug (không null). */
    private static boolean isSlug(String value) {
        return value != null && SLUG.matcher(value).matches();
    }
}
