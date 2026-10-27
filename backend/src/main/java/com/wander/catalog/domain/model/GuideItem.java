package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;

/** Một dòng trong khối cẩm nang. {@code placeId} chỉ có khi dòng trỏ tới một địa điểm trong cùng điểm đến. */
public record GuideItem(String icon, String title, String text, String placeId) {

    public GuideItem {
        CatalogValidation.require(!Texts.isNullOrBlank(title), CatalogMessages.GUIDE_ITEM_TITLE_MISSING);
        icon = Texts.trimToEmpty(icon);
        text = Texts.trimToEmpty(text);
        placeId = Texts.trimToNull(placeId);
    }
}
