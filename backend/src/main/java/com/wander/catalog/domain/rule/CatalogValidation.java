package com.wander.catalog.domain.rule;

import com.wander.catalog.domain.constant.CatalogConstants;
import com.wander.catalog.domain.constant.CatalogMessages;
import com.wander.shared.kernel.util.Texts;
import java.util.Collection;

/** Kiểm tra dữ liệu biên tập dùng chung cho các lớp domain của catalog (một nơi, tránh lặp). */
public final class CatalogValidation {

    private CatalogValidation() {
    }

    /** Ném lỗi với lời báo đã định dạng nếu điều kiện sai. */
    public static void require(boolean condition, String messageTemplate, Object... arguments) {
        if (!condition) throw new IllegalArgumentException(messageTemplate.formatted(arguments));
    }

    /** Chuỗi bắt buộc có nội dung; trả về chuỗi đã cắt khoảng trắng. */
    public static String requiredText(String value, String label) {
        require(!Texts.isNullOrBlank(value), CatalogMessages.FIELD_REQUIRED, label);
        return value.trim();
    }

    /** Chuỗi bắt buộc có nội dung và không dài quá {@code maxLength}; trả về chuỗi đã cắt khoảng trắng. */
    public static String requiredText(String value, String label, int maxLength) {
        String trimmed = requiredText(value, label);
        require(trimmed.length() <= maxLength, CatalogMessages.FIELD_TOO_LONG, label, trimmed.length(), maxLength);
        return trimmed;
    }

    /** Mọi giá trị đều là tháng 1..12 (không null); sai thì ném lỗi với lời báo đã định dạng theo {@code owner}. */
    public static void requireMonths(Collection<Integer> months, String messageTemplate, String owner) {
        boolean allValid = months.stream().allMatch(CatalogValidation::isMonth);
        require(allValid, messageTemplate, owner);
    }

    /** Số là tháng hợp lệ (1..12). */
    private static boolean isMonth(Integer month) {
        return month != null && month >= CatalogConstants.MONTH_MIN && month <= CatalogConstants.MONTH_MAX;
    }
}
