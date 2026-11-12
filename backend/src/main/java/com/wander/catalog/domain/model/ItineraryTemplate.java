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
 * A sample itinerary (N-2, DR-018): a suggestion for visiting a destination day by day, made only of places that really exist in the catalog, with no times/prices/ratings.
 * Each place appears exactly once in the whole itinerary (so adding it to a trip does not create duplicate items). {@code status} says whether the PO has approved
 * the content yet; the UI always labels it 'Draft' while it is not approved.
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

    /** The number of different places in the whole itinerary. */
    public int placeCount() {
        return (int) days.stream().mapToLong(day -> day.placeIds().size()).sum();
    }

    /** Every place of the itinerary must exist in the destination {@code destinationId}; an unknown id throws an error that names the id. */
    public void requirePlacesIn(Set<String> destinationPlaceIds, String destinationId) {
        for (TemplateDay day : days) {
            for (String placeId : day.placeIds()) {
                CatalogValidation.require(destinationPlaceIds.contains(placeId), CatalogMessages.TEMPLATE_PLACE_UNKNOWN, id, placeId,
                        destinationId);
            }
        }
    }

    /** Each place exactly once in the whole itinerary and the itinerary has at least one place. */
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
