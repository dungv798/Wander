package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.MomentTheme;
import com.wander.shared.kernel.util.Texts;

/**
 * Một khoảnh khắc của điểm đến (DR-034): ảnh đời sống kèm chủ đề và chú thích ngắn, có ghi công đầy đủ như ảnh địa điểm.
 * Ảnh chỉ minh họa không khí, không gắn vào một địa điểm cụ thể.
 */
public record Moment(String id, MomentTheme theme, String caption, Photo photo) {

    public Moment {
        CatalogValidation.require(!Texts.isNullOrBlank(id), CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_ID);
        CatalogValidation.require(theme != null, CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_THEME);
        CatalogValidation.require(!Texts.isNullOrBlank(caption), CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_CAPTION);
        CatalogValidation.require(photo != null, CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_PHOTO);
        id = id.trim();
        caption = caption.trim();
    }
}
