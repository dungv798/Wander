package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;
import java.util.regex.Pattern;

/**
 * Ảnh kèm thông tin ghi công. Giấy phép mở (Creative Commons...) hay giấy phép Unsplash buộc hiển thị tác giả, giấy phép và liên kết gốc
 * (ADR-009), nên các trường đó là bắt buộc. Nguồn ảnh là ĐÚNG MỘT trong hai: {@code file} (tệp lưu cục bộ trong kho) hoặc
 * {@code externalUrl} (ảnh tải thẳng từ máy chủ ngoài thuộc danh sách cho phép, DR-034: Unsplash bắt buộc hotlink).
 */
public record Photo(String file, String externalUrl, String author, String license, String sourceUrl, String caption, String authorUrl) {

    private static final Pattern FILE_NAME = Pattern.compile(CatalogConstants.PHOTO_FILE_REGEX);

    /** Ảnh đã có chú thích vẫn đọc được khi chưa có liên kết tác giả. */
    public Photo(String file, String externalUrl, String author, String license, String sourceUrl, String caption) {
        this(file, externalUrl, author, license, sourceUrl, caption, "");
    }

    /** Dữ liệu ảnh cũ không cần chú thích để tiếp tục đọc được. */
    public Photo(String file, String externalUrl, String author, String license, String sourceUrl) {
        this(file, externalUrl, author, license, sourceUrl, "");
    }

    /** Ảnh lưu cục bộ (trường hợp thường gặp). */
    public Photo(String file, String author, String license, String sourceUrl) {
        this(file, null, author, license, sourceUrl);
    }

    public Photo {
        file = Texts.isNullOrBlank(file) ? null : file.trim();
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
        } else {
            requireAllowedExternalUrl(externalUrl);
        }
    }

    /** Ảnh tải thẳng từ máy chủ ngoài (không có tệp cục bộ). */
    public boolean isExternal() {
        return externalUrl != null;
    }

    /** URL ngoài phải là https và máy chủ nằm trong danh sách cho phép (khớp CSP {@code img-src}). */
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

    /** Trường văn bản bắt buộc của ảnh: không rỗng, trả về bản đã cắt khoảng trắng. */
    private static String requiredPhotoField(String value, String label) {
        CatalogValidation.require(!Texts.isNullOrBlank(value), CatalogMessages.PHOTO_FIELD_MISSING, label);
        return value.trim();
    }
}
