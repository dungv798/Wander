/** The route (screen) names of the app. The values equal the prototype's screen names (`data-view`). */
export const VIEW = {
  EXPLORE: 'explore',
  DESTINATIONS: 'destinations',
  DEST: 'dest',
  DECK: 'deck',
  PICKED: 'picked',
  TRIPS: 'trips',
  TRIP: 'trip',
  ONBOARD: 'onboard',
  SECURITY: 'security',
  RECOVER: 'recover',
  EXPIRED: 'expired',
  SETTINGS: 'settings',
  TODAY: 'today',
  EXPORT: 'export',
  JOIN: 'join',
} as const;

/** A valid screen name. */
export type ViewName = (typeof VIEW)[keyof typeof VIEW];

/** The fallback destination when the catalog could not load yet. */
export const DEFAULT_DESTINATION_ID = 'ha-giang';

/**
 * The screens that hide the navigation bar on a phone (matching the prototype's `renderTabs`). The trip screen also hides it (B-01, DR-037): it already has a back button and the bottom bar
 * covers the place cards of the main work screen; to go to another tab you go back to the list.
 */
export const HIDE_TABBAR_ON_PHONE: readonly ViewName[] = [VIEW.ONBOARD, VIEW.DECK, VIEW.TODAY, VIEW.EXPORT, VIEW.TRIP];

/** The screens that have no navigation bar at any size. */
export const HIDE_TABBAR_ALWAYS: readonly ViewName[] = [VIEW.ONBOARD, VIEW.EXPIRED, VIEW.JOIN, VIEW.DESTINATIONS];
