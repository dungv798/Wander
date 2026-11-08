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

/** Camera đang chờ bản đồ tải xong: vừa khung các ghim (null = tất cả). */
interface FitRequest {
  readonly ids: readonly string[] | null;
  readonly o: FitOptions;
}

/**
 * Bản đồ WebGL của Wander (ADR-015): nền MapLibre GL + OpenFreeMap + bóng núi từ ô độ cao; ghim ảnh, cụm, nhãn là lớp native
 * qua `MapLayers`; tuyến là lớp đường GeoJSON. Các màn dùng cổng React `TerrainMapView`.
 * Tọa độ ghim (`p`) ở đây là [kinh độ, vĩ độ].
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
  /** Thử lại tải bản đồ (nút trong hộp lỗi). */
  private readonly retry = (): void => void this.start();

  /** Dựng bản đồ vào `host` (cần có kích thước); MapLibre và kiểu bản đồ tải bất đồng bộ, ghim/tuyến đặt trước sẽ hiện khi xong. */
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

  /** Giải phóng bản đồ MapLibre, bộ quan sát kích thước và dọn phần tử. */
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

  /** Đặt vùng nhìn thấy thật sự (ví dụ trừ phần tờ dưới che) để vừa khung căn giữa đúng. */
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

  /** Đặt danh sách ghim (hiện khi bản đồ đã tải). */
  setMarkers(list: readonly MapMarker[]): void {
    if (this.dead || sameMarkers(this.raw, list)) return;
    this.raw = list;
    if (this.ready) this.applyMarkers();
  }

  /** Chế độ 'browse' (gộp cụm) hoặc 'route' (đánh số, không gộp). */
  setMode(mode: MapMode): void {
    if (this.dead || mode === this.mode) return;
    this.mode = mode;
    if (this.ready) this.applyMarkers();
  }

  /** Vẽ tuyến nối các ghim theo thứ tự id; nhãn khoảng cách tùy chọn theo từng đoạn. */
  setRoute(ids: readonly string[] | null, labels: readonly string[] = [], detail?: MapRoute): void {
    if (this.dead) return;
    this.route = ids && ids.length > 1 ? { ids, labels, ...detail } : null;
    if (this.ready) this.drawRoute();
  }

  /** Chọn một ghim (vòng sáng); null để bỏ chọn. */
  select(id: string | null): void {
    if (this.dead) return;
    this.selected = id;
    this.layers.select(id);
  }

  /** Điểm kiểm đoạn đang chọn dùng chung với thẻ React; không tạo thêm trạng thái chọn ghim. */
  selectSegment(id: string | null): void { this.host.dataset['selectedSegment'] = id ?? ''; }

  /** Vừa khung mọi ghim; chưa có ghim nào thì cho thấy cả nước. */
  fitAll(animate = true): void {
    this.fitTo(null, { animate });
  }

  /** Vừa khung các ghim theo id (null = tất cả). Chưa tải xong thì nhớ để làm sau. */
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

  /** Tải MapLibre và kiểu bản đồ song song, dựng bản đồ; lỗi thì hiện thông báo kèm nút thử lại. */
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

  /** Dựng MapLibre không xoay; nhãn khoảng cách tuyến là phần HTML duy nhất cần theo camera. */
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
    map.on('idle', () => this.layout()); // ghim chỉ truy vấn được sau khi vẽ xong: moveend có thể đến trước đó và không còn lần tính nào sau
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

  /** Người dùng tự kéo/phóng: ngừng tự vừa khung lại khi đổi cỡ. */
  private markTouched(): void {
    this.touchedByUser = true;
  }

  /** Kiểu bản đồ đã tải: thêm lớp tuyến, hiện ghim đang chờ rồi vừa khung. */
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

  /** Tọa độ [kinh độ, vĩ độ] → điểm trên màn hình trong khung bản đồ. */
  private readonly project = (p: Pt): Pt => {
    const s = this.gl?.project([p[0], p[1]]);
    return s ? [s.x, s.y] : [0, 0];
  };

  /** Chiếu ghim đầu vào (giữ [kinh độ, vĩ độ] làm `p`) rồi đồng bộ phần tử ghim, tuyến và bố cục. */
  private applyMarkers(): void {
    this.markers = this.raw.map((m) => ({ ...m, p: [m.lon, m.lat] as Pt }));
    this.layers.syncMarkers(this.markers, this.mode, this.selected, this.opt.onPin);
    this.drawRoute();
    this.layout();
  }

  /** Cập nhật dữ liệu lớp tuyến và nhãn km theo ghim hiện có (ghim thiếu thì bỏ khỏi tuyến, nhãn giữ đúng đoạn). */
  private drawRoute(): void {
    this.nativeRoute?.update(this.route, this.raw, this.opt.onSegment);
    const { labels, mids } = this.nativeRoute?.labels() ?? { labels: [], mids: [] };
    this.layers.setSegmentLabels(labels, mids);
    this.layers.place(this.project);
  }

  /** Sau khi camera dừng chỉ ghi điểm kiểm; worker và renderer native tự gộp cụm/đặt nhãn. */
  private layout(): void {
    const gl = this.gl;
    if (!this.ready || !gl) return;
    this.host.dataset['center'] = gl.getCenter().toArray().join(',');
    this.host.dataset['zoom'] = gl.getZoom().toFixed(MAP.ZOOM_DIGITS); // điểm kiểm cho e2e: mức zoom hiện tại
    this.layers.snapshot();
    this.nativeRoute?.snapshot();
  }

  /** Mọi điểm đều nằm trong vùng nhìn thấy thật sự (khung trừ phần bị che và lề)? Rỗng trả false. */
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

  /** Lề cho `fitBounds`: phần bị che cộng đệm, kẹp để không vượt quá nửa khung (tránh MapLibre tính ra kích thước âm). */
  private fitPadding(pad: number): PaddingOptions {
    const r = this.host.getBoundingClientRect();
    return fitPadding({ w: r.width, h: r.height }, this.inset, pad, this.opt.creditBand ?? this.opt.credit);
  }

  /** Bay (hoặc nhảy, khi giảm chuyển động) tới khung vừa các điểm. */
  private fitPoints(pts: readonly Pt[], o: FitOptions): void {
    const { ml, gl } = this;
    const first = pts[0];
    if (!ml || !gl || !first) return;
    const bounds: LngLatBounds = new ml.LngLatBounds([first[0], first[1]], [first[0], first[1]]);
    pts.forEach((p) => bounds.extend([p[0], p[1]]));
    const animate = o.animate !== false && !prefersReducedMotion();
    flyToBounds(gl, bounds, this.fitPadding(o.padding ?? MAP.FIT_PADDING), fitMaxZoom(o, pts), animate ? MAP.FLY_MS : 0);
  }

  /** Cho thấy cả nước (khi chưa có ghim nào). */
  private fitCountry(animate: boolean): void {
    const [west, south, east, north] = MAP.VIETNAM_BOUNDS;
    this.gl?.fitBounds([[west, south], [east, north]], { padding: this.fitPadding(0), absolutePadding: true, duration: animate && !prefersReducedMotion() ? MAP.FLY_MS : 0, essential: true });
  }

  /** Đổi cỡ khung: báo MapLibre, đặt lại ghim; chưa ai kéo/phóng thì vừa khung lại theo cỡ mới. */
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
