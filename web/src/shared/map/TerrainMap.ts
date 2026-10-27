import { COPY } from '../const/copy.vi.ts';
import { MEDIA } from '../const/app.const.ts';
import { HALF } from '../const/math.const.ts';
import { MapCamera } from './MapCamera.ts';
import { attachMapControls } from './MapControls.ts';
import { MapLayers } from './MapLayers.ts';
import { TerrainData } from './TerrainData.ts';
import { MAP } from './map.const.ts';
import { fitCamera, toScreen, zoomCamera } from './mapGeometry.ts';
import type { FitOptions, Insets, MapData, MapMarker, MapMode, MapRoute, ProjectedMarker, Pt, TerrainMapOptions } from './map.types.ts';

let sequence = 0;

/** Camera đang chờ dữ liệu: vừa khung các ghim (null = tất cả). */
interface FitRequest {
  readonly ids: readonly string[] | null;
  readonly o: FitOptions;
}

/** Hai danh sách ghim có giống nhau (cùng id, tọa độ, nhãn, số, ảnh, kiểu) không: để bỏ qua việc dựng lại khi chỉ đổi tham chiếu mảng. */
function sameMarkers(a: readonly MapMarker[], b: readonly MapMarker[]): boolean {
  return a.length === b.length && a.every((m, i) => JSON.stringify(m) === JSON.stringify(b[i]));
}

/** Người dùng yêu cầu giảm chuyển động. */
function prefersReducedMotion(): boolean {
  return window.matchMedia(MEDIA.REDUCED_MOTION).matches;
}

/**
 * Bản đồ địa hình tương tác của Wander (không thư viện, không khóa API): nền là ảnh độ cao + bóng núi dựng sẵn;
 * ghim, nhãn, tuyến là phần tử HTML/SVG do lớp này điều phối (camera, gộp cụm, hoạt họa). Màu lấy từ token `--map-*`.
 */
export class TerrainMap {
  private readonly host: HTMLElement;
  private readonly opt: Required<Pick<TerrainMapOptions, 'interactive' | 'towns' | 'credit'>> & TerrainMapOptions;
  private readonly layers: MapLayers;
  private readonly camera: MapCamera;
  private readonly uid: string;
  private readonly observer: ResizeObserver;
  private readonly detachControls: () => void;
  private data: MapData | null = null;
  private raw: readonly MapMarker[] = [];
  private markers: ProjectedMarker[] = [];
  private route: MapRoute | null = null;
  private mode: MapMode = 'browse';
  private selected: string | null = null;
  private touchedByUser = false;
  private lastFit: FitRequest | null = null;
  private pendingFit: FitRequest | null = null;
  private dead = false;

  /** Dựng bản đồ vào `host` (cần có kích thước) và bắt đầu tải dữ liệu. */
  constructor(host: HTMLElement, opt: TerrainMapOptions) {
    this.host = host;
    this.opt = { interactive: true, towns: true, credit: true, ...opt };
    this.uid = `${opt.dest}-${(sequence += 1)}`;
    host.classList.add('tmroot');
    host.dataset['ready'] = '0';
    host.setAttribute('role', 'region');
    host.setAttribute('aria-label', opt.label);
    this.layers = new MapLayers(host);
    this.camera = new MapCamera({ onFrame: () => this.apply(), onSettled: () => this.layout() });
    this.detachControls = this.opt.interactive ? attachMapControls(host, this.controlsApi()) : this.markStatic();
    if (this.opt.credit) host.appendChild(Object.assign(document.createElement('p'), { className: 'tm-credit', textContent: COPY.map.credit }));
    this.observer = new ResizeObserver(() => this.onResize(false));
    this.observer.observe(host);
    this.load();
  }

  /** Bản đồ không tương tác: chỉ đánh dấu để CSS cho phép cuộn trang xuyên qua. */
  private markStatic(): () => void {
    this.host.classList.add('tm-static');
    return () => undefined;
  }

  /** Phần tử chứa bản đồ (để gắn lại khi màn dựng lại mà không tạo bản đồ mới). */
  get element(): HTMLElement {
    return this.host;
  }

