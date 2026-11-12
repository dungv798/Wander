package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;

/** One line in a guide block. {@code placeId} is present only when the line points to a place in the same destination. */
public record GuideItem(String icon, String title, String text, String placeId) {

    public GuideItem {
        CatalogValidation.require(!Texts.isNullOrBlank(title), CatalogMessages.GUIDE_ITEM_TITLE_MISSING);
        icon = Texts.trimToEmpty(icon);
        text = Texts.trimToEmpty(text);
        placeId = Texts.trimToNull(placeId);
    }
}
