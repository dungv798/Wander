package com.wander.planning.domain.constant;

import java.util.List;

/**
 * Constants of the planning module (FEATURE tier): content limits, input formats, column lengths, display format.
 * Error codes are in {@link PlanningErrorCodes}, messages in {@link PlanningMessages}. The limits are implementation defaults
 * (docs/implementation/decisions.md) and can be changed.
 */
public final class PlanningConstants {

    /** Maximum length of an item title. */
    public static final int MAX_TITLE = 200;

    /** Maximum length of an item note. */
    public static final int MAX_NOTE = 2000;

    /** Maximum length of a trip name. */
    public static final int MAX_TRIP_NAME = 120;

    /** Maximum length of a destination. */
    public static final int MAX_DESTINATION = 200;

    /** Maximum length of a place id in the catalog (matches {@code Place.id} in catalog; the two modules refer to each other only by id). */
    public static final int MAX_PLACE_ID_LENGTH = 60;

    /** A place id as a slug: lowercase, digits, joined by hyphens (matches the CHECK in migration V4). */
    public static final String PLACE_ID_REGEX = "[a-z0-9]+(-[a-z0-9]+)*";

    /** Maximum number of elements of one bulk date-assignment command (equal to the 'Recently deleted' ceiling, DR-020). */
    public static final int MAX_ASSIGNMENTS = 500;

    /** The 'Recently deleted' ceiling of a trip (DR-020): when full, further deletes are blocked, old items are never permanently deleted automatically (D19). Matches `LIMITS.MAX_TRASH` in the UI. */
    public static final int MAX_TRASH_ITEMS = 500;

    /** Hyphen before the number suffix when a trip name clashes (DR-006). */
    public static final String NAME_SUFFIX_SEPARATOR = " - ";

    /** The first number suffix when a name clashes: ' - 2'. */
    public static final int FIRST_NAME_SUFFIX = 2;

    /** The largest number suffix tried (exclusive); after that a random short code is used. */
    public static final int MAX_NAME_SUFFIX = 200;

    /** Number of characters of the short code used when number suffixes run out. */
    public static final int NAME_SHORT_CODE_LENGTH = 4;

    /** Number of days in a week. */
    public static final int DAYS_PER_WEEK = 7;

    /** Number of hours in a day. */
    public static final int HOURS_PER_DAY = 24;

    /** Number of minutes in an hour. */
    public static final int MINUTES_PER_HOUR = 60;

    /** Maximum duration of an item, in minutes: 7 days (Q18b). */
    public static final int MAX_DURATION_MIN = DAYS_PER_WEEK * HOURS_PER_DAY * MINUTES_PER_HOUR;

    /** Largest hour of the time of day (24-hour clock). */
    public static final int MAX_HOUR = 23;

    /** Largest minute of the time of day. */
    public static final int MAX_MINUTE = 59;

    /** Maximum cost, in thousand VND (Q18d). */
    public static final long MAX_COST_K = 1_000_000_000L;

    /** Maximum number of digits of a cost given as a string after leading zeros are removed (enough to hold {@link #MAX_COST_K}). */
    public static final int MAX_AMOUNT_DIGITS = 10;

    /** Maximum number of days of a trip (both ends included). */
    public static final int MAX_DAYS = 366;

    /** Maximum number of trip kinds chosen at once. */
    public static final int MAX_STYLES = 5;

    /** Weekday labels, index 0 is Sunday. */
    public static final List<String> WEEKDAY_LABELS = List.of("CN", "T2", "T3", "T4", "T5", "T6", "T7");

    /** A date as YYYY-MM-DD. */
    public static final String ISO_DATE_REGEX = "^\\d{4}-\\d{2}-\\d{2}$";

    /** A time as HH:MM, two groups for hours and minutes. */
    public static final String TIME_OF_DAY_REGEX = "^(\\d{2}):(\\d{2})$";

    /** Display pattern of a time of day. */
    public static final String TIME_OF_DAY_PATTERN = "HH:mm";

