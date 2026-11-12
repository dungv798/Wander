package com.wander.identity.domain.constant;

/** Error codes specific to the identity module (the API contract, matching {@code web/src/api.ts}). Shared codes are in {@code ErrorCodes}. */
public final class IdentityErrorCodes {

    /** The device pairing code is wrong or expired. */
    public static final String INVALID_PAIRING_CODE = "INVALID_PAIRING_CODE";

    /** The recovery code is wrong or already used. */
    public static final String INVALID_CODE = "INVALID_CODE";

    /** The replacement code typed again is wrong. */
    public static final String INVALID_REPLACEMENT = "INVALID_REPLACEMENT";

    /** The attempt id is not valid. */
    public static final String INVALID_ATTEMPT = "INVALID_ATTEMPT";

    /** The session secret is not valid or was already used. */
    public static final String INVALID_SESSION_TOKEN = "INVALID_SESSION_TOKEN";

    /** The action is not in the list of actions that need re-authentication. */
    public static final String INVALID_OPERATION = "INVALID_OPERATION";

    /** The re-authentication approval code is wrong or expired. */
    public static final String INVALID_APPROVAL_CODE = "INVALID_APPROVAL_CODE";

    /** The approver chose the wrong matching number. */
    public static final String MATCH_MISMATCH = "MATCH_MISMATCH";

    /** The recovery attempt or replacement code has expired. */
    public static final String ATTEMPT_EXPIRED = "ATTEMPT_EXPIRED";

    /** The recovery code was already used in another recovery. */
    public static final String CODE_ALREADY_USED = "CODE_ALREADY_USED";

    /** The recovery code changed while waiting for confirmation. */
    public static final String CODE_CHANGED = "CODE_CHANGED";

    /** Re-authentication is needed before a sensitive action. */
    public static final String STEP_UP_REQUIRED = "STEP_UP_REQUIRED";

    private IdentityErrorCodes() {
    }
}
