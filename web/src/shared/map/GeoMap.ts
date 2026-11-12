import type { LngLatBounds, Map as MlMap, PaddingOptions } from 'maplibre-gl';
import { COPY } from '../const/copy.vi.ts';
import { MapLayers } from './MapLayers.ts';
import { showBasemapError } from './geoMapErrors.ts';
import { fitMaxZoom, fitPadding, needsInsetRefit } from './geoMapPolicy.ts';
import { flyToBounds } from './flyToBounds.ts';
import type { NativeRoute } from './NativeRoute.ts';
import { loadMapLibre } from './maplibreLoader.ts';
import type { MapLibre } from './maplibreLoader.ts';
import { loadMapStyle } from './mapStyle.ts';
import { MAP } from './map.const.ts';
import { prefersReducedMotion, sameMarkers, webglAvailable } from './mapUtil.ts';
import { clearMapStatus, showMapLoading, showMapUnavailable } from './mapStatus.ts';
import type { FitOptions, Insets, MapMarker, MapMode, MapRoute, ProjectedMarker, Pt, GeoMapOptions } from './map.types.ts';

const NO_INSET: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** The camera waiting for the map to finish loading: fit the pins (null = all). */
interface FitRequest {
  readonly ids: readonly string[] | null;
  readonly o: FitOptions;
}

/**
 * Wander's WebGL map (ADR-015): a MapLibre GL base + OpenFreeMap + a terrain shadow from elevation tiles; photo pins, clusters, labels are native layers
 * through `MapLayers`; the route is a GeoJSON line layer. Screens use the React gate `TerrainMapView`.
 * The pin coordinates (`p`) here are [longitude, latitude].
 */
export class GeoMap {
  private readonly host: HTMLElement;
  private readonly opt: Required<Pick<GeoMapOptions, 'interactive' | 'towns' | 'credit'>> & GeoMapOptions;
  private readonly mapEl: HTMLElement;
  private readonly layers: MapLayers;
  private nativeRoute: NativeRoute | null = null;
  private readonly observer: ResizeObserver;
  private ml: MapLibre | null = null;
  private gl: MlMap | null = null;
  private ready = false;
  private dead = false;
  private raw: readonly MapMarker[] = [];
  private markers: ProjectedMarker[] = [];
  private route: MapRoute | null = null;
  private mode: MapMode = 'browse';
  private selected: string | null = null;
  private inset: Insets = NO_INSET;
  private touchedByUser = false;
  private lastFit: FitRequest | null = null;
  private pendingFit: FitRequest | null = null;
  private loadTimer: number | undefined;
  /** Retries loading the map (the button in the error box). */
  private readonly retry = (): void => void this.start();

  /** Builds the map into `host` (it needs a size); MapLibre and the map style load asynchronously, pins/route set earlier show when done. */
  constructor(host: HTMLElement, opt: GeoMapOptions) {
    this.host = host;
    this.opt = { interactive: true, towns: true, credit: true, ...opt };
    host.classList.add('tmroot');
    host.dataset['ready'] = '0';
    host.dataset['route'] = '0';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', opt.label);
    if (!this.opt.interactive) host.classList.add('tm-static');
    if (this.opt.cooperativeGestures) host.classList.add('tm-cooperative');
    this.mapEl = Object.assign(document.createElement('div'), { className: 'tm-gl' });
    host.replaceChildren(this.mapEl);
    this.layers = new MapLayers(host);
    this.observer = new ResizeObserver(() => this.onResize());
    this.observer.observe(host);
    void this.start();
  }

  /** Releases the MapLibre map, the size observer and cleans up the elements. */
  destroy(): void {
    this.dead = true;
    window.clearTimeout(this.loadTimer);
    this.observer.disconnect();
    this.layers.destroy();
    this.nativeRoute?.destroy();
    this.gl?.remove();
    this.gl = null;
    this.host.classList.remove('tmroot', 'tm-static', 'tm-cooperative');
    this.host.replaceChildren();
  }

  /** Sets the really visible area (for example minus the part covered by the bottom sheet) so fitting to the frame centers correctly. */
  setInsets(inset: Partial<Insets>): void {
    if (this.dead) return;
    const before = this.inset;
    this.inset = { ...NO_INSET, ...inset };
    for (const edge of ['top', 'right', 'bottom', 'left'] as const) { this.host.style.setProperty(`--map-content-${edge}`, `${this.inset[edge]}px`); }
    const fit = this.lastFit;
    if (!this.ready || !fit) return;
    const pts = this.markers.filter((m) => !fit.ids || fit.ids.includes(m.id)).map((m) => m.p);
    if (needsInsetRefit(before, this.inset, this.touchedByUser, this.allInView(pts))) this.fitTo(fit.ids, { ...fit.o, animate: false, keepIfVisible: false });
  }

