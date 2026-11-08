package com.wander.catalog.domain.model;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.catalog.domain.rule.CatalogValidation;
import com.wander.catalog.domain.vocabulary.MomentTheme;
import com.wander.shared.kernel.util.Texts;
import java.net.URI;

/**
 * Một khoảnh khắc của điểm đến (DR-034): ảnh đời sống kèm chủ đề và chú thích ngắn, có ghi công đầy đủ như ảnh địa điểm.
 * Ảnh chỉ minh họa không khí, không gắn vào một địa điểm cụ thể.
 */
public record Moment(String id, MomentTheme theme, String caption, Photo photo, String authorUrl) {

    /** Dữ liệu khoảnh khắc cũ được giữ nguyên khi chưa có liên kết tác giả. */
    public Moment(String id, MomentTheme theme, String caption, Photo photo) {
        this(id, theme, caption, photo, null);
    }

    /** Giữ các trường bắt buộc và từ chối liên kết tác giả khác https trên Unsplash; null là chưa có liên kết. */
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

    /** Liên kết tác giả phải có cú pháp URI hợp lệ, dùng https và đúng máy chủ Unsplash, không có thông tin đăng nhập. */
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
