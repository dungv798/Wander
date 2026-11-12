package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.ImmutableLists;
import com.wander.shared.kernel.util.Texts;
import java.util.List;

/**
 * One day of a sample itinerary: the places in visiting order and an optional editorial note. Deliberately has NO times, prices or ratings
 * (DR-018 N-2: use only places that really exist in the catalog). A day with no place is valid when it has an explanatory note.
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

    /** The place id trimmed; blank is a data error. */
    private static String trimmedPlaceId(String placeId) {
        CatalogValidation.require(!Texts.isNullOrBlank(placeId), CatalogMessages.TEMPLATE_PLACE_ID_BLANK);
        return placeId.trim();
    }
}
