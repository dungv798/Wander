import { useSyncExternalStore } from 'react';
import { DEFAULT_DESTINATION_ID, VIEW } from '../const/routes.const.ts';
import type { ViewName } from '../const/routes.const.ts';
import { parentRoute, routeDepth, withRouteDepth } from './backNavigation.ts';
import { isOverlayEntry, withoutOverlay } from './overlayHistory.ts';

/**
 * A parsed route: the screen name, the main parameter id (the destination id in `dest`/`deck`, the trip id in `trip`) and the secondary parameter
 * (the trip id when adding a place from the deck; the tab `ov`/day number in `trip`).
 */
export interface Route {
  readonly view: ViewName;
  readonly id: string | null;
  readonly sub: string | null;
}

const VIEWS_WITH_DEST: readonly ViewName[] = [VIEW.DEST, VIEW.DECK];
const VIEWS_WITH_ID: readonly ViewName[] = [VIEW.DEST, VIEW.DECK, VIEW.TRIP, VIEW.TODAY, VIEW.EXPORT, VIEW.JOIN, VIEW.DESTINATIONS];
/** A screen with an optional trip id: `#/today` (the trip in progress) or `#/today/<id>`. */
const VIEWS_OPTIONAL_ID: readonly ViewName[] = [VIEW.TODAY, VIEW.DESTINATIONS];
const KNOWN: readonly ViewName[] = Object.values(VIEW);
const HOME: Route = { view: VIEW.EXPLORE, id: null, sub: null };
/** A valid id: lowercase, digits, hyphens (it goes into a data-loading path so it must be strict). */
const ID_PATTERN = /^[a-z0-9-]{1,64}$/;
/** An invite-link code: 256-bit base64url (43 characters, with uppercase and underscore) so it has its own pattern. */
const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;
let latestDepth = 0;

/** Parses `location.hash` (like `#/dest/ha-giang`, `#/trip/<id>/2`) into a route; an unknown address goes to Discover. */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('?')[0]?.split('/').filter(Boolean) ?? [];
  const view = parts[0] === 'd' ? VIEW.DEST : KNOWN.find((v) => v === parts[0]);
  if (!view) return HOME;
  if (!VIEWS_WITH_ID.includes(view)) return { view, id: null, sub: null };
  const id = parts[1] ?? (VIEWS_WITH_DEST.includes(view) ? DEFAULT_DESTINATION_ID : null);
  if (!id && VIEWS_OPTIONAL_ID.includes(view)) return { view, id: null, sub: null };
  if (view === VIEW.JOIN) return id && INVITE_CODE_PATTERN.test(id) ? { view, id, sub: null } : HOME;
  if (!id || !ID_PATTERN.test(id)) return HOME;
  const sub = parts[2] ?? null;
  return { view, id, sub: sub && ID_PATTERN.test(sub) ? sub : null };
}

/** Builds the hash address for a screen. */
export function toHash(view: ViewName, id?: string | null, sub?: string | null): string {
  if (view === VIEW.EXPLORE) return '#/';
  const tail = [id, id ? sub : null].filter(Boolean).join('/');
  return tail ? `#/${view}/${tail}` : `#/${view}`;
}

/** Switches screen by changing the hash (the browser Back button works correctly). */
export function navigate(view: ViewName, id?: string | null, sub?: string | null): void {
  const next = toHash(view, id, sub);
  if (location.hash === next) return;
  const state = withRouteDepth(withoutOverlay(history.state), routeDepth(history.state) + 1);
  if (isOverlayEntry(history.state, location.hash)) history.replaceState(state, '', next);
  else history.pushState(state, '', next);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Replaces the hash without adding a history entry (changing the day tab does not fill up the Back button). */
export function replaceRoute(view: ViewName, id?: string | null, sub?: string | null): void {
  history.replaceState(withoutOverlay(history.state), '', toHash(view, id, sub));
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

/** Goes back to the exact previous entry in the app; when a link was opened directly it uses the parent screen instead, avoiding a Back loop. */
export function goBack(): void {
  if (isOverlayEntry(history.state, location.hash) || routeDepth(history.state) > 0) { history.back(); return; }
  const route = parseHash(location.hash);
  const parent = parentRoute(route.view, route.id);
  replaceRoute(parent.view, parent.id);
}

/** Subscribes to hash changes. */
function subscribe(onChange: () => void): () => void {
  if (history.state === null) history.replaceState(withRouteDepth(null, latestDepth), '');
  /** Marks the original hash link too; Back/Forward entries that already have state are kept as they are. */
  const changed = (event: HashChangeEvent): void => {
    if (event.oldURL && history.state === null) history.replaceState(withRouteDepth(null, latestDepth + 1), '');
    latestDepth = routeDepth(history.state);
    onChange();
  };
  window.addEventListener('hashchange', changed);
  return () => window.removeEventListener('hashchange', changed);
}

/** The current route; re-renders when the hash changes. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => location.hash, () => '');
  return parseHash(hash);
}
