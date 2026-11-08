import type { GeoJSONSource, Map as MlMap } from 'maplibre-gl';
import { COPY } from '../const/copy.vi.ts';
import { HALF } from '../const/math.const.ts';
import { MAP } from './map.const.ts';
import { loadThumbnailImage } from './loadThumbnailImage.ts';
import { entranceCount } from './pinEntrance.ts';
import { PIN_ENTRANCE } from './pinEntrance.const.ts';
import { markerAccessibleName, markerFeatures, markerSnapshot, markerThumbnail, renderedImageCount, thumbnailCrop } from './nativeMarkers.ts';
import { addNativePinLayers, pinHitLayers } from './nativePinLayers.ts';
import { nearestMapObject } from './routeSegments.ts';
import { prefersReducedMotion } from './mapUtil.ts';
import type { MapMarker, MapMode, Pt } from './map.types.ts';

/** Biến đổi tọa độ bản đồ sang màn hình, chỉ dùng cho nhãn khoảng cách tuyến. */
export type Project = (p: Pt) => Pt;

/** Ghim/cụm/nhãn native; HTML chỉ còn danh sách truy cập và nhãn khoảng cách tuyến. */
export class MapLayers {
  private readonly host: HTMLElement;
  private readonly labels: HTMLElement;
  private readonly accessible: HTMLElement;
  private readonly buttons = new Map<string, HTMLButtonElement>();
  private readonly loading = new Set<string>();
  private readonly images = new Map<string, ImageData>();
  private map: MlMap | null = null;
  private selected: string | null = null;
  private dead = false;
  private revision = 0;
  private entranceFrame = 0;
  private replayEntrance?: () => void;
  private onPin?: (id: string) => void;
  private onCluster?: () => void;
  private markerOrder: readonly string[] = [];
  private segMids: { el: HTMLElement; p: Pt }[] = [];

  /** Giữ danh sách nút thay thế canvas trong vùng bản đồ; hiện khi bàn phím đi vào. */
  constructor(host: HTMLElement) {
    this.host = host;
    this.labels = Object.assign(document.createElement('div'), { className: 'tm-labels' });
    this.labels.setAttribute('aria-hidden', 'true');
    this.accessible = Object.assign(document.createElement('ul'), { className: 'tm-accessible' });
    this.accessible.setAttribute('aria-label', COPY.map.pinList);
    host.append(this.labels, this.accessible);
    this.accessible.addEventListener('keydown', (event) => {
      const key = event.key;
      if (key !== 'ArrowUp' && key !== 'ArrowDown') return;
      const id = (event.target as HTMLElement).dataset['id'];
      if (!id) return;
      event.preventDefault();
      const index = this.markerOrder.indexOf(id) + (key === 'ArrowDown' ? 1 : -1);
      const button = this.buttons.get(this.markerOrder[Math.max(0, Math.min(index, this.markerOrder.length - 1))]!);
      button?.focus(); button?.click();
    });
    Object.assign(host.dataset, { pins: '0', clusters: '0', selected: '', features: '[]', thumbnails: '0', numbered: '0', renderedImages: '0', moving: '1' });
  }

  /** Gắn lớp khi nền tải xong; query native ưu tiên ghim trước cụm trên cùng điểm chạm. */
  attach(map: MlMap, onCluster?: () => void, onEmpty?: (point: { x: number; y: number }) => void): void {
    this.map = map;
    this.onCluster = onCluster;
    addNativePinLayers(map, this.host);
    map.on('click', (event) => {
      if (!pinHitLayers().every((layer) => map.getLayer(layer))) return;
      const features = map.queryRenderedFeatures(event.point, { layers: pinHitLayers() });
      const candidates = features.filter((feature) => !feature.properties['cluster'] && feature.geometry.type === 'Point').map((feature) => {
        const at = map.project(feature.geometry.type === 'Point' ? feature.geometry.coordinates as [number, number] : [0, 0]);
        return { id: String(feature.properties['id']), kind: 'pin' as const, line: [[at.x, at.y] as Pt] };
      });
      const nearest = nearestMapObject(candidates, [event.point.x, event.point.y]);
      const pin = features.find((feature) => !feature.properties['cluster'] && String(feature.properties['id']) === nearest);
      if (pin) this.onPin?.(String(pin.properties['id']));
      else {
        const cluster = features[0];
        if (!cluster) onEmpty?.(event.point);
        if (cluster?.geometry.type === 'Point') void this.expandCluster(Number(cluster.properties['cluster_id']), cluster.geometry.coordinates as [number, number]);
      }
    });
    map.on('movestart', () => { this.host.dataset['moving'] = '1'; });
    map.on('idle', () => { this.host.dataset['moving'] = '0'; this.snapshot(); });
  }

