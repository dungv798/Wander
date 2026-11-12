/** The weekday (0 = Sunday) used as the default start day when using a sample itinerary: the nearest Saturday, like the trip-creating sheet. */
export const DEFAULT_START_WEEKDAY = 6;

/** The maximum number of days of a sample itinerary (a defensive ceiling; a real trip has at most 366 days). */
export const MAX_TEMPLATE_DAYS = 30;
/** The maximum length of the name and description read from a sample-itinerary file (untrusted data). */
export const MAX_TITLE = 120;
export const MAX_TEXT = 400;
