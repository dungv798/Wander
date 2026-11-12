package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;
import java.util.regex.Pattern;

/**
 * A photo with its attribution. An open license (Creative Commons...) or the Unsplash license requires showing the author, the license and the original link
 * (ADR-009), so those fields are required. The photo source is EXACTLY ONE of two: {@code file} (a file stored locally in the catalog) or
 * {@code externalUrl} (a photo loaded directly from an allowed external server, DR-034: Unsplash requires hotlinking).
 */
public record Photo(String file, String externalUrl, String author, String license, String sourceUrl, String caption, String authorUrl,
                    String thumbFile) {

    private static final Pattern FILE_NAME = Pattern.compile(CatalogConstants.PHOTO_FILE_REGEX);
    private static final Pattern VARIANT_NAME = Pattern.compile(CatalogConstants.PHOTO_VARIANT_REGEX);

    /** Photo without a separate thumbnail variant (external photos and single-variant files). */
    public Photo(String file, String externalUrl, String author, String license, String sourceUrl, String caption, String authorUrl) {
        this(file, externalUrl, author, license, sourceUrl, caption, authorUrl, null);
    }

    /** A photo that already has a caption can still be read when there is no author link yet. */
    public Photo(String file, String externalUrl, String author, String license, String sourceUrl, String caption) {
        this(file, externalUrl, author, license, sourceUrl, caption, "");
    }

    /** Old photo data does not need a caption to remain readable. */
    public Photo(String file, String externalUrl, String author, String license, String sourceUrl) {
        this(file, externalUrl, author, license, sourceUrl, "");
    }

    /** A locally stored photo (the common case). */
    public Photo(String file, String author, String license, String sourceUrl) {
        this(file, null, author, license, sourceUrl);
    }

    public Photo {
        file = Texts.isNullOrBlank(file) ? null : file.trim();
        thumbFile = Texts.isNullOrBlank(thumbFile) ? null : thumbFile.trim();
        externalUrl = Texts.isNullOrBlank(externalUrl) ? null : externalUrl.trim();
        CatalogValidation.require((file == null) != (externalUrl == null), CatalogMessages.PHOTO_NEEDS_ONE_SOURCE);
        author = requiredPhotoField(author, CatalogMessages.LABEL_PHOTO_AUTHOR);
        license = requiredPhotoField(license, CatalogMessages.LABEL_PHOTO_LICENSE);
        sourceUrl = requiredPhotoField(sourceUrl, CatalogMessages.LABEL_PHOTO_SOURCE_URL);
        CatalogValidation.require(sourceUrl.startsWith(CatalogConstants.HTTPS_PREFIX), CatalogMessages.PHOTO_SOURCE_NOT_HTTPS, sourceUrl);
        caption = Texts.trimToEmpty(caption);
        authorUrl = Texts.trimToEmpty(authorUrl);
        if (!authorUrl.isEmpty()) {
            URI uri;
            try {
                uri = URI.create(authorUrl);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException(CatalogMessages.PHOTO_AUTHOR_URL_INVALID, e);
            }
            CatalogValidation.require(CatalogConstants.HTTPS_SCHEME.equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null,
                    CatalogMessages.PHOTO_AUTHOR_URL_INVALID);
        }
        CatalogValidation.require(caption.length() <= CatalogConstants.PHOTO_CAPTION_MAX_LENGTH, CatalogMessages.PHOTO_CAPTION_TOO_LONG,
                CatalogConstants.PHOTO_CAPTION_MAX_LENGTH);
        if (file != null) {
            CatalogValidation.require(FILE_NAME.matcher(file).matches(), CatalogMessages.PHOTO_FILE_NAME_INVALID, file);
            CatalogValidation.require(thumbFile == null || FILE_NAME.matcher(thumbFile).matches(), CatalogMessages.PHOTO_FILE_NAME_INVALID, thumbFile);
        } else {
            CatalogValidation.require(thumbFile == null, CatalogMessages.PHOTO_THUMB_NEEDS_FILE);
            requireAllowedExternalUrl(externalUrl);
        }
    }

    /** A photo loaded directly from an external server (no local file). */
    public boolean isExternal() {
        return externalUrl != null;
    }

    /**
     * Stable identifier of a local photo: the file name without the width/hash suffix and extension
     * ({@code ho-xuan-huong-1-w1280-3fa9c1d2ab.webp} and the legacy {@code ho-xuan-huong-1.jpg} are both {@code ho-xuan-huong-1}).
     * Persisted trip covers reference this value, so it must not change when a photo is re-encoded. {@code null} for external photos.
     */
    public String id() {
        return file == null ? null : slugOf(file);
    }

    /** Pixel width encoded in the file name of the main variant, or {@code null} when the name carries none. */
    public Integer width() {
        return file == null ? null : widthOf(file);
    }

    /** Pixel width encoded in the thumbnail's file name, or {@code null} when there is no thumbnail. */
    public Integer thumbWidth() {
        return thumbFile == null ? null : widthOf(thumbFile);
    }

    /** File name without the {@code -w<width>-<hash>} suffix (when present) and the extension. */
    private static String slugOf(String name) {
        var variant = VARIANT_NAME.matcher(name);
        return variant.matches() ? variant.group(1) : name.substring(0, name.lastIndexOf('.'));
    }

    /** Width taken from the {@code -w<width>-<hash>} suffix, or {@code null} for names without one. */
    private static Integer widthOf(String name) {
        var variant = VARIANT_NAME.matcher(name);
        return variant.matches() ? Integer.valueOf(variant.group(2)) : null;
    }

    /** An external URL must be https and its host in the allowed list (matches the CSP {@code img-src}). */
    private static void requireAllowedExternalUrl(String url) {
        CatalogValidation.require(url.startsWith(CatalogConstants.HTTPS_PREFIX), CatalogMessages.PHOTO_SOURCE_NOT_HTTPS, url);
        String host;
        try {
            host = URI.create(url).getHost();
        } catch (IllegalArgumentException e) {
            host = null;
        }
        CatalogValidation.require(host != null && CatalogConstants.EXTERNAL_PHOTO_HOSTS.contains(host),
                CatalogMessages.PHOTO_EXTERNAL_HOST_NOT_ALLOWED, url);
    }

    /** A required text field of a photo: not empty, returns the trimmed copy. */
    private static String requiredPhotoField(String value, String label) {
        CatalogValidation.require(!Texts.isNullOrBlank(value), CatalogMessages.PHOTO_FIELD_MISSING, label);
        return value.trim();
    }
}
