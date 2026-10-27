package com.wander.identity.application.input;

import com.wander.identity.domain.constant.IdentityErrorCodes;
import com.wander.identity.domain.constant.IdentityMessages;
import com.wander.identity.domain.rule.Secrets;
import com.wander.shared.kernel.error.WanderException;

/** Đọc và kiểm tra các trường đầu vào dạng thô của API Identity; dùng chung cho các service để không viết lại. */
public final class IdentityInput {

    private IdentityInput() {
    }

    /** Mã nhận diện lần thử khôi phục đúng dạng; sai thì báo lỗi trường {@code attemptId}. */
    public static String attemptKey(Object value) {
        if (!(value instanceof String text) || !Secrets.ATTEMPT_KEY.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_ATTEMPT, IdentityMessages.INVALID_ATTEMPT, IdentityFields.ATTEMPT_ID);
        }
        return text;
    }

    /** Bí mật phiên đúng dạng; sai thì báo lỗi trường {@code sessionToken}. */
    public static String sessionToken(Object value) {
        if (!(value instanceof String text) || !Secrets.SESSION_TOKEN.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.INVALID_SESSION_TOKEN, IdentityFields.SESSION_TOKEN);
        }
        return text;
    }

    /** Lỗi báo bí mật phiên đã thuộc về phiên hoặc yêu cầu khác. */
    public static WanderException tokenInUse() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.SESSION_TOKEN_IN_USE, IdentityFields.SESSION_TOKEN);
    }
}