  /** Sets the list of pins (shown once the map has loaded). */
  setMarkers(list: readonly MapMarker[]): void {
    if (this.dead || sameMarkers(this.raw, list)) return;
    this.raw = list;
    if (this.ready) this.applyMarkers();
  }

  /** The mode 'browse' (cluster) or 'route' (numbered, no clustering). */
  setMode(mode: MapMode): void {
    if (this.dead || mode === this.mode) return;
    this.mode = mode;
    if (this.ready) this.applyMarkers();
  }

  /** Draws a route connecting the pins in id order; an optional distance label per segment. */
  setRoute(ids: readonly string[] | null, labels: readonly string[] = [], detail?: MapRoute): void {
    if (this.dead) return;
    this.route = ids && ids.length > 1 ? { ids, labels, ...detail } : null;
    if (this.ready) this.drawRoute();
  }

  /** Selects a pin (a glowing ring); null to deselect. */
  select(id: string | null): void {
    if (this.dead) return;
    this.selected = id;
    this.layers.select(id);
  }

  /** The checkpoint of the selected segment shared with the React card; it adds no extra pin-selection state. */
  selectSegment(id: string | null): void { this.host.dataset['selectedSegment'] = id ?? ''; }

  /** Fits every pin; with no pin yet it shows the whole country. */
  fitAll(animate = true): void {
    this.fitTo(null, { animate });
  }

  /** Fits the pins by id (null = all). If loading has not finished it is remembered to do later. */
  fitTo(ids: readonly string[] | null, o: FitOptions = {}): void {
    if (this.dead) return;
    this.lastFit = { ids, o };
    if (!this.ready) {
      this.pendingFit = this.lastFit;
      return;
    }
    const pts = [...this.markers.filter((m) => !ids || ids.includes(m.id)).map((m) => m.p), ...(o.contextPoints ?? [])];
    if (o.keepIfVisible && this.touchedByUser && this.allInView(pts)) return;
    if (pts.length) this.fitPoints(pts, o);
    else this.fitCountry(o.animate !== false);
  }

  /** Loads MapLibre and the map style in parallel, builds the map; on an error it shows a notice with a retry button. */
  private async start(): Promise<void> {
    showMapLoading(this.host);
    if (!webglAvailable()) return showMapUnavailable(this.host, COPY.map.noWebgl, this.raw, this.retry);
    window.clearTimeout(this.loadTimer);
    this.loadTimer = window.setTimeout(() => { if (!this.ready && !this.dead) showMapUnavailable(this.host, COPY.map.unavailable, this.raw, this.retry); }, MAP.LOAD_TIMEOUT_MS);
    try {
      const [ml, style, route] = await Promise.all([loadMapLibre(), loadMapStyle(this.host), import('./NativeRoute.ts')]);
      if (this.dead) return;
      this.nativeRoute ??= new route.NativeRoute(this.host);
      this.ml = ml;
      this.gl = this.createMap(ml, style);
    } catch {
      if (!this.dead) showMapUnavailable(this.host, COPY.map.loadError, this.raw, this.retry);
    }
  }

