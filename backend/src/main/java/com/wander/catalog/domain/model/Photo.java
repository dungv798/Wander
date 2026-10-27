package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.shared.kernel.util.Texts;
import java.util.regex.Pattern;

/**
 * Ảnh của địa điểm kèm thông tin ghi công. Giấy phép mở (Creative Commons...) buộc phải hiển thị tác giả,
 * giấy phép và liên kết gốc (ADR-009), nên cả ba trường là bắt buộc.
 */
public record Photo(String file, String author, String license, String sourceUrl) {

    private static final Pattern FILE_NAME = Pattern.compile(CatalogConstants.PHOTO_FILE_REGEX);

    public Photo {
        file = requiredPhotoField(file, CatalogMessages.LABEL_PHOTO_FILE);
        author = requiredPhotoField(author, CatalogMessages.LABEL_PHOTO_AUTHOR);
        license = requiredPhotoField(license, CatalogMessages.LABEL_PHOTO_LICENSE);
        sourceUrl = requiredPhotoField(sourceUrl, CatalogMessages.LABEL_PHOTO_SOURCE_URL);
        CatalogValidation.require(FILE_NAME.matcher(file).matches(), CatalogMessages.PHOTO_FILE_NAME_INVALID, file);
        CatalogValidation.require(sourceUrl.startsWith(CatalogConstants.HTTPS_PREFIX), CatalogMessages.PHOTO_SOURCE_NOT_HTTPS, sourceUrl);
    }

    /** Trường văn bản bắt buộc của ảnh: không rỗng, trả về bản đã cắt khoảng trắng. */
    private static String requiredPhotoField(String value, String label) {
        CatalogValidation.require(!Texts.isNullOrBlank(value), CatalogMessages.PHOTO_FIELD_MISSING, label);
        return value.trim();
    }
}