  /** Giải phóng quan sát kích thước, bộ nghe cử chỉ và dừng hoạt họa. */
  destroy(): void {
    this.dead = true;
    this.camera.cancel();
    this.observer.disconnect();
    this.detachControls();
    this.host.classList.remove('tmroot', 'tm-static');
    this.host.removeAttribute('tabindex');
    this.host.replaceChildren();
  }

  /** Cầu nối cho điều khiển: dịch, phóng, đánh dấu đã chạm, dừng bay, bố trí lại. */
  private controlsApi() {
    return {
      panBy: (dx: number, dy: number): void => {
        const c = this.camera.cam;
        this.camera.set({ cx: c.cx + dx / c.s, cy: c.cy + dy / c.s, s: c.s });
        this.apply();
      },
      zoomBy: (f: number, client: Pt | null, animate: boolean): void => this.zoomBy(f, client, animate),
      touched: (): void => {
        this.touchedByUser = true;
      },
      stopFly: (): void => this.camera.cancel(),
      settled: (): void => this.layout(),
    };
  }

  /** Tải dữ liệu bản đồ; lỗi thì hiện thông báo kèm nút thử lại (không để bản đồ chết im lặng). */
  private load(): void {
    this.host.querySelector('.tm-err')?.remove();
    this.host.dataset['ready'] = '0';
    TerrainData.load(this.opt.dest).then(
      (d) => {
        if (!this.dead) this.init(d);
      },
      () => {
        if (!this.dead) this.showLoadError();
      },
    );
  }

  /** Hiện lỗi tải bản đồ với nút "Thử lại". */
  private showLoadError(): void {
    this.host.dataset['ready'] = 'err';
    const box = Object.assign(document.createElement('div'), { className: 'tm-err' });
    box.setAttribute('role', 'alert');
    const retry = Object.assign(document.createElement('button'), { type: 'button', textContent: COPY.map.retry });
    retry.addEventListener('click', () => this.load());
    box.append(Object.assign(document.createElement('span'), { textContent: COPY.map.loadError }), retry);
    this.host.appendChild(box);
  }

  /** Dữ liệu đã tải: dựng nền, đặt kích thước, hiện ghim đang chờ rồi vừa khung. */
  private init(d: MapData): void {
    this.data = d;
    this.camera.bounds = { w: d.meta.width, h: d.meta.height };
    this.camera.cam = { cx: d.meta.width / HALF, cy: d.meta.height / HALF, s: MAP.INITIAL_SCALE };
    this.layers.mountBase(d, this.uid, this.host, this.opt.towns);
    this.onResize(true);
    this.host.dataset['ready'] = '1';
    this.applyMarkers();
    const f = this.pendingFit;
    this.pendingFit = null;
    if (f) this.fitTo(f.ids, f.o);
    else this.fitAll(false);
  }

  /** Cập nhật kích thước khung khi đổi cỡ: chưa ai kéo/phóng thì vừa khung lại theo cỡ mới, ngược lại giữ nguyên tâm. */
  private onResize(first: boolean): void {
    const r = this.host.getBoundingClientRect();
    this.camera.size = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    if (!this.data || first) return;
    if (!this.touchedByUser && this.lastFit) this.fitTo(this.lastFit.ids, { ...this.lastFit.o, animate: false });
    else {
      this.apply();
      this.layout();
    }
  }

  /** Đặt vùng nhìn thấy thật sự (ví dụ trừ phần tờ dưới che) để camera căn giữa đúng. */
  setInsets(inset: Partial<Insets>): void {
    if (this.dead) return;
    this.camera.setInsets(inset);
  }

  /** Đặt danh sách ghim (chiếu và hiện khi dữ liệu đã có). */
  setMarkers(list: readonly MapMarker[]): void {
    if (this.dead || sameMarkers(this.raw, list)) return;
    this.raw = list;
    if (this.data) this.applyMarkers();
  }

  /** Chế độ 'browse' (gộp cụm) hoặc 'route' (đánh số, không gộp). */
  setMode(mode: MapMode): void {
    if (this.dead || mode === this.mode) return;
    this.mode = mode;
    if (this.data) this.layout();
  }

  /** Vẽ tuyến nối các ghim theo thứ tự id; nhãn khoảng cách tùy chọn theo từng đoạn. */
  setRoute(ids: readonly string[] | null, labels: readonly string[] = []): void {
    if (this.dead) return;
    this.route = ids && ids.length > 1 ? { ids, labels } : null;
    if (this.data) this.drawRoute();
  }

