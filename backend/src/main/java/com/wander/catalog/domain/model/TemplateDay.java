package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.List;

/**
 * Một ngày của lịch mẫu: các địa điểm theo thứ tự đi và ghi chú biên tập tùy chọn. Cố ý KHÔNG có giờ, giá hay đánh giá
 * (DR-018 N-2: chỉ dùng địa điểm có thật trong kho). Ngày không có địa điểm nào là hợp lệ khi có ghi chú giải thích.
 */
public record TemplateDay(List<String> placeIds, String note) {

    public TemplateDay {
        placeIds = ImmutableLists.copyOrEmpty(placeIds).stream().map(TemplateDay::trimmedPlaceId).toList();
        note = Texts.trimToNull(note);
        CatalogValidation.require(!placeIds.isEmpty() || note != null, CatalogMessages.TEMPLATE_DAY_EMPTY);
        CatalogValidation.require(note == null || note.length() <= CatalogConstants.TEMPLATE_TEXT_MAX_LENGTH,
                CatalogMessages.FIELD_TOO_LONG, CatalogMessages.TEMPLATE_NOTE_LABEL,
                note == null ? 0 : note.length(), CatalogConstants.TEMPLATE_TEXT_MAX_LENGTH);
    }

    /** Mã địa điểm đã cắt khoảng trắng; trống là lỗi dữ liệu. */
    private static String trimmedPlaceId(String placeId) {
        CatalogValidation.require(!Texts.isNullOrBlank(placeId), CatalogMessages.TEMPLATE_PLACE_ID_BLANK);
        return placeId.trim();
    }
}
