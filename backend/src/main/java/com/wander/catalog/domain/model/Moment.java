package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.MomentTheme;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;

/**
 * A moment of a destination (DR-034): a life photo with a theme and a short caption, fully attributed like a place photo.
 * The photo only illustrates the atmosphere and is not tied to one specific place.
 */
public record Moment(String id, MomentTheme theme, String caption, Photo photo, String authorUrl) {

    /** Old moment data is kept as it is while there is no author link yet. */
    public Moment(String id, MomentTheme theme, String caption, Photo photo) {
        this(id, theme, caption, photo, null);
    }

    /** Keeps the required fields and rejects an author link that is not https on Unsplash; null means no link yet. */
    public Moment {
        CatalogValidation.require(!Texts.isNullOrBlank(id), CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_ID);
        CatalogValidation.require(theme != null, CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_THEME);
        CatalogValidation.require(!Texts.isNullOrBlank(caption), CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_CAPTION);
        CatalogValidation.require(photo != null, CatalogMessages.MOMENT_FIELD_MISSING, CatalogMessages.LABEL_MOMENT_PHOTO);
        id = id.trim();
        caption = caption.trim();
        if (authorUrl != null) {
            requireAllowedAuthorUrl(authorUrl);
        }
    }

    /** The author link must have a valid URI syntax, use https and be the Unsplash server, with no login information. */
    private static void requireAllowedAuthorUrl(String authorUrl) {
        URI uri;
        try {
            uri = URI.create(authorUrl);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(CatalogMessages.MOMENT_AUTHOR_URL_INVALID, e);
        }
        CatalogValidation.require(CatalogConstants.HTTPS_SCHEME.equalsIgnoreCase(uri.getScheme())
                && CatalogConstants.MOMENT_AUTHOR_HOST.equalsIgnoreCase(uri.getHost()) && uri.getUserInfo() == null,
                CatalogMessages.MOMENT_AUTHOR_URL_INVALID);
    }
}
