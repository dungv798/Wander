package com.wander.shared.kernel.util;

import com.wander.shared.kernel.constant.CommonConstants;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.text.Normalizer;
import java.util.regex.Pattern;

/**
 * Nhãn do người dùng TỰ KHAI (tên thiết bị, tên hiển thị): chưa được xác minh nên chỉ dùng để nhận ra nhau, không làm bằng chứng danh tính.
 * Một nơi duy nhất chuẩn hóa để các module không viết lại (DRY-1).
 */
public final class Labels {

    private static final Pattern WHITESPACE = Pattern.compile(CommonConstants.LABEL_WHITESPACE_REGEX);

    private Labels() {
    }

    /**
     * Chuẩn hóa NFC, gộp mọi khoảng trắng thành một dấu cách và cắt hai đầu. Ký tự điều khiển, định dạng/vô hình (RTL override,
     * zero-width, BOM…), tách dòng/đoạn, vùng riêng hoặc chưa gán ⇒ MALFORMED; quá {@code maxCodePoints} (tính theo code point) ⇒ TOO_LONG.
     * Trả chuỗi rỗng nếu chỉ có khoảng trắng; người gọi tự quyết rỗng là lỗi hay là "không đặt".
     */
    public static String normalize(String raw, int maxCodePoints, String field) {
        String normalized = Normalizer.normalize(raw, Normalizer.Form.NFC);
        if (normalized.codePoints().anyMatch(Labels::isForbidden)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, field);
        String text = WHITESPACE.matcher(normalized).replaceAll(CommonConstants.SINGLE_SPACE).strip();
        if (text.codePointCount(0, text.length()) > maxCodePoints) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, field);
        return text;
    }

    /** Ký tự không được có trong nhãn: điều khiển, định dạng/vô hình, tách dòng/đoạn, thay thế, vùng riêng, chưa gán. */
    private static boolean isForbidden(int codePoint) {
        if (Character.isISOControl(codePoint)) return true;
        return switch (Character.getType(codePoint)) {
            case Character.FORMAT, Character.LINE_SEPARATOR, Character.PARAGRAPH_SEPARATOR, Character.SURROGATE,
                    Character.PRIVATE_USE, Character.UNASSIGNED -> true;
            default -> false;
        };
    }
}
