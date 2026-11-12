package com.wander.catalog.application.query;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.model.Photo;
import com.wander.shared.kernel.util.Texts;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Builds the public URLs of catalog photos. Local photos are served by this application under {@code /catalog/photos/}; when
 * {@code wander.catalog.photo-base-url} (env {@code WANDER_PHOTO_BASE_URL}) is set, they are served from that origin instead
 * (object storage + CDN), flat: {@code <base>/<file>}. External photos (Unsplash) keep their own URL.
 */
@Component
public class PhotoUrls {

    private static final Pattern BASE_URL = Pattern.compile(CatalogConstants.PHOTO_BASE_URL_REGEX);

    private final String localPrefix;

    /** Reads the optional photo origin; an invalid value stops the application at startup. */
    public PhotoUrls(@Value(CatalogConstants.PHOTO_BASE_URL_EXPRESSION) String baseUrl) {
        String base = Texts.trimToEmpty(baseUrl);
        if (base.isEmpty()) {
            this.localPrefix = CatalogConstants.PHOTO_URL_PREFIX;
            return;
        }
        if (!BASE_URL.matcher(base).matches()) {
            throw new IllegalArgumentException(CatalogConstants.PHOTO_BASE_URL_INVALID.formatted(base));
        }
        this.localPrefix = base.endsWith(CatalogConstants.URL_SEPARATOR) ? base : base + CatalogConstants.URL_SEPARATOR;
    }

    /** URL of the main (largest) image. */
    public String url(Photo photo) {
        return photo.isExternal() ? photo.externalUrl() : localPrefix + photo.file();
    }

    /** URL of the 480 px variant, or {@code null} when the photo has no separate thumbnail. */
    public String thumbUrl(Photo photo) {
        return photo.thumbFile() == null ? null : localPrefix + photo.thumbFile();
    }

    /**
     * {@code srcset} value ("url 480w, url 1280w") for photos that have both variants with known widths; {@code null} otherwise.
     */
    public String srcSet(Photo photo) {
        if (photo.thumbFile() == null || photo.thumbWidth() == null || photo.width() == null) {
            return null;
        }
        return String.join(CatalogConstants.SRCSET_SEPARATOR,
                List.of(CatalogConstants.SRCSET_ENTRY_FORMAT.formatted(thumbUrl(photo), photo.thumbWidth()),
                        CatalogConstants.SRCSET_ENTRY_FORMAT.formatted(url(photo), photo.width())));
    }
}
