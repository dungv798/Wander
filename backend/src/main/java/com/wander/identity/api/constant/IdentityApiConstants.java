package com.wander.identity.api.constant;

/** Constants of the Identity API and its authentication framework (FEATURE tier): paths, JSON keys, Authorization scheme. */
public final class IdentityApiConstants {

    /** Base path of every API. */
    public static final String BASE_PATH = "/api";

    /** Pattern that matches every API path. */
    public static final String ALL_API_PATTERN = BASE_PATH + "/**";

    /** Create an identity. */
    public static final String IDENTITY_PATH = "/identity";

    /** Start recovery with a code. */
    public static final String RECOVERY_START_PATH = "/recovery/start";

    /** Complete recovery with a code. */
    public static final String RECOVERY_COMPLETE_PATH = "/recovery/complete";

    /** Request to pair a device. */
    public static final String DEVICE_LINKS_PATH = "/device-links";

    /** Status of a device pairing request. */
    public static final String DEVICE_LINK_BY_ID_PATH = DEVICE_LINKS_PATH + "/{id}";

    /** Approve a device pairing. */
    public static final String DEVICE_LINK_APPROVE_PATH = DEVICE_LINKS_PATH + "/approve";

    /** List of sessions. */
    public static final String SESSIONS_PATH = "/sessions";

    /** Preview a pairing request on the approving device (device name, time, the matching-number choices). */
    public static final String DEVICE_LINK_PREVIEW_PATH = DEVICE_LINKS_PATH + "/preview";

    /** Actively deny a pairing request. */
    public static final String DEVICE_LINK_DENY_PATH = DEVICE_LINKS_PATH + "/deny";

    /** Security event log (BE-11). */
    public static final String EVENTS_PATH = "/events";

    /** Mark the event log as seen. */
    public static final String EVENTS_SEEN_PATH = "/events/seen";

    /** The session of the calling device itself (rename the device). */
    public static final String CURRENT_SESSION_PATH = SESSIONS_PATH + "/current";

    /** Revoke every other session of the current identity. */
    public static final String OTHER_SESSIONS_PATH = SESSIONS_PATH + "/others";

    /** One session by id. */
    public static final String SESSION_BY_ID_PATH = SESSIONS_PATH + "/{id}";

    /** Status of the recovery code. */
    public static final String RECOVERY_CODE_PATH = "/recovery-code";

    /** Phase 1: create the replacement code. */
    public static final String RECOVERY_CODE_BEGIN_PATH = RECOVERY_CODE_PATH + "/begin";

    /** Phase 2: confirm the replacement code. */
    public static final String RECOVERY_CODE_CONFIRM_PATH = RECOVERY_CODE_PATH + "/confirm";

    /** Ask for a re-authentication approval. */
    public static final String STEP_UP_REQUESTS_PATH = "/step-up/requests";

    /** Approve a re-authentication approval. */
    public static final String STEP_UP_APPROVE_PATH = "/step-up/approve";

    /** Preview a re-authentication request on the approving device. */
    public static final String STEP_UP_PREVIEW_PATH = "/step-up/preview";

    /** Actively deny a re-authentication request. */
    public static final String STEP_UP_DENY_PATH = "/step-up/deny";

    /** Public path pattern: create an identity. */
    public static final String PUBLIC_IDENTITY_PATTERN = BASE_PATH + IDENTITY_PATH;

    /** Public path pattern: start recovery. */
    public static final String PUBLIC_RECOVERY_START_PATTERN = BASE_PATH + RECOVERY_START_PATH;

    /** Public path pattern: complete recovery. */
    public static final String PUBLIC_RECOVERY_COMPLETE_PATTERN = BASE_PATH + RECOVERY_COMPLETE_PATH;

    /** Public path pattern: create a device pairing request. */
    public static final String PUBLIC_DEVICE_LINKS_PATTERN = BASE_PATH + DEVICE_LINKS_PATH;

    /** Public path pattern: read the status of a device pairing request. */
    public static final String PUBLIC_DEVICE_LINK_STATUS_PATTERN = BASE_PATH + DEVICE_LINKS_PATH + "/*";

    /**
     * Public path pattern: read the place catalog (DR-008 Q-a), rate limited per address in the catalog controller.
     * The value must match the base path of the catalog module; identity does not import catalog, so it is repeated here (checked by SecurityIT).
     */
    public static final String PUBLIC_CATALOG_PATTERN = BASE_PATH + "/catalog/**";

    /** Header that carries the session secret. */
    public static final String HEADER_AUTHORIZATION = "Authorization";

    /** Header that announces the authentication scheme on a 401. */
    public static final String HEADER_WWW_AUTHENTICATE = "WWW-Authenticate";

    /** The Bearer authentication scheme. */
    public static final String SCHEME_BEARER = "Bearer";

    /** Valid shape of the Authorization header; group 1 is the session secret. */
    public static final String BEARER_HEADER_REGEX = "^Bearer ([A-Za-z0-9_-]{20,128})$";

    /** Internal message: the Authorization header has the wrong shape. */
    public static final String AUTHORIZATION_FORMAT_INVALID = "Định dạng Authorization không hợp lệ.";

    /** Internal message: the session secret matches no valid session. */
    public static final String SESSION_INVALID = "Phiên không hợp lệ.";

    private IdentityApiConstants() {
    }

    /** Preview of a trip invite link: public, rate limited per address (planning module, repeated like PUBLIC_CATALOG_PATTERN). */
    public static final String PUBLIC_INVITE_PREVIEW_PATTERN = BASE_PATH + "/invites/preview";
}