    /** A string made only of digits. */
    public static final String DIGITS_REGEX = "^\\d+$";

    /** A string that is a negative integer. */
    public static final String NEGATIVE_DIGITS_REGEX = "^-\\d+$";

    /** Leading zeros to remove (keeping one digit). */
    public static final String LEADING_ZEROS_REGEX = "^0+(?=\\d)";

    /** Separator of the trip-kind codes when stored in one column. */
    public static final String STYLE_CODE_SEPARATOR = ",";

    /** The thousand multiplier: 1 thousand VND = 1,000 VND. */
    public static final long VND_PER_THOUSAND = 1000;

    /** Number of digits per group when displaying money. */
    public static final int VND_GROUP_SIZE = 3;

    /** Thousands group separator of money (as in vi-VN). */
    public static final char VND_GROUP_SEPARATOR = '.';

    /** Suffix when displaying money. */
    public static final String VND_SUFFIX = " ₫";

    /** Minus sign when displaying money. */
    public static final String VND_MINUS = "-";

    /** Length of the column {@code trips.styles}. */
    public static final int STYLES_COLUMN_LENGTH = 100;

    /** Maximum number of interests of a trip (equal to the number of place types). */
    public static final int MAX_INTERESTS = 6;

    /** Length of the column {@code trips.interests}. */
    public static final int INTERESTS_COLUMN_LENGTH = 100;

    /** Length of the column {@code trips.kind}. */
    public static final int KIND_COLUMN_LENGTH = 16;

    /** Length of the column {@code trips.pace}. */
    public static final int PACE_COLUMN_LENGTH = 16;

    /** Length of the column {@code items.type}. */
    public static final int ITEM_TYPE_COLUMN_LENGTH = 32;

    /** Length of the column {@code items.booking_status}. */
    public static final int BOOKING_COLUMN_LENGTH = 16;

    private PlanningConstants() {
    }

    /** Maximum number of members of a trip, including the Organizer (H5, Tier B). */
    public static final int MAX_MEMBERS = 10;

    /** An invite link expires after this many days from when it was created (Q7). */
    public static final long INVITE_TTL_DAYS = 7;

    /** Maximum display name (counted in code points). */
    public static final int MAX_DISPLAY_NAME = 40;

    /** Default (and reserved) display name of the Organizer: neutral, NOT taken from the device name. */
    public static final String ORGANIZER_DISPLAY_NAME = "Organizer";

    /** Number of random bytes of an invite code (256 bits -> 43 base64url characters). */
    public static final int INVITE_CODE_BYTES = 32;

    /** A well-formed invite code: 43 base64url characters. */
    public static final String INVITE_CODE_REGEX = "[A-Za-z0-9_-]{43}";

    /** Hash algorithm of invite codes. */
    public static final String INVITE_HASH_ALGORITHM = "SHA-256";

    /** Domain prefix of the invite-code hash. */
    public static final String INVITE_HASH_PREFIX = "wander.invite.v1:";

    /** Length of the member-role column. */
    public static final int ROLE_COLUMN_LENGTH = 16;

    /** Maximum number of pending deletion requests of one member. */
    public static final int MAX_PENDING_REQUESTS = 20;

    /** Number of decided requests kept per trip (older ones are cleaned up). */
    public static final int MAX_DECIDED_REQUESTS = 50;

    /** Maximum deletion-request reason (G4). */
    public static final int MAX_REQUEST_REASON = 200;

    /** Length of the request-reason column (enough for MAX_REQUEST_REASON characters of any code point form). */
    public static final int REQUEST_REASON_COLUMN_LENGTH = 800;

    /** Maximum number of checklist items of a trip. */
    public static final int MAX_CHECKLIST_ITEMS = 100;

    /** Maximum checklist item name. */
    public static final int MAX_CHECKLIST_TITLE = 120;

    /** Maximum checklist group name (empty = no group). */
    public static final int MAX_CHECKLIST_GROUP = 60;
}
