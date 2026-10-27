package com.wander.planning.domain.rule;

import com.wander.planning.domain.constant.PlanningConstants;
import com.wander.planning.domain.constant.PlanningFields;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import java.util.regex.Pattern;

/** Quy tắc văn bản của mục: tiêu đề bắt buộc, ghi chú tùy chọn (giới hạn là mặc định của implementation). */
public final class ItemText {

    private static final Pattern PLACE_ID = Pattern.compile(PlanningConstants.PLACE_ID_REGEX);

    private ItemText() {
    }

    /** Tiêu đề mục: bắt buộc, đã cắt khoảng trắng, không dài quá giới hạn. */
    public static String title(String raw) {
        return required(raw, PlanningConstants.MAX_TITLE, PlanningFields.TITLE);
    }

    /**
     * Mã địa điểm trong kho: trống ⇒ không liên kết (null); còn lại phải là slug không quá {@value PlanningConstants#MAX_PLACE_ID_LENGTH}
     * ký tự. Planning không tra kho (hai module độc lập) nên chỉ kiểm dạng, không kiểm mã có tồn tại.
     */
    public static String placeId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String stripped = raw.strip();
        if (stripped.length() > PlanningConstants.MAX_PLACE_ID_LENGTH) {
            throw WanderException.invalidValue(ErrorCodes.TOO_LONG, PlanningFields.PLACE_ID);
        }
        if (!PLACE_ID.matcher(stripped).matches()) throw WanderException.invalidValue(ErrorCodes.MALFORMED, PlanningFields.PLACE_ID);
        return stripped;
    }

    /** Ghi chú: rỗng sau khi cắt khoảng trắng thì coi như không có (null). */
    public static String note(String raw) {
        if (raw == null) return null;
        String stripped = raw.strip();
        if (stripped.isEmpty()) return null;
        if (stripped.length() > PlanningConstants.MAX_NOTE) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, PlanningFields.NOTE);
        return stripped;
    }

    /** Văn bản bắt buộc của trường {@code field}: đã cắt khoảng trắng, không trống, không dài quá {@code max}. */
    public static String required(String raw, int max, String field) {
        String stripped = raw == null ? "" : raw.strip();
        if (stripped.isEmpty()) throw WanderException.invalidValue(ErrorCodes.REQUIRED, field);
        if (stripped.length() > max) throw WanderException.invalidValue(ErrorCodes.TOO_LONG, field);
        return stripped;
    }
}
