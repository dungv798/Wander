import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';
import type { MapMarker } from '../../../shared/map/map.types.ts';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { DestinationDetail, DestinationSummary } from './Catalog.types.ts';
import { numberedMarkers, placeMarkers } from './mapMarkers.ts';
import { SHELL_MAP } from './shellMap.const.ts';
import { VIETNAM_ARCHIPELAGO_LABELS } from '../../../shared/map/vietnamLabels.const.ts';

/** The scene kinds of the frame map: the whole country, one destination, the selected places, your trips, or hidden (another screen covers it or has its own map). */
export type ShellSceneKind = 'overview' | 'destination' | 'picked' | 'trips' | 'hidden';

/** One map scene: the pins to draw, how the camera fits the frame and the key that changes when the camera must fly again. */
export interface ShellMapScene {
  readonly kind: ShellSceneKind;
  readonly markers: readonly MapMarker[];
  readonly fit: MapFit | null;
  readonly key: string;
}

/** The part of a trip's data that the map needs: the id, the name and the destination it belongs to. */
export interface ShellTripRef {
  readonly id: string;
  readonly name: string;
  readonly destinationId: string;
}

/** The input data for choosing the scene: the current screen and the catalog/selection/trip data already available. */
export interface ShellMapInput {
  readonly view: ViewName;
  readonly selectedId: string | null;
  readonly destId: string;
  readonly summaries: readonly DestinationSummary[];
  readonly detail: DestinationDetail | null;
  readonly pickedIds: ReadonlySet<string>;
  /** The user's trips (loaded); empty makes the Trips screen go back to the whole-country scene. */
  readonly trips: readonly ShellTripRef[];
}

/** A NEW fit-to-frame request each time (TerrainMapView re-runs fit-to-frame when the object changes): the camera flies again when the scene is rebuilt, not when it only re-renders. */
const overviewFit = (): MapFit => ({ ids: null, options: { padding: SHELL_MAP.OVERVIEW_PADDING_PX, maxZoom: SHELL_MAP.OVERVIEW_MAX_ZOOM, contextPoints: VIETNAM_ARCHIPELAGO_LABELS.map(label => label.coordinates) } });
const destinationFit = (): MapFit => ({ ids: null, options: { padding: SHELL_MAP.FIT_PADDING_PX } });

/** One pin per destination that has coordinates (cover photo + name) for the whole-country scene; a place with no coordinates is not given an invented position. */
function destinationMarkers(summaries: readonly DestinationSummary[]): MapMarker[] {
  return summaries
    .filter((d) => d.lat != null && d.lon != null)
    .map((d) => {
      return { id: d.id, lat: d.lat as number, lon: d.lon as number, label: d.name, ...(d.coverUrl ? { thumb: d.coverUrl } : {}) };
    });
}

/** One pin per trip placed at its destination's coordinates (the destination cover photo + the trip name); a trip of a destination with no coordinates has no pin. */
function tripMarkers(trips: readonly ShellTripRef[], summaries: readonly DestinationSummary[]): MapMarker[] {
  const byId = new Map(summaries.map((d) => [d.id, d] as const));
  return trips.flatMap((trip) => {
    const dest = byId.get(trip.destinationId);
    if (!dest || dest.lat == null || dest.lon == null) return [];
    return [{ id: trip.id, lat: dest.lat, lon: dest.lon, label: trip.name, ...(dest.coverUrl ? { thumb: dest.coverUrl } : {}) }];
  });
}

/** Builds the scene from the kind, the destination id and the pins; the key includes the set of pins so the camera re-fits when the set changes. */
function scene(kind: ShellSceneKind, scope: string, markers: readonly MapMarker[], fit: MapFit | null): ShellMapScene {
  return { kind, markers, fit, key: `${kind}|${scope}|${markers.map((m) => m.id).join(',')}` };
}

/** The scene of one destination: pins of the places that have coordinates; until the detail has finished loading there are no pins. */
function destinationScene(input: ShellMapInput): ShellMapScene {
  const markers = input.detail ? placeMarkers(input.detail.places) : [];
  return scene('destination', input.destId, markers, input.view === VIEW.DECK ? { ids: null, options: { maxZoom: 10 } } : destinationFit());
}

/**
 * Chooses the frame map scene by screen. The map is ONE persistent instance in the app frame; a screen only changes the scene (pins + camera), it does not create a new map.
 * Trips: a pin per real trip. The deck, trip detail, today, settings... do not use the frame map (the `hidden` scene; the app frame builds no canvas for those screens).
 */
export function shellMapScene(input: ShellMapInput): ShellMapScene {
  if (!SHELL_MAP.VISIBLE_VIEWS.includes(input.view)) return scene('hidden', '', [], null);
  if (input.view === VIEW.EXPLORE) return scene('overview', '', destinationMarkers(input.summaries), overviewFit());
  if (input.view === VIEW.TRIPS) {
    const markers = tripMarkers(input.trips, input.summaries);
    return markers.length > 0 ? scene('trips', '', markers, overviewFit()) : scene('overview', '', destinationMarkers(input.summaries), overviewFit());
  }
  if (input.view === VIEW.PICKED && input.detail) {
    const chosen = input.detail.places.filter((p) => input.pickedIds.has(p.id));
    if (chosen.length > 0) return scene('picked', input.destId, numberedMarkers(chosen), destinationFit());
  }
  return destinationScene(input);
}
