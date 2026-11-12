import type { Map as MlMap, PointLike } from 'maplibre-gl';
import { COPY, fill } from '../const/copy.vi.ts';
import { addRouteLayers, setRouteLines } from './geoRouteLayer.ts';
import type { SegmentFeature } from './geoRouteLayer.ts';
import { nearestMapObject, routeSegmentFeatures } from './routeSegments.ts';
import { ROUTE } from './route.const.ts';
import { drawProgress, drawRouteFeatures } from './routeDraw.ts';
import { prefersReducedMotion } from './mapUtil.ts';
import type { MapMarker, MapRoute, Pt } from './map.types.ts';

/** The lifecycle of the native route, the access list and the finite effect, independent of the camera. */
export class NativeRoute {
  private readonly host: HTMLElement;
  private map: MlMap | null = null;
  private features: SegmentFeature[] = [];
  private labelTexts: string[] = [];
  private readonly visited = new Set<string>();
  private frame = 0;
  private signature = '';
  private items: HTMLElement[] = [];
  private onSegment?: (id: string) => void;

  /** Only keeps the host; the GL source is created once the map style is ready. */
  constructor(host: HTMLElement) { this.host = host; host.dataset['selectedSegment'] = ''; }

  /** Attaches or restores the source after a style change, without recreating the memory of the tabs already viewed. */
  attach(map: MlMap): void { this.map = map; addRouteLayers(map, this.host); this.signature = ''; }

  /** Replaces the route when the data/tab changes; the effect runs only the first time a new day tab is opened, and is skipped under reduced motion. */
  update(route: MapRoute | null, markers: readonly MapMarker[], onSegment?: (id: string) => void): void {
    const map = this.map;
    if (!map) return;
    this.onSegment = onSegment;
    const features = routeSegmentFeatures(route, markers);
    const signature = JSON.stringify([route, features, markers.map((marker) => marker.label)]);
    if (signature === this.signature) return;
    this.signature = signature;
    cancelAnimationFrame(this.frame);
    this.features = features;
    this.labelTexts = features.map((feature) => route?.labels[route.segments ? route.segments.findIndex((segment) => segment.id === feature.properties.id) : feature.properties.order - 1] ?? '');
    this.host.dataset['route'] = features.length ? '1' : '0';
    this.syncAccessible(markers);
    const key = route?.viewKey;
    const animate = key && features.length && !this.visited.has(key) && !prefersReducedMotion();
    if (key && features.length) this.visited.add(key);
    setRouteLines(map, features);
    if (animate) this.animate(features);
  }

  /** Draws the geometry gradually over a finite duration; the hit source does not change so it can still be tapped at once. */
  private animate(features: SegmentFeature[]): void {
    let start: number | undefined;
    /** Cuts the geometry at the current progress; it keeps no loop after finishing or after the map is cancelled. */
    const tick = (now: number) => {
      start ??= now;
      const progress = drawProgress(now - start, ROUTE.DRAW_MS, prefersReducedMotion());
      if (this.map) setRouteLines(this.map, drawRouteFeatures(features, progress), false);
      if (progress < 1) this.frame = requestAnimationFrame(tick);
    };
    setRouteLines(this.map!, [], false);
    this.frame = requestAnimationFrame(tick);
  }

  /** The label comes from the feature itself so it does not drift when a pin is missing or there are several days. */
  labels(): { labels: string[]; mids: Pt[] } {
    return { labels: this.labelTexts, mids: this.features.map((feature) => feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / ROUTE.HALF)] as unknown as Pt) };
  }

  /** Only reads the native hit line, and then picks the segment nearest the touch center when several lines overlap. */
  hit(point: { x: number; y: number }): boolean {
    const map = this.map;
    if (!map?.getLayer(ROUTE.HIT_LAYER) || !this.onSegment) return false;
    const hits = map.queryRenderedFeatures(point as PointLike, { layers: [ROUTE.HIT_LAYER] });
    const ids = new Set(hits.map((hit) => String(hit.properties['id'])));
    const candidates = this.features.filter((feature) => ids.has(feature.properties.id)).map((feature) => ({ id: feature.properties.id, kind: 'segment' as const, line: feature.geometry.coordinates.map((p): Pt => { const at = map.project(p as [number, number]); return [at.x, at.y]; }) }));
    const id = nearestMapObject(candidates, [point.x, point.y]);
    if (id) this.onSegment(id);
    return id !== null;
  }

  /** Updates the read-only checkpoint so e2e taps the real coordinates; it does not expose a gate that selects an object by id. */
  snapshot(): void {
    const map = this.map;
    if (!map) return;
    this.host.dataset['segments'] = JSON.stringify(this.features.map((feature) => ({ ...feature.properties, points: feature.geometry.coordinates.map((p) => { const at = map.project(p as [number, number]); return { x: at.x, y: at.y }; }) })));
  }

  /** The segment button follows the pin button in the existing list; the name includes the order, the two endpoints and the km. */
  private syncAccessible(markers: readonly MapMarker[]): void {
    this.items.forEach((item) => item.remove());
    this.items = [];
    const list = this.host.querySelector('.tm-accessible');
    if (!list || !this.onSegment) return;
    this.features.forEach(({ properties: segment }) => {
      const button = Object.assign(document.createElement('button'), { type: 'button', textContent: fill(COPY.map.segmentButton, { n: segment.order, from: markers.find((marker) => marker.id === segment.from)?.label ?? segment.from, to: markers.find((marker) => marker.id === segment.to)?.label ?? segment.to, km: Math.max(1, Math.round(segment.km)) }) });
      button.dataset['segment'] = segment.id;
      button.addEventListener('click', () => this.onSegment?.(segment.id));
      const item = document.createElement('li');
      item.appendChild(button); list.appendChild(item); this.items.push(item);
    });
  }

  /** Cancels the frame before WebGL is released so a source that is gone is not written. */
  destroy(): void { cancelAnimationFrame(this.frame); this.map = null; }
}
