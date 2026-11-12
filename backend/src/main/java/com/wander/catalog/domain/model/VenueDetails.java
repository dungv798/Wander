package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.VenueKind;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;
import java.time.LocalDate;

/** Address information with a source; no price, vacancy or opening hours are inferred from the existence of a website. */
public record VenueDetails(VenueKind kind, String address, String website, String sourceUrl, LocalDate checkedAt,
                           String phone, String serviceHours, String priceNote) {

    /** Old data stays readable when the optional information has not been collected yet. */
    public VenueDetails(VenueKind kind, String address, String website, String sourceUrl, LocalDate checkedAt) {
        this(kind, address, website, sourceUrl, checkedAt, "", "", "");
    }

    public VenueDetails {
        CatalogValidation.require(kind != null && checkedAt != null, CatalogMessages.VENUE_METADATA_INVALID);
        address = CatalogValidation.requiredText(address, CatalogMessages.LABEL_VENUE_ADDRESS, CatalogConstants.VENUE_ADDRESS_MAX_LENGTH);
        website = Texts.trimToEmpty(website);
        sourceUrl = Texts.trimToEmpty(sourceUrl);
        CatalogValidation.require(https(sourceUrl) && (website.isEmpty() || https(website)), CatalogMessages.VENUE_URL_INVALID);
        phone = optional(phone, CatalogMessages.LABEL_VENUE_PHONE, CatalogConstants.VENUE_PHONE_MAX_LENGTH);
        serviceHours = optional(serviceHours, CatalogMessages.LABEL_VENUE_HOURS, CatalogConstants.VENUE_HOURS_MAX_LENGTH);
        priceNote = optional(priceNote, CatalogMessages.LABEL_VENUE_PRICE_NOTE, CatalogConstants.VENUE_PRICE_NOTE_MAX_LENGTH);
    }

    /** Empty means there is no information yet; no default value is added that would pretend it was confirmed. */
    private static String optional(String value, String label, int maxLength) {
        String text = Texts.trimToEmpty(value);
        return text.isEmpty() ? text : CatalogValidation.requiredText(text, label, maxLength);
    }

    /** Accepts only an HTTPS web link that has a host and no login information embedded in the URL. */
    private static boolean https(String value) {
        try {
            URI uri = URI.create(value);
            return value.startsWith(CatalogConstants.HTTPS_PREFIX) && uri.getHost() != null && uri.getUserInfo() == null;
        } catch (IllegalArgumentException error) {
            return false;
        }
    }
}
