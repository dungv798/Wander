package com.wander.planning.domain.constant;

/** Names of the JSON fields of the Planning API (the contract, matching {@code web/src/api.ts}); also used as the field name in errors. */
public final class PlanningFields {
    /** Trip cover; nullable means automatic. */
    public static final String COVER = "cover";
    /** Reference code of a photo or gradient. */
    public static final String REF = "ref";

    /** Trip name. */
    public static final String NAME = "name";

    /** Destination. */
    public static final String DESTINATION = "destination";

    /** Start date. */
    public static final String START_DATE = "startDate";

    /** End date. */
    public static final String END_DATE = "endDate";

    /** Planned budget. */
    public static final String BUDGET = "budget";

    /** Trip kind. */
    public static final String STYLES = "styles";

    /** Trip pace. */
    public static final String PACE = "pace";

    /** Date of an item. */
    public static final String DAY = "day";

    /** Item type. */
    public static final String TYPE = "type";

    /** Item title. */
    public static final String TITLE = "title";

    /** Time of day. */
    public static final String TIME_OF_DAY = "timeOfDay";

    /** Duration, in minutes. */
    public static final String DURATION_MIN = "durationMin";

    /** Note. */
    public static final String NOTE = "note";

    /** Booking status. */
    public static final String BOOKING = "booking";

    /** Position in the day. */
    public static final String POSITION = "position";

    /** Cost. */
    public static final String COST = "cost";

    /** Included. */
    public static final String INCLUDED = "included";

    /** Reference price. */
    public static final String REFERENCE_COST = "referenceCost";

    /** The bulk date-assignment list of the schedule command. */
    public static final String ASSIGNMENTS = "assignments";

    /** Item id in one date-assignment element. */
    public static final String ITEM_ID = "itemId";

    /** 'Who is going' of the trip (ADR-014). */
    public static final String KIND = "kind";

    /** Interests of the trip (ADR-014). */
    public static final String INTERESTS = "interests";

    /** Flag that the departure/return dates are tentative (DR-018 A3). */
    public static final String DATES_TENTATIVE = "datesTentative";

    /** Id of the place in the editorial catalog that the item links to. */
    public static final String PLACE_ID = "placeId";

    /** The list of item ids in the new order. */
    public static final String ORDERED_IDS = "orderedIds";

    /** Completed. */
    public static final String DONE = "done";

    private PlanningFields() {
    }

    /** Display name of a member. */
    public static final String DISPLAY_NAME = "displayName";

    /** Invite link code. */
    public static final String INVITE_CODE = "code";

    /** Item id in a deletion request. */
    public static final String REQUEST_ITEM_ID = "itemId";

    /** Reason for a deletion request. */
    public static final String REASON = "reason";

    /** Group of a checklist item. */
    public static final String GROUP = "group";
}
