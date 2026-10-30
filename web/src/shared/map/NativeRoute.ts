import type { Map as MlMap, PointLike } from 'maplibre-gl';
import { COPY, fill } from '../const/copy.vi.ts';
import { addRouteLayers, setRouteLines } from './geoRouteLayer.ts';
import type { SegmentFeature } from './geoRouteLayer.ts';
import { nearestMapObject, routeSegmentFeatures } from './routeSegments.ts';
import { ROUTE } from './route.const.ts';
import { prefersReducedMotion } from './mapUtil.ts';
import type { MapMarker, MapRoute, Pt } from './map.types.ts';

/** Vòng đời tuyến native, danh sách truy cập và hiệu ứng hữu hạn, độc lập với camera. */
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

  /** Chỉ giữ host; nguồn GL được tạo khi kiểu bản đồ đã sẵn sàng. */
  constructor(host: HTMLElement) { this.host = host; host.dataset['selectedSegment'] = ''; }

  /** Gắn hoặc khôi phục nguồn sau khi đổi style, không tạo lại bộ nhớ tab đã xem. */
  attach(map: MlMap): void { this.map = map; addRouteLayers(map, this.host); this.signature = ''; }

  /** Thay tuyến khi dữ liệu/tab đổi; lần đầu mở tab ngày mới chạy hiệu ứng, giảm chuyển động thì bỏ qua. */
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

  /** Vẽ dần hình học trong thời lượng hữu hạn; hit source không đổi nên vẫn chạm được ngay. */
  private animate(features: SegmentFeature[]): void {
    const start = performance.now();
    /** Cắt hình học ở tiến độ hiện tại; không giữ vòng lặp sau khi hoàn tất hoặc hủy bản đồ. */
    const tick = (now: number) => {
      const progress = prefersReducedMotion() ? 1 : Math.min(1, (now - start) / ROUTE.DRAW_MS);
      const visible = features.map((feature) => {
        const coordinates = feature.geometry.coordinates;
        const index = progress * (coordinates.length - 1);
        const whole = Math.floor(index);
        const a = coordinates[whole]!, b = coordinates[Math.min(whole + 1, coordinates.length - 1)]!;
        return { ...feature, geometry: { ...feature.geometry, coordinates: [...coordinates.slice(0, whole + 1), [a[0]! + (b[0]! - a[0]!) * (index - whole), a[1]! + (b[1]! - a[1]!) * (index - whole)]] } };
      });
      if (this.map) setRouteLines(this.map, progress === 1 ? features : visible, false);
      if (progress < 1) this.frame = requestAnimationFrame(tick);
    };
    tick(start);
  }

  /** Nhãn lấy từ chính feature nên không bị lệch khi thiếu ghim hoặc có nhiều ngày. */
  labels(): { labels: string[]; mids: Pt[] } {
    return { labels: this.labelTexts, mids: this.features.map((feature) => feature.geometry.coordinates[Math.floor(feature.geometry.coordinates.length / ROUTE.HALF)] as unknown as Pt) };
  }

  /** Chỉ đọc hit line native, rồi chọn đoạn gần tâm chạm nhất khi nhiều đường chồng nhau. */
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

  /** Cập nhật điểm kiểm chỉ đọc để e2e chạm tọa độ thật; không lộ cổng chọn đối tượng bằng mã. */
  snapshot(): void {
    const map = this.map;
    if (!map) return;
    this.host.dataset['segments'] = JSON.stringify(this.features.map((feature) => ({ ...feature.properties, points: feature.geometry.coordinates.map((p) => { const at = map.project(p as [number, number]); return { x: at.x, y: at.y }; }) })));
  }

  /** Nút đoạn nối tiếp nút ghim trong danh sách đã có; tên gồm thứ tự, hai đầu mút và km. */
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

  /** Hủy frame trước khi WebGL bị giải phóng để không ghi nguồn đã mất. */
  destroy(): void { cancelAnimationFrame(this.frame); this.map = null; }
}
