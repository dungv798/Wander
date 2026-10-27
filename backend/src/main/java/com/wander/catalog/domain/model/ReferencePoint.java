package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;

/**
 * Mốc để tính "cách bao xa" (ví dụ thành phố Hà Giang). {@code approximate} = tọa độ chưa kiểm chứng,
 * giao diện luôn ghi là ước tính.
 */
public record ReferencePoint(String id, String name, GeoPoint location, boolean approximate) {

    public ReferencePoint {
        boolean complete = !Texts.isNullOrBlank(id) && !Texts.isNullOrBlank(name) && location != null;
        CatalogValidation.require(complete, CatalogMessages.REFERENCE_FIELDS_MISSING);
    }
}
