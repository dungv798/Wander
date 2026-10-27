package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.CatalogConstants;
import java.text.Normalizer;
import java.util.Locale;

/** Chuẩn hóa chuỗi để tìm không phân biệt hoa thường và dấu tiếng Việt ("ha giang" khớp "Hà Giang"). */
public final class SearchText {

    private static final char D_STROKE_LOWER = 'đ';
    private static final char D_STROKE_UPPER = 'Đ';

    private SearchText() {
    }

    /** Dạng so sánh của chuỗi: bỏ dấu, đ thành d, chữ thường, cắt khoảng trắng; null thành chuỗi rỗng. */
    public static String normalize(String text) {
        if (text == null) return "";
        String trimmed = text.trim().replace(D_STROKE_LOWER, 'd').replace(D_STROKE_UPPER, 'D');
        return Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll(CatalogConstants.COMBINING_MARKS_REGEX, "")
                .toLowerCase(Locale.ROOT);
    }
}
