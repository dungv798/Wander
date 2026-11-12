package com.wander.planning.api.constant;

/** Constants of the Planning API (FEATURE tier): paths and JSON keys of the responses (matching {@code web/src/api.ts}). */
public final class PlanningApiConstants {

    /** Base path of trips. */
    public static final String TRIPS_PATH = "/api/trips";

    /** One trip by id. */
    public static final String TRIP_PATH = "/{tripId}";

    /** The items of a trip. */
    public static final String ITEMS_PATH = TRIP_PATH + "/items";

    /** One item by id. */
    public static final String ITEM_PATH = ITEMS_PATH + "/{itemId}";

    /** Restore a soft-deleted item. */
    public static final String ITEM_RESTORE_PATH = ITEM_PATH + "/restore";

    /** Permanently delete an item. */
    public static final String ITEM_PERMANENT_PATH = ITEM_PATH + "/permanent";

    /** Mark a to-do as done. */
    public static final String ITEM_DONE_PATH = ITEM_PATH + "/done";

    /** Reorder the items of a day. */
    public static final String DAY_REORDER_PATH = TRIP_PATH + "/days/{day}/reorder";

    /** Schedule command: change the date range and/or assign dates in bulk atomically (also used for Undo). */
    public static final String SCHEDULE_PATH = TRIP_PATH + "/schedule";

    /** The items in 'Recently deleted'. */
    public static final String TRASH_PATH = TRIP_PATH + "/trash";

    /** List of soft-deleted trips. */
    public static final String DELETED_TRIPS_PATH = "/deleted";

    /** Restore a soft-deleted trip. */
    public static final String TRIP_RESTORE_PATH = TRIP_PATH + "/restore";

    /** Preferences by identity (BE-10). */
    public static final String PREFERENCES_PATH = "/api/preferences";

    /** The path part of preferences. */
    public static final String INTERESTS_PATH = "/interests";

    private PlanningApiConstants() {
    }

    /** Invite links of a trip. */
    public static final String INVITES_PATH = TRIP_PATH + "/invites";

    /** The invite link in use (for revoking). */
    public static final String INVITE_ACTIVE_PATH = INVITES_PATH + "/active";

    /** Members of a trip. */
    public static final String MEMBERS_PATH = TRIP_PATH + "/members";

    /** One member by id. */
    public static final String MEMBER_PATH = MEMBERS_PATH + "/{memberId}";

    /** The caller themself in the trip. */
    public static final String MEMBER_ME_PATH = MEMBERS_PATH + "/me";

    /** Root of the invite-link API that is not tied to a specific trip. */
    public static final String INVITES_BASE_PATH = "/api/invites";

    /** Preview a link (public, rate limited). */
    public static final String INVITE_PREVIEW_PATH = "/preview";

    /** Join a trip with a link (needs a session). */
    public static final String INVITE_JOIN_PATH = "/join";

    /** Name of the path segment 'me' used for the current member. */
    public static final String ME = "me";

    /** Deletion requests of a trip. */
    public static final String REQUESTS_PATH = TRIP_PATH + "/deletion-requests";

    /** One request by id. */
    public static final String REQUEST_PATH = REQUESTS_PATH + "/{requestId}";

    /** Approve a request. */
    public static final String REQUEST_APPROVE_PATH = REQUEST_PATH + "/approve";

    /** Reject a request. */
    public static final String REQUEST_REJECT_PATH = REQUEST_PATH + "/reject";

    /** The preparation checklist of a trip. */
    public static final String CHECKLIST_PATH = TRIP_PATH + "/checklist";

    /** One checklist item. */
    public static final String CHECKLIST_ITEM_PATH = CHECKLIST_PATH + "/{itemId}";

    /** The caller's own completion mark on a checklist item. */
    public static final String CHECKLIST_DONE_PATH = CHECKLIST_ITEM_PATH + "/done";
}
