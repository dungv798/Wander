/** The wait after typing stops before the camera flies, in milliseconds. */
export const DESTINATION_SEARCH_DEBOUNCE_MS = 1000;
/** The key of the destination choice, public and holding no secret. */
export const DESTINATION_STORAGE_KEY = 'wander.web.destination.v1';
/** The zoom ceiling when finding a destination's center. */
export const DESTINATION_SEARCH_ZOOM = 10;
/** The nationwide base id for the shared map set. */
export const COUNTRY_MAP_ID = 'vietnam';
/** The same shape as a route id: lowercase, digits, hyphens; at most 64 characters. */
export const DESTINATION_ID_PATTERN = /^[a-z0-9-]{1,64}$/;
