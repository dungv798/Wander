package com.wander.rating.application.input;

import com.wander.rating.domain.constant.RatingConstants;
import com.wander.rating.domain.constant.RatingMessages;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;
import java.util.regex.Pattern;

/** Đọc và kiểm tra các trường đầu vào dạng thô của API rating. */
public final class RatingInput {

    private static final Pattern PLACE_REF = Pattern.compile(RatingConstants.PLACE_REF_REGEX);

    private RatingInput() {
    }

    /** Mã quán đúng dạng; sai thì báo MALFORMED ở trường {@code placeRef}. */
    public static String placeRef(String value) {
        if (value == null || !PLACE_REF.matcher(value).matches()) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, RatingFields.PLACE_REF);
        }
        return value;
    }

    /** Điểm: bắt buộc, số nguyên 1–5 (thiếu ⇒ REQUIRED; chuỗi, số thập phân, boolean ⇒ MALFORMED; ngoài khoảng ⇒ OUT_OF_RANGE). */
    public static int stars(Object value) {
        if (value == null) throw WanderException.invalidValue(ErrorCodes.REQUIRED, RatingFields.STARS);
        if (!(value instanceof Integer number)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, RatingFields.STARS);
        if (number < RatingConstants.STARS_MIN || number > RatingConstants.STARS_MAX) {
            throw WanderException.invalid(ErrorCodes.OUT_OF_RANGE, RatingMessages.STARS_OUT_OF_RANGE, RatingFields.STARS);
        }
        return number;
    }

    /** Lời bình tùy chọn: chuẩn hóa như nhãn người dùng (không ký tự điều khiển/vô hình); rỗng hoặc không nêu ⇒ null. */
    public static String comment(Object value) {
        if (value == null) return null;
        if (!(value instanceof String raw)) throw WanderException.invalidValue(ErrorCodes.MALFORMED, RatingFields.COMMENT);
        String text = Labels.normalize(raw, RatingConstants.COMMENT_MAX_LENGTH, RatingFields.COMMENT);
        return text.isEmpty() ? null : text;
    }
}