  /** Chọn một ghim (phóng nhẹ, vòng sáng); null để bỏ chọn. */
  select(id: string | null): void {
    if (this.dead) return;
    this.selected = id;
    this.layers.select(id);
  }

  /** Vừa khung toàn bộ vùng dữ liệu. */
  fitAll(animate = true): void {
    const b = this.camera.bounds;
    this.camera.flyTo(b ? { cx: b.w / HALF, cy: b.h / HALF, s: this.camera.minScale } : this.camera.cam, animate, prefersReducedMotion());
  }

  /** Vừa khung các ghim theo id (null = tất cả ghim). Chưa có dữ liệu thì nhớ để làm khi tải xong. */
  fitTo(ids: readonly string[] | null, o: FitOptions = {}): void {
    if (this.dead) return;
    this.lastFit = { ids, o };
    if (!this.data) {
      this.pendingFit = this.lastFit;
      return;
    }
    const pts = this.markers.filter((m) => !ids || ids.includes(m.id)).map((m) => m.p);
    const cam = fitCamera(pts, this.camera.size, this.camera.inset, this.camera.minScale, o);
    if (!cam) this.fitAll(o.animate !== false);
    else this.camera.flyTo(cam, o.animate !== false, prefersReducedMotion());
  }

  /** Phóng/thu hệ số `f` quanh điểm màn hình `client` (null = tâm khung). */
  private zoomBy(f: number, client: Pt | null, animate: boolean): void {
    const r = this.host.getBoundingClientRect();
    const { size, cam, minScale } = this.camera;
    const px = client ? client[0] - r.left : size.w / HALF;
    const py = client ? client[1] - r.top : size.h / HALF;
    const next = zoomCamera(cam, size, f, px, py, minScale);
    if (animate) this.camera.flyTo(next, true, prefersReducedMotion());
    else {
      // đang chụm/lăn: chỉ dời ghim theo camera; gộp cụm và đặt nhãn làm khi cử chỉ dừng (`settled`)
      this.camera.cancel();
      this.camera.set(next);
      this.apply();
    }
  }

  /** Chiếu ghim đầu vào sang điểm ảnh bản đồ rồi đồng bộ phần tử ghim, tuyến và bố cục. */
  private applyMarkers(): void {
    const meta = this.data?.meta;
    if (!meta) return;
    this.markers = this.raw.map((m) => ({ ...m, p: TerrainData.project(meta, m.lat, m.lon) }));
    this.layers.syncMarkers(this.markers, this.selected, this.opt.onPin);
    this.drawRoute();
    this.layout();
  }

  /** Vẽ lại tuyến theo ghim hiện có. */
  private drawRoute(): void {
    this.layers.drawRoute(this.route, this.markers, prefersReducedMotion());
    this.layers.place(this.project, this.markers);
  }

  /** Tọa độ bản đồ → màn hình theo camera hiện tại. */
  private readonly project = (p: Pt): Pt => toScreen(this.camera.cam, this.camera.size, p);

  /** Áp camera lên SVG (viewBox) và dời ghim/nhãn tương ứng. */
  private apply(): void {
    const { cam, size } = this.camera;
    const w = size.w / cam.s;
    const h = size.h / cam.s;
    this.layers.svg.setAttribute('viewBox', `${cam.cx - w / HALF} ${cam.cy - h / HALF} ${w} ${h}`);
    this.layers.svg.style.setProperty('--k', String(1 / cam.s));
    this.layers.place(this.project, this.markers);
  }

  /** Sau khi camera dừng: gộp cụm, đặt nhãn không chồng, ẩn/hiện tên thị trấn. */
  private layout(): void {
    if (!this.data) return;
    this.layers.layout({
      markers: this.markers,
      mode: this.mode,
      selected: this.selected,
      project: this.project,
      size: this.camera.size,
      scale: this.camera.cam.s,
      onCluster: (ids) => this.fitTo(ids, { padding: MAP.CLUSTER_FIT_PADDING }),
      clusterLabel: (n) => `${n} ${COPY.map.cluster}`,
    });
  }
}
