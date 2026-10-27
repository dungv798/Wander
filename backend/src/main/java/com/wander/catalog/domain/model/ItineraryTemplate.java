package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.TemplateStatus;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Lịch mẫu (N-2, DR-018): gợi ý đi một điểm đến theo ngày, chỉ gồm địa điểm có thật trong kho, không giờ/giá/đánh giá.
 * Mỗi địa điểm xuất hiện đúng một lần trong cả lịch (để thêm vào chuyến không bị trùng mục). {@code status} cho biết PO đã duyệt
 * nội dung chưa; giao diện luôn gắn nhãn "Bản nháp" khi chưa duyệt.
 */
public record ItineraryTemplate(String id, String title, String summary, TemplateStatus status, List<TemplateDay> days) {

    private static final Pattern ID_PATTERN = Pattern.compile(CatalogConstants.TEMPLATE_ID_REGEX);

    public ItineraryTemplate {
        id = CatalogValidation.requiredText(id, CatalogMessages.TEMPLATE_ID_LABEL, CatalogConstants.TEMPLATE_ID_MAX_LENGTH);
        CatalogValidation.require(ID_PATTERN.matcher(id).matches(), CatalogMessages.TEMPLATE_ID_INVALID, id);
        title = CatalogValidation.requiredText(title, CatalogMessages.TEMPLATE_TITLE_LABEL, CatalogConstants.TEMPLATE_TITLE_MAX_LENGTH);
        String trimmedSummary = Texts.trimToEmpty(summary);
        CatalogValidation.require(trimmedSummary.length() <= CatalogConstants.TEMPLATE_TEXT_MAX_LENGTH, CatalogMessages.FIELD_TOO_LONG,
                CatalogMessages.TEMPLATE_SUMMARY_LABEL, trimmedSummary.length(), CatalogConstants.TEMPLATE_TEXT_MAX_LENGTH);
        summary = trimmedSummary;
        CatalogValidation.require(status != null, CatalogMessages.TEMPLATE_STATUS_REQUIRED, id);
        days = ImmutableLists.copyOrEmpty(days);
        CatalogValidation.require(!days.isEmpty(), CatalogMessages.TEMPLATE_NEEDS_DAY, id);
        CatalogValidation.require(days.size() <= CatalogConstants.TEMPLATE_MAX_DAYS, CatalogMessages.TEMPLATE_TOO_MANY_DAYS, id,
                days.size(), CatalogConstants.TEMPLATE_MAX_DAYS);
        requireUniquePlaces(id, days);
    }

    /** Số địa điểm khác nhau trong cả lịch. */
    public int placeCount() {
        return (int) days.stream().mapToLong(day -> day.placeIds().size()).sum();
    }

    /** Mọi địa điểm của lịch phải có trong điểm đến {@code destinationId}; mã lạ thì ném lỗi nêu rõ mã. */
    public void requirePlacesIn(Set<String> destinationPlaceIds, String destinationId) {
        for (TemplateDay day : days) {
            for (String placeId : day.placeIds()) {
                CatalogValidation.require(destinationPlaceIds.contains(placeId), CatalogMessages.TEMPLATE_PLACE_UNKNOWN, id, placeId,
                        destinationId);
            }
        }
    }

    /** Mỗi địa điểm đúng một lần trong cả lịch và lịch có ít nhất một địa điểm. */
    private static void requireUniquePlaces(String templateId, List<TemplateDay> days) {
        Set<String> seen = new HashSet<>();
        for (TemplateDay day : days) {
            for (String placeId : day.placeIds()) {
                CatalogValidation.require(seen.add(placeId), CatalogMessages.TEMPLATE_PLACE_DUPLICATED, templateId, placeId);
            }
        }
        CatalogValidation.require(!seen.isEmpty(), CatalogMessages.TEMPLATE_NEEDS_PLACE, templateId);
    }
}