  /** Builds MapLibre without rotation; the route distance label is the only HTML that needs to follow the camera. */
  private createMap(ml: MapLibre, style: Awaited<ReturnType<typeof loadMapStyle>>): MlMap {
    const map = new ml.Map({
      container: this.mapEl,
      style,
      bounds: MAP.VIETNAM_BOUNDS as unknown as [number, number, number, number],
      interactive: this.opt.interactive,
      cooperativeGestures: this.opt.cooperativeGestures ?? false,
      attributionControl: this.opt.credit ? { compact: true } : false,
      dragRotate: false,
      pitchWithRotate: false,
      minZoom: MAP.GL_MIN_ZOOM,
      maxZoom: MAP.GL_MAX_ZOOM,
      renderWorldCopies: false,
      locale: { ...MAP.GESTURE_LOCALE, 'NavigationControl.ZoomIn': COPY.map.zoomIn, 'NavigationControl.ZoomOut': COPY.map.zoomOut, 'AttributionControl.ToggleAttribution': COPY.map.attribution },
    });
    if (this.opt.interactive) {
      map.touchZoomRotate.disableRotation();
      map.addControl(new ml.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
    }
    map.on('move', () => this.layers.place(this.project));
    map.on('moveend', () => this.layout());
    map.on('idle', () => this.layout()); // pins can be queried only after drawing finishes: moveend may arrive before that and no later computation follows
    map.on('dragstart', () => this.markTouched());
    map.on('zoomstart', (e) => {
      if ((e as { originalEvent?: Event }).originalEvent) this.markTouched();
    });
    map.on('load', () => this.onLoad(map));
    map.on('error', (event) => {
      if (!this.dead) showBasemapError(map, this.host, event);
    });
    map.on('style.load', () => {
      if (this.ready && !this.dead) {
        this.nativeRoute?.attach(map);
        this.layers.restore();
        this.applyMarkers();
      }
    });
    return map;
  }

  /** The user drags/zooms by themself: stops re-fitting automatically when the size changes. */
  private markTouched(): void {
    this.touchedByUser = true;
  }

  /** The map style has loaded: adds the route layer, shows the pins that were waiting and then fits the frame. */
  private onLoad(map: MlMap): void {
    if (this.dead) return;
    this.nativeRoute?.attach(map);
    this.layers.attach(map, () => { this.markTouched(); this.opt.onMapDismiss?.(); }, (point) => {
      if (!this.nativeRoute?.hit(point)) this.opt.onMapDismiss?.();
    });
    this.ready = true;
    window.clearTimeout(this.loadTimer);
    clearMapStatus(this.host);
    this.host.dataset['ready'] = '1';
    this.applyMarkers();
    const f = this.pendingFit;
    this.pendingFit = null;
    this.fitTo(f?.ids ?? null, f?.o ?? { animate: false });
  }

  /** Coordinates [longitude, latitude] -> a point on the screen within the map frame. */
  private readonly project = (p: Pt): Pt => {
    const s = this.gl?.project([p[0], p[1]]);
    return s ? [s.x, s.y] : [0, 0];
  };

  /** Projects the input pins (keeping [longitude, latitude] as `p`) and then syncs the pin elements, the route and the layout. */
  private applyMarkers(): void {
    this.markers = this.raw.map((m) => ({ ...m, p: [m.lon, m.lat] as Pt }));
    this.layers.syncMarkers(this.markers, this.mode, this.selected, this.opt.onPin);
    this.drawRoute();
    this.layout();
  }

  /** Updates the route layer data and the km labels by the pins present (a missing pin is dropped from the route, labels keep the right segment). */
  private drawRoute(): void {
    this.nativeRoute?.update(this.route, this.raw, this.opt.onSegment);
    const { labels, mids } = this.nativeRoute?.labels() ?? { labels: [], mids: [] };
    this.layers.setSegmentLabels(labels, mids);
    this.layers.place(this.project);
  }

  /** After the camera stops it only records the checkpoint; the worker and the native renderer cluster/place labels by themselves. */
  private layout(): void {
    const gl = this.gl;
    if (!this.ready || !gl) return;
    this.host.dataset['center'] = gl.getCenter().toArray().join(',');
    this.host.dataset['zoom'] = gl.getZoom().toFixed(MAP.ZOOM_DIGITS); // a checkpoint for e2e: the current zoom level
    this.layers.snapshot();
    this.nativeRoute?.snapshot();
  }

  /** Are all the points within the really visible area (the frame minus the covered part and the margin)? Empty returns false. */
  private allInView(pts: readonly Pt[]): boolean {
    const r = this.host.getBoundingClientRect();
    const m = MAP.KEEP_VISIBLE_MARGIN;
    const { left, right, top, bottom } = this.inset;
    return (
      pts.length > 0 &&
      pts.every((p) => {
        const [x, y] = this.project(p);
        return x >= left + m && x <= r.width - right - m && y >= top + m && y <= r.height - bottom - m;
      })
    );
  }

  /** The margins for `fitBounds`: the covered part plus padding, clamped so it does not exceed half the frame (avoiding MapLibre computing a negative size). */
  private fitPadding(pad: number): PaddingOptions {
    const r = this.host.getBoundingClientRect();
    return fitPadding({ w: r.width, h: r.height }, this.inset, pad, this.opt.creditBand ?? this.opt.credit);
  }

  /** Flies (or jumps, under reduced motion) to a frame that fits the points. */
  private fitPoints(pts: readonly Pt[], o: FitOptions): void {
    const { ml, gl } = this;
    const first = pts[0];
    if (!ml || !gl || !first) return;
    const bounds: LngLatBounds = new ml.LngLatBounds([first[0], first[1]], [first[0], first[1]]);
    pts.forEach((p) => bounds.extend([p[0], p[1]]));
    const animate = o.animate !== false && !prefersReducedMotion();
    flyToBounds(gl, bounds, this.fitPadding(o.padding ?? MAP.FIT_PADDING), fitMaxZoom(o, pts), animate ? MAP.FLY_MS : 0);
  }

  /** Shows the whole country (when there is no pin yet). */
  private fitCountry(animate: boolean): void {
    const [west, south, east, north] = MAP.VIETNAM_BOUNDS;
    this.gl?.fitBounds([[west, south], [east, north]], { padding: this.fitPadding(0), absolutePadding: true, duration: animate && !prefersReducedMotion() ? MAP.FLY_MS : 0, essential: true });
  }

  /** A frame size change: tells MapLibre, resets the pins; if nobody has dragged/zoomed it re-fits by the new size. */
  private onResize(): void {
    if (!this.ready || !this.gl) return;
    this.gl.resize();
    if (!this.touchedByUser && this.lastFit) this.fitTo(this.lastFit.ids, { ...this.lastFit.o, animate: false });
    else {
      this.layers.place(this.project);
      this.layout();
    }
  }
}
