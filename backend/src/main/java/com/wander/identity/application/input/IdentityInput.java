package com.wander.identity.application.input;

import com.wander.identity.domain.constant.IdentityConstants;
import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.rule.Secrets;
import com.wander.shared.kernel.constant.ErrorCodes;
import com.wander.shared.kernel.error.WanderException;
import com.wander.shared.kernel.util.Labels;

/** Validates the typed request values of the identity API (the JSON layer has already enforced the JSON types); shared by the services. */
public final class IdentityInput {


    private IdentityInput() {
    }

    /** Mã nhận diện lần thử khôi phục đúng dạng; sai thì báo lỗi trường {@code attemptId}. */
    public static String attemptKey(String text) {
        if (text == null || !Secrets.ATTEMPT_KEY.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_ATTEMPT, IdentityMessages.INVALID_ATTEMPT, IdentityFields.ATTEMPT_ID);
        }
        return text;
    }

    /** Bí mật phiên đúng dạng; sai thì báo lỗi trường {@code sessionToken}. */
    public static String sessionToken(String text) {
        if (text == null || !Secrets.SESSION_TOKEN.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.INVALID_SESSION_TOKEN, IdentityFields.SESSION_TOKEN);
        }
        return text;
    }

    /**
     * Tên thiết bị tùy chọn. Đây là nhãn do thiết bị TỰ KHAI, CHƯA ĐƯỢC XÁC MINH: không dùng làm bằng chứng nhận diện.
     * Chuẩn hóa NFC; ký tự điều khiển, định dạng/vô hình (RTL override, zero-width, BOM…), tách dòng, vùng riêng hoặc chưa gán
     * ⇒ MALFORMED; dãy khoảng trắng gộp thành một dấu cách; không nêu, null hoặc rỗng sau chuẩn hóa ⇒ null (chưa đặt tên).
     * Quá {@value IdentityConstants#MAX_DEVICE_NAME_LENGTH} ký tự (tính theo code point, khớp CHECK của DB) ⇒ TOO_LONG.
     */
    public static String deviceName(String raw) {
        if (raw == null) return null;
        String text = Labels.normalize(raw, IdentityConstants.MAX_DEVICE_NAME_LENGTH, IdentityFields.DEVICE_NAME);
        if (text.isEmpty()) return null;
        return text;
    }


    /**
     * Số khớp người duyệt chọn: bắt buộc (thiếu ⇒ REQUIRED), phải là số nguyên hai chữ số (chuỗi, số thập phân, boolean, danh
     * sách hay ngoài khoảng ⇒ MALFORMED). Kiểm tra TRƯỚC khi đụng tới yêu cầu: dạng sai là lỗi của giao diện, không phải chọn sai.
     */
    public static int matchNumber(Integer number) {
        if (number == null) {
            throw WanderException.invalid(ErrorCodes.REQUIRED, IdentityMessages.MATCH_NUMBER_REQUIRED, IdentityFields.NUMBER);
        }
        if (number < IdentityConstants.MATCH_NUMBER_MIN || number > IdentityConstants.MATCH_NUMBER_MAX) {
            throw WanderException.invalidValue(ErrorCodes.MALFORMED, IdentityFields.NUMBER);
        }
        return number;
    }

    /** Lỗi báo bí mật phiên đã thuộc về phiên hoặc yêu cầu khác. */
    public static WanderException tokenInUse() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.SESSION_TOKEN_IN_USE, IdentityFields.SESSION_TOKEN);
    }
}