  /** Hủy kết quả tải ảnh đến muộn trước khi GeoMap giải phóng WebGL. */
  destroy(): void {
    this.dead = true;
    if (this.entranceFrame) cancelAnimationFrame(this.entranceFrame);
    if (this.replayEntrance) this.host.removeEventListener(PIN_ENTRANCE.event, this.replayEntrance);
    this.map = null;
    this.images.clear();
  }

  /** Nút thử lại nền nạp lại style nên phải đăng ký lại sprite đã tải, giữ nguyên camera. */
  restore(): void {
    const map = this.map;
    if (!map || this.dead) return;
    if (!map.getSource(MAP.PIN_SOURCES[0])) addNativePinLayers(map, this.host);
    if (!map.hasImage(MAP.EMPTY_IMAGE)) map.addImage(MAP.EMPTY_IMAGE, { width: 1, height: 1, data: new Uint8Array(MAP.IMAGE_CHANNELS) });
    this.images.forEach((image, url) => {
      if (!map.hasImage(url)) map.addImage(url, image, { pixelRatio: MAP.THUMB_PX / MAP.PIN_PX });
    });
  }

  /** Chỉ cập nhật nguồn khi dữ liệu/chế độ đổi; không setData theo sự kiện camera. */
  syncMarkers(markers: readonly MapMarker[], mode: MapMode, selected: string | null, onPin?: (id: string) => void): void {
    const map = this.map;
    if (!map) return;
    this.revision++;
    this.onPin = onPin;
    if (this.entranceFrame) cancelAnimationFrame(this.entranceFrame);
    if (this.replayEntrance) this.host.removeEventListener(PIN_ENTRANCE.event, this.replayEntrance);
    this.replayEntrance = () => this.enterMarkers(markers, mode);
    if (new URLSearchParams(typeof location === 'undefined' ? '' : location.search).get(PIN_ENTRANCE.parameter) === PIN_ENTRANCE.value) {
      this.host.addEventListener(PIN_ENTRANCE.event, this.replayEntrance);
    }
    this.writeMarkers(markers, mode);
    this.syncAccessible(markers);
    this.host.dataset['numbered'] = String(markers.filter((marker) => marker.num != null).length);
    markers.forEach((marker) => void this.loadThumbnail(markerThumbnail(marker)));
    this.select(selected);
  }

  /** Cập nhật nguồn native, không dùng DOM marker và không đổi điểm kiểm e2e. */
  private writeMarkers(markers: readonly MapMarker[], mode: MapMode): void {
    MAP.PIN_SOURCES.forEach((source, index) => (this.map?.getSource(source) as GeoJSONSource | undefined)?.setData(markerFeatures(markers, mode, index === 0)));
  }

  /** Thêm feature theo nhịp khi script yêu cầu; hủy khi dữ liệu đổi hoặc destroy. */
  private enterMarkers(markers: readonly MapMarker[], mode: MapMode): void {
    cancelAnimationFrame(this.entranceFrame);
    if (prefersReducedMotion()) { this.writeMarkers(markers, mode); return; }
    let start: number | undefined;
    let previous = -1;
    /** Chỉ ghi GeoJSON khi số ghim đổi, dừng hẳn sau ghim cuối. */
    const tick = (now: number) => {
      if (this.dead) return;
      start ??= now;
      const count = entranceCount(markers.length, now - start, true, prefersReducedMotion());
      if (count !== previous) {
        this.writeMarkers(markers.slice(0, count), mode);
        this.host.dataset['entranceCount'] = String(count);
      }
      previous = count;
      if (count < markers.length) this.entranceFrame = requestAnimationFrame(tick);
    };
    this.writeMarkers([], mode);
    this.host.dataset['entranceCount'] = '0';
    this.entranceFrame = requestAnimationFrame(tick);
  }

  /** Nút giữ cùng phần tử khi đổi số/nhãn, tránh mất focus sau cập nhật dữ liệu. */
  private syncAccessible(markers: readonly MapMarker[]): void {
    this.markerOrder = markers.map((marker) => marker.id);
    const keep = new Set(this.markerOrder);
    this.buttons.forEach((button, id) => {
      if (!keep.has(id)) { button.parentElement?.remove(); this.buttons.delete(id); }
    });
    markers.forEach((marker, index) => {
      let button = this.buttons.get(marker.id);
      if (!button) {
        button = Object.assign(document.createElement('button'), { type: 'button' });
        button.dataset['id'] = marker.id;
        button.addEventListener('click', () => this.onPin?.(marker.id));
        const item = document.createElement('li');
        item.appendChild(button);
        this.accessible.appendChild(item);
        this.buttons.set(marker.id, button);
      }
      const focused = document.activeElement === button;
      const item = button.parentElement!;
      if (this.accessible.children[index] !== item) this.accessible.insertBefore(item, this.accessible.children[index] ?? null);
      if (focused) button.focus({ preventScroll: true });
      button.textContent = markerAccessibleName(marker);
      button.disabled = !this.onPin;
    });
    this.accessible.hidden = !this.onPin;
  }

