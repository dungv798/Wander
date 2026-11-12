/** The data types of the MapLibre map and the shared React gate. */

/** A point: [x, y] (longitude/latitude or a screen pixel point depending on context). */
export type Pt = readonly [number, number];

/** An input pin: geographic coordinates + display. `kind: 'hub'` is a landmark (not clustered). */
export interface MapMarker {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
  readonly label?: string;
  readonly num?: number;
  readonly thumb?: string;
  readonly muted?: boolean;
  readonly kind?: 'hub' | 'sticker';
}

/** A pin with coordinates [longitude, latitude] for MapLibre to project onto the screen. */
export interface ProjectedMarker extends MapMarker {
  readonly p: Pt;
}

/** The size of the display frame. */
export interface Size {
  readonly w: number;
  readonly h: number;
}

/** The part of the frame that is covered (for example a draggable sheet below) so the camera centers the really visible area. */
export interface Insets {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** The pin display mode: browse (clustered) or route (numbered, not clustered). */
export type MapMode = 'browse' | 'route';

/** Route: the pin ids in order and the label of each segment (the label of segment i is at labels[i-1]... by the destination pin's position). */
export interface MapRoute {
  readonly ids: readonly string[];
  readonly labels: readonly string[];
  readonly segments?: readonly RouteSegment[];
  /** The day tab key; each key runs the drawing effect only once in the map's lifetime. */
  readonly viewKey?: string;
}

/** The estimated segment connects exactly two pins, it does not represent a real route. */
export interface RouteSegment {
  readonly id: string;
  readonly order: number;
  readonly from: string;
  readonly to: string;
  readonly day: number;
  readonly km: number;
}

/** Fit-to-frame options. */
export interface FitOptions {
  /** Additional geographic points that need to be seen in the nationwide scene, without making them interactive pins. */
  readonly contextPoints?: readonly Pt[];
  readonly padding?: number;
  readonly animate?: boolean;
  /** The MapLibre zoom ceiling for this fit (a cluster is zoomed in closer than an ordinary pin). */
  readonly maxZoom?: number;
  /** Keeps the `TerrainMapView` API compatible; MapLibre uses maxZoom in place of the old camera factor. */
  readonly maxZoomFactor?: number;
  /** If the user has dragged/zoomed by themself and every point to fit is already in view, the camera is kept as it is (changing the day tab does not reset the place just zoomed). */
  readonly keepIfVisible?: boolean;
}

/** The map initialization options. */
export interface GeoMapOptions {
  readonly dest: string;
  readonly interactive?: boolean;
  /** One finger scrolls the page, two fingers drag/zoom the embedded map. */
  readonly cooperativeGestures?: boolean;
  readonly towns?: boolean;
  readonly credit?: boolean;
  /** Leaves the attribution strip at the bottom when fitting (default by `credit`); off when the attribution is placed elsewhere. */
  readonly creditBand?: boolean;
  readonly label: string;
  readonly onPin?: (id: string) => void;
  readonly onSegment?: (id: string) => void;
  readonly onMapDismiss?: () => void;
}
