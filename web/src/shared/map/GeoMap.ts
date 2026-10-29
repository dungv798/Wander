import type { LngLatBounds, Map as MlMap, PaddingOptions } from 'maplibre-gl';
import { COPY } from '../const/copy.vi.ts';
import { HALF } from '../const/math.const.ts';
import { MapLayers } from './MapLayers.ts';
import { routeArcs } from './geoRoute.ts';
import { showBasemapError } from './geoMapErrors.ts';
import { fitMaxZoom, needsInsetRefit } from './geoMapPolicy.ts';
import { addRouteLayers, setRouteLines } from './geoRouteLayer.ts';
import { loadMapLibre } from './maplibreLoader.ts';
import type { MapLibre } from './maplibreLoader.ts';
import { loadMapStyle } from './mapStyle.ts';
import { MAP } from './map.const.ts';
import { prefersReducedMotion, sameMarkers } from './mapUtil.ts';
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
    this.observer.disconnect();
    this.layers.destroy();
    this.gl?.remove();
    this.gl = null;
    this.host.classList.remove('tmroot', 'tm-static');
    this.host.replaceChildren();
  }

  /** Đặt vùng nhìn thấy thật sự (ví dụ trừ phần tờ dưới che) để vừa khung căn giữa đúng. */
  setInsets(inset: Partial<Insets>): void {
    if (this.dead) return;
    const before = this.inset;
    this.inset = { ...NO_INSET, ...inset };
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
  setRoute(ids: readonly string[] | null, labels: readonly string[] = []): void {
    if (this.dead) return;
    this.route = ids && ids.length > 1 ? { ids, labels } : null;
    if (this.ready) this.drawRoute();
  }

  /** Chọn một ghim (vòng sáng); null để bỏ chọn. */
  select(id: string | null): void {
    if (this.dead) return;
    this.selected = id;
    this.layers.select(id);
  }

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
    const pts = this.markers.filter((m) => !ids || ids.includes(m.id)).map((m) => m.p);
    if (o.keepIfVisible && this.touchedByUser && this.allInView(pts)) return;
    if (pts.length) this.fitPoints(pts, o);
    else this.fitCountry(o.animate !== false);
  }

  /** Tải MapLibre và kiểu bản đồ song song, dựng bản đồ; lỗi thì hiện thông báo kèm nút thử lại. */
  private async start(): Promise<void> {
    this.host.querySelector('.tm-err')?.remove();
    this.host.dataset['ready'] = '0';
    try {
      const [ml, style] = await Promise.all([loadMapLibre(), loadMapStyle()]);
      if (this.dead) return;
      this.ml = ml;
      this.gl = this.createMap(ml, style);
    } catch {
      if (!this.dead) this.showLoadError();
    }
  }

  /** Hiện lỗi tải bản đồ với nút "Thử lại". */
  private showLoadError(): void {
    this.host.dataset['ready'] = 'err';
    const box = Object.assign(document.createElement('div'), { className: 'tm-err' });
    box.setAttribute('role', 'alert');
    const retry = Object.assign(document.createElement('button'), { type: 'button', textContent: COPY.map.retry });
    retry.addEventListener('click', () => void this.start());
    box.append(Object.assign(document.createElement('span'), { textContent: COPY.map.loadError }), retry);
    this.host.appendChild(box);
  }

  /** Dựng MapLibre không xoay; nhãn khoảng cách tuyến là phần HTML duy nhất cần theo camera. */
  private createMap(ml: MapLibre, style: Awaited<ReturnType<typeof loadMapStyle>>): MlMap {
    const map = new ml.Map({
      container: this.mapEl,
      style,
      bounds: MAP.VIETNAM_BOUNDS as unknown as [number, number, number, number],
      interactive: this.opt.interactive,
      attributionControl: this.opt.credit ? { compact: true } : false,
      dragRotate: false,
      pitchWithRotate: false,
      minZoom: MAP.GL_MIN_ZOOM,
      maxZoom: MAP.GL_MAX_ZOOM,
      renderWorldCopies: false,
      locale: { 'NavigationControl.ZoomIn': COPY.map.zoomIn, 'NavigationControl.ZoomOut': COPY.map.zoomOut, 'AttributionControl.ToggleAttribution': COPY.map.attribution },
    });
    if (this.opt.interactive) {
      map.touchZoomRotate.disableRotation();
      map.addControl(new ml.NavigationControl({ showCompass: false, visualizePitch: false }), 'bottom-right');
    }
    map.on('move', () => this.layers.place(this.project));
    map.on('moveend', () => this.layout());
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
    addRouteLayers(map, this.host);
    this.layers.attach(map, () => this.markTouched());
    this.ready = true;
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
    const route = this.route;
    const have = route ? route.ids.map((id, k) => ({ m: this.markers.find((x) => x.id === id), k })).filter((x): x is { m: ProjectedMarker; k: number } => Boolean(x.m)) : [];
    const { lines, mids } = routeArcs(have.map((x) => x.m.p));
    setRouteLines(this.gl, lines);
    this.host.dataset['route'] = lines.length ? '1' : '0';
    this.layers.setSegmentLabels(have.slice(1).map((x) => route?.labels[x.k - 1] ?? ''), mids);
    this.layers.place(this.project);
  }

  /** Sau khi camera dừng chỉ ghi điểm kiểm; worker và renderer native tự gộp cụm/đặt nhãn. */
  private layout(): void {
    const gl = this.gl;
    if (!this.ready || !gl) return;
    this.host.dataset['zoom'] = gl.getZoom().toFixed(MAP.ZOOM_DIGITS); // điểm kiểm cho e2e: mức zoom hiện tại
    this.layers.snapshot();
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
    const cap = (v: number, size: number): number => Math.max(0, Math.min(v, size / HALF - 1));
    const credit = this.opt.credit ? MAP.CREDIT_BAND : 0; // thanh ghi công nằm đè đáy bản đồ, ghim không được lọt xuống dưới nó
    return { top: cap(this.inset.top + pad, r.height), bottom: cap(this.inset.bottom + pad + credit, r.height), left: cap(this.inset.left + pad, r.width), right: cap(this.inset.right + pad, r.width) };
  }

  /** Bay (hoặc nhảy, khi giảm chuyển động) tới khung vừa các điểm. */
  private fitPoints(pts: readonly Pt[], o: FitOptions): void {
    const { ml, gl } = this;
    const first = pts[0];
    if (!ml || !gl || !first) return;
    const bounds: LngLatBounds = new ml.LngLatBounds([first[0], first[1]], [first[0], first[1]]);
    pts.forEach((p) => bounds.extend([p[0], p[1]]));
    const animate = o.animate !== false && !prefersReducedMotion();
    gl.fitBounds(bounds, { padding: this.fitPadding(o.padding ?? MAP.FIT_PADDING), maxZoom: fitMaxZoom(o), duration: animate ? MAP.FLY_MS : 0, essential: true });
  }

  /** Cho thấy cả nước (khi chưa có ghim nào). */
  private fitCountry(animate: boolean): void {
    const [west, south, east, north] = MAP.VIETNAM_BOUNDS;
    this.gl?.fitBounds([[west, south], [east, north]], { padding: this.fitPadding(0), duration: animate && !prefersReducedMotion() ? MAP.FLY_MS : 0, essential: true });
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
