package com.wander.planning.domain.constant;

/** Error codes specific to the planning module (the API contract, matching {@code web/src/api.ts}). Shared codes are in {@code ErrorCodes}. */
public final class PlanningErrorCodes {
    /** The cover has the wrong kind or code (DR-031). */
    public static final String INVALID_COVER = "INVALID_COVER";

    /** The date is not a valid calendar date. */
    public static final String INVALID_DATE = "INVALID_DATE";

    /** The start date is missing. */
    public static final String START_REQUIRED = "START_REQUIRED";

    /** The end date is missing. */
    public static final String END_REQUIRED = "END_REQUIRED";

    /** The end date is before the start date. */
    public static final String END_BEFORE_START = "END_BEFORE_START";

    /** The item type is not valid. */
    public static final String INVALID_TYPE = "INVALID_TYPE";

    /** The booking status is not valid. */
    public static final String INVALID_BOOKING = "INVALID_BOOKING";

    /** The trip kind is not valid. */
    public static final String INVALID_STYLE = "INVALID_STYLE";

    /** 'Who is going' is not valid. */
    public static final String INVALID_KIND = "INVALID_KIND";

    /** The interest is not valid. */
    public static final String INVALID_INTEREST = "INVALID_INTEREST";

    /** The trip pace is not valid. */
    public static final String INVALID_PACE = "INVALID_PACE";

    /** An item appears twice in the same bulk date-assignment command. */
    public static final String DUPLICATE_ASSIGNMENT = "DUPLICATE_ASSIGNMENT";

    /** The sort order does not match the set of items visible in the day. */
    public static final String INVALID_ORDER = "INVALID_ORDER";

    /** The date is outside the trip's date range. */
    public static final String DAY_OUT_OF_RANGE = "DAY_OUT_OF_RANGE";

    /** The item has been deleted so it cannot be edited. */
    public static final String ITEM_DELETED = "ITEM_DELETED";

    /** The trip's 'Recently deleted' is full. */
    public static final String TRASH_FULL = "TRASH_FULL";

    /** The item has already been deleted. */
    public static final String ALREADY_DELETED = "ALREADY_DELETED";

    /** The item has not been deleted so it cannot be restored. */
    public static final String NOT_DELETED = "NOT_DELETED";

    /** The item is not in 'Recently deleted' so it cannot be permanently deleted yet. */
    public static final String NOT_IN_TRASH = "NOT_IN_TRASH";

    /** Only a 'To-do' item has a tick box. */
    public static final String NOT_A_TASK = "NOT_A_TASK";

    /** This item type has no booking status. */
    public static final String BOOKING_NOT_APPLICABLE = "BOOKING_NOT_APPLICABLE";

    /** A reference price is valid only when 'included' is ticked. */
    public static final String REFERENCE_REQUIRES_INCLUDED = "REFERENCE_REQUIRES_INCLUDED";

    private PlanningErrorCodes() {
    }

    /** A wrong, expired or revoked invite link or a deleted trip: ONE common error, it does not reveal which. */
    public static final String INVALID_INVITE = "INVALID_INVITE";

    /** The trip has reached its maximum number of members. */
    public static final String TRIP_FULL = "TRIP_FULL";

    /** Only the Organizer can do this. */
    public static final String NOT_ORGANIZER = "NOT_ORGANIZER";

    /** A member can edit/delete only the items they added themself. */
    public static final String NOT_YOUR_ITEM = "NOT_YOUR_ITEM";

    /** The Organizer neither leaves nor is removed from their own trip (to get rid of it, delete the trip). */
    public static final String ORGANIZER_CANNOT_LEAVE = "ORGANIZER_CANNOT_LEAVE";

    /** One's own item is deleted directly, no request needed. */
    public static final String OWN_ITEM_DELETE_DIRECTLY = "OWN_ITEM_DELETE_DIRECTLY";

    /** The Organizer deletes directly, no request needed. */
    public static final String ORGANIZER_DELETES_DIRECTLY = "ORGANIZER_DELETES_DIRECTLY";

    /** This item already has a pending deletion request. */
    public static final String REQUEST_EXISTS = "REQUEST_EXISTS";

    /** Too many pending requests of the same member. */
    public static final String TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS";

    /** The request has already been decided. */
    public static final String ALREADY_DECIDED = "ALREADY_DECIDED";

    /** The trip's checklist has reached its maximum number of items. */
    public static final String CHECKLIST_FULL = "CHECKLIST_FULL";
}
