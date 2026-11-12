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

    /** Id of the recovery attempt in the right shape; otherwise reports an error on the {@code attemptId} field. */
    public static String attemptKey(String text) {
        if (text == null || !Secrets.ATTEMPT_KEY.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_ATTEMPT, IdentityMessages.INVALID_ATTEMPT, IdentityFields.ATTEMPT_ID);
        }
        return text;
    }

    /** Session secret in the right shape; otherwise reports an error on the {@code sessionToken} field. */
    public static String sessionToken(String text) {
        if (text == null || !Secrets.SESSION_TOKEN.matcher(text).matches()) {
            throw WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.INVALID_SESSION_TOKEN, IdentityFields.SESSION_TOKEN);
        }
        return text;
    }

    /**
     * Optional device name. This is a label the device DECLARES ITSELF, NOT VERIFIED: it is never used as identifying evidence.
     * NFC-normalized; control, format or invisible characters (RTL override, zero-width, BOM...), line separators, private-use or unassigned
     * => MALFORMED; runs of whitespace collapse to one space; absent, null or empty after normalization => null (no name set).
     * More than {@value IdentityConstants#MAX_DEVICE_NAME_LENGTH} characters (counted in code points, matching the DB CHECK) => TOO_LONG.
     */
    public static String deviceName(String raw) {
        if (raw == null) return null;
        String text = Labels.normalize(raw, IdentityConstants.MAX_DEVICE_NAME_LENGTH, IdentityFields.DEVICE_NAME);
        if (text.isEmpty()) return null;
        return text;
    }


    /**
     * Matching number chosen by the approver: required (missing => REQUIRED), must be a two-digit integer (a string, decimal, boolean, list
     * or out-of-range value => MALFORMED). Checked BEFORE the request is touched: a wrong shape is a UI error, not a wrong choice.
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

    /** Error: the session secret already belongs to another session or request. */
    public static WanderException tokenInUse() {
        return WanderException.invalid(IdentityErrorCodes.INVALID_SESSION_TOKEN, IdentityMessages.SESSION_TOKEN_IN_USE, IdentityFields.SESSION_TOKEN);
    }
}