  /** Vòng chọn dùng feature-state; nhãn ghim mờ chỉ hiện khi được chọn. */
  select(id: string | null): void {
    const map = this.map;
    MAP.PIN_SOURCES.forEach((source, index) => {
      if (!map?.getSource(source)) return;
      if (this.selected !== null) map.setFeatureState({ source, id: this.selected }, { selected: false });
      if (id !== null) map.setFeatureState({ source, id }, { selected: true });
      map.setFilter(`${MAP.PIN_LAYER_PREFIX}${index}-label`, ['all', ['!', ['has', 'point_count']], ['any', ['!', ['get', 'muted']], ['==', ['get', 'id'], id ?? '']]]);
    });
    this.selected = id;
    this.host.dataset['selected'] = id ?? '';
    this.buttons.forEach((button, key) => button.setAttribute('aria-pressed', String(key === id)));
  }

  /** Cụm dùng độ phóng tách của nguồn native; lỗi/cụm cũ khi dữ liệu đổi thì bỏ qua. */
  private async expandCluster(id: number, center: [number, number]): Promise<void> {
    const map = this.map;
    const revision = this.revision;
    const source = map?.getSource(MAP.PIN_SOURCES[0]) as GeoJSONSource | undefined;
    if (!map || !source) return;
    try {
      const zoom = await source.getClusterExpansionZoom(id);
      if (this.dead || this.map !== map || revision !== this.revision) return;
      this.onCluster?.();
      map.easeTo({ center, zoom: Math.min(MAP.GL_MAX_ZOOM, zoom), duration: prefersReducedMotion() ? 0 : MAP.FLY_MS });
    } catch { /* Cụm có thể đã biến mất khi danh sách đổi trong lúc đợi worker. */ }
  }

  /** Cắt ảnh catalog vào bitmap tròn 96×96, hiển thị 44 px độc lập zoom; lỗi giữ vòng ghim. */
  private async loadThumbnail(url: string): Promise<void> {
    const map = this.map;
    if (!map || !url || this.images.has(url) || this.loading.has(url)) return;
    this.loading.add(url);
    try {
      const data = await loadThumbnailImage(map, url);
      if (this.dead || this.map !== map) return;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = MAP.THUMB_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.arc(MAP.THUMB_PX / HALF, MAP.THUMB_PX / HALF, MAP.THUMB_PX / HALF, 0, MAP.CIRCLE_RADIANS);
      ctx.clip();
      ctx.drawImage(data, ...thumbnailCrop(data.width, data.height));
      const image = ctx.getImageData(0, 0, MAP.THUMB_PX, MAP.THUMB_PX);
      map.addImage(url, image, { pixelRatio: MAP.THUMB_PX / MAP.PIN_PX });
      this.images.set(url, image);
      this.host.dataset['thumbnails'] = String(this.images.size);
    } catch { /* Ảnh lỗi không ngăn chọn ghim hoặc sử dụng bản đồ. */ }
    finally { this.loading.delete(url); }
  }

  /** Đồng bộ điểm kiểm chỉ khi camera dừng/nguồn vẽ xong, không đọc hoặc ghi DOM cho từng ghim trên move. */
  snapshot(): void {
    const map = this.map;
    if (!map || this.dead || !pinHitLayers().every((layer) => map.getLayer(layer))) return;
    Object.assign(this.host.dataset, markerSnapshot(map.queryRenderedFeatures({ layers: pinHitLayers() }), (coordinates) => map.project(coordinates), this.selected));
    const photos = MAP.PIN_SOURCES.map((_, index) => `${MAP.PIN_LAYER_PREFIX}${index}-photo`);
    this.host.dataset['renderedImages'] = String(renderedImageCount(map.queryRenderedFeatures({ layers: photos }), (id) => map.hasImage(id)));
  }

  /** Giữ nguyên nhãn khoảng cách tuyến; bước native tuyến được giao riêng. */
  setSegmentLabels(labels: readonly string[], mids: readonly Pt[]): void {
    this.labels.replaceChildren();
    this.segMids = [];
    mids.forEach((p, index) => {
      const text = labels[index];
      if (!text) return;
      const el = Object.assign(document.createElement('span'), { className: 'tm-seg-label', textContent: text });
      this.labels.appendChild(el);
      this.segMids.push({ el, p });
    });
  }

  /** Chỉ nhãn khoảng cách tuyến còn cần chiếu HTML theo camera, không chạm ghim/cụm/nhãn tên. */
  place(project: Project): void {
    this.segMids.forEach(({ el, p }) => {
      const at = project(p);
      el.style.transform = `translate3d(${at[0].toFixed(MAP.COORD_DIGITS)}px, ${at[1].toFixed(MAP.COORD_DIGITS)}px, 0)`;
    });
  }
}
