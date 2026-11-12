package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;

/**
 * A landmark for computing 'how far' (for example Ha Giang city). {@code approximate} = the coordinates are not verified,
 * the UI always labels it an estimate.
 */
public record ReferencePoint(String id, String name, GeoPoint location, boolean approximate) {

    public ReferencePoint {
        boolean complete = !Texts.isNullOrBlank(id) && !Texts.isNullOrBlank(name) && location != null;
        CatalogValidation.require(complete, CatalogMessages.REFERENCE_FIELDS_MISSING);
    }
}
