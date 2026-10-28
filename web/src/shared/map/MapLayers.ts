import { MAP } from './map.const.ts';
import { clusterPins, pinBox, placeLabels } from './mapGeometry.ts';
import type { Box } from './mapGeometry.ts';
import type { MapMode, Pt, ProjectedMarker, Size } from './map.types.ts';

const TRANSLATE_DIGITS = 1;

/** Biến đổi tọa độ bản đồ sang màn hình (do camera cung cấp). */
export type Project = (p: Pt) => Pt;

/** Ngữ cảnh để bố trí lại ghim, cụm và nhãn sau khi camera dừng. */
export interface LayoutContext {
  readonly markers: readonly ProjectedMarker[];
  readonly mode: MapMode;
  readonly selected: string | null;
  readonly project: Project;
  readonly size: Size;
  readonly onCluster: (ids: string[]) => void;
  readonly clusterLabel: (n: number) => string;
}

/** Đặt `translate3d` (bằng GPU) cho một phần tử theo tọa độ màn hình. */
function moveTo(el: HTMLElement, at: Pt): void {
  el.style.transform = `translate3d(${at[0].toFixed(TRANSLATE_DIGITS)}px, ${at[1].toFixed(TRANSLATE_DIGITS)}px, 0)`;
}

/** Lớp HTML đè trên MapLibre: ghim, cụm và nhãn; không quản lý nền hay cử chỉ. */
export class MapLayers {
  private readonly labels: HTMLElement;
  private readonly pins: HTMLElement;
  private readonly markerEls = new Map<string, HTMLButtonElement>();
  private clusters: { el: HTMLButtonElement; p: Pt }[] = [];
  /** Phần tử cụm đang có, theo khóa là danh sách mã ghim (đã sắp) trong cụm. */
  private clusterEls = new Map<string, HTMLButtonElement>();
  /** Đã bố trí ít nhất một lần: từ đó ghim/cụm mới chen vào không chạy lại hiệu ứng rơi. */
  private laidOut = false;
  private segMids: { index: number; p: Pt }[] = [];
  private pinLabels: { el: HTMLElement; p: Pt; offset: Pt }[] = [];

  /** Thêm lớp nhãn và ghim phía trên canvas MapLibre, giữ nội dung nền có sẵn. */
  constructor(host: HTMLElement) {
    this.labels = Object.assign(document.createElement('div'), { className: 'tm-labels' });
    this.labels.setAttribute('aria-hidden', 'true');
    this.pins = Object.assign(document.createElement('div'), { className: 'tm-pins' });
    host.append(this.labels, this.pins);
  }

  /** Nhãn khoảng cách giữa các đoạn tuyến (bản đồ WebGL): `labels[i]` ở điểm giữa `mids[i]` (cùng hệ tọa độ với ghim). Nhãn rỗng thì bỏ. */
  setSegmentLabels(labels: readonly string[], mids: readonly Pt[]): void {
    this.labels.querySelectorAll('.tm-seg-label').forEach((n) => n.remove());
    this.segMids = [];
    mids.forEach((p, i) => {
      const text = labels[i];
      if (!text) return;
      const label = Object.assign(document.createElement('span'), { className: 'tm-seg-label', textContent: text });
      label.dataset['i'] = String(i + 1);
      this.labels.appendChild(label);
      this.segMids.push({ index: i + 1, p });
    });
  }

  /** Đồng bộ phần tử ghim với danh sách hiện hành (thêm, cập nhật, gỡ). `onPin` được gọi khi chạm ghim. */
  syncMarkers(markers: readonly ProjectedMarker[], selected: string | null, onPin?: (id: string) => void): void {
    const keep = new Set(markers.map((m) => m.id));
    markers.forEach((m, i) => {
      let el = this.markerEls.get(m.id);
      const isNew = !el;
      if (!el) {
        el = Object.assign(document.createElement('button'), { type: 'button' });
        el.dataset['id'] = m.id;
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onPin?.(m.id);
        });
        this.pins.appendChild(el);
        this.markerEls.set(m.id, el);
      }
      el.style.setProperty('--i', String(i));
      el.className = ['tm-pin', m.muted ? 'is-muted' : '', m.kind === 'hub' ? 'is-hub' : '', m.id === selected ? 'is-sel' : ''].filter(Boolean).join(' ');
      el.setAttribute('aria-label', (m.num != null ? `${m.num}. ` : '') + (m.label || m.id));
      // bản đồ chỉ để xem (không có onPin): ghim là hình trang trí, không phải nút bàn phím
      el.tabIndex = onPin ? 0 : -1;
      el.toggleAttribute('aria-hidden', !onPin);
      const sig = [m.thumb ?? '', m.num ?? '', m.kind ?? ''].join('|');
      if (isNew || el.dataset['sig'] !== sig) {
        el.dataset['sig'] = sig;
        // chỉ ghim mới mới "rơi"; ghim đã có mà đổi số/ảnh thì thay thân tại chỗ, không chạy lại hiệu ứng
        el.replaceChildren(this.pinBody(m, isNew));
      }
    });
    this.markerEls.forEach((el, id) => {
      if (keep.has(id)) return;
      el.remove();
      this.markerEls.delete(id);
    });
  }

  /** Thân ghim: ảnh tròn (nếu có) và số thứ tự hoặc chấm mốc. `animate` false thì bỏ hiệu ứng rơi (ghim đã có trên bản đồ). */
  private pinBody(m: ProjectedMarker, animate: boolean): HTMLElement {
    const body = Object.assign(document.createElement('span'), { className: animate ? 'tm-pin-body' : 'tm-pin-body is-still' });
    if (m.thumb) body.appendChild(Object.assign(document.createElement('img'), { alt: '', src: m.thumb }));
    if (m.num != null) body.appendChild(Object.assign(document.createElement('b'), { textContent: String(m.num) }));
    else if (m.kind === 'hub') body.appendChild(Object.assign(document.createElement('i'), { className: 'tm-hub-dot' }));
    return body;
  }

  /** Bật/tắt vòng sáng của ghim đang chọn. */
  select(id: string | null): void {
    this.markerEls.forEach((el, k) => el.classList.toggle('is-sel', k === id));
  }

  /** Dời mọi phần tử HTML theo camera (gọi mỗi khung hình khi bay/kéo). */
  place(project: Project, markers: readonly ProjectedMarker[]): void {
    markers.forEach((m) => {
      const el = this.markerEls.get(m.id);
      if (el) moveTo(el, project(m.p));
    });
    this.clusters.forEach((c) => moveTo(c.el, project(c.p)));
    this.pinLabels.forEach((label) => {
      const at = project(label.p);
      moveTo(label.el, [at[0] + label.offset[0], at[1] + label.offset[1]]);
    });
    this.segMids.forEach((m) => {
      const el = this.labels.querySelector<HTMLElement>(`.tm-seg-label[data-i="${m.index}"]`);
      if (el) moveTo(el, project(m.p));
    });
  }

  /** Sau khi camera dừng: gộp cụm (chế độ duyệt) và đặt nhãn không chồng. */
  layout(ctx: LayoutContext): void {
    this.place(ctx.project, ctx.markers);
    const shown = this.rebuildClusters(ctx);
    this.place(ctx.project, ctx.markers);
    const pinBoxes: Box[] = ctx.markers.filter((m) => shown.get(m.id)).map((m) => pinBox(ctx.project(m.p), MAP.PIN_HALF));
    this.clusters.forEach((c) => pinBoxes.push(pinBox(ctx.project(c.p), MAP.CLUSTER_HALF)));
    this.placePinLabels(ctx, shown, pinBoxes);
  }

  /** Gộp các ghim gần nhau thành cụm; trả bảng ghim nào đang hiện (false = đã vào cụm). */
  private rebuildClusters(ctx: LayoutContext): Map<string, boolean> {
    const previous = this.clusterEls;
    this.clusterEls = new Map();
    this.clusters = [];
    const shown = new Map(ctx.markers.map((m) => [m.id, true]));
    if (ctx.mode === 'browse') {
      const pins = ctx.markers.filter((m) => m.kind !== 'hub').map((m) => ({ id: m.id, p: m.p, s: ctx.project(m.p) }));
      for (const g of clusterPins(pins)) {
        g.ids.forEach((id) => shown.set(id, false));
        // cụm có cùng nhóm ghim thì giữ phần tử cũ (không nhấp nháy mỗi lần zoom dừng)
        const key = [...g.ids].sort().join(',');
        const el = previous.get(key) ?? this.buildCluster(g.ids, ctx);
        previous.delete(key);
        this.clusterEls.set(key, el);
        this.clusters.push({ el, p: g.p });
      }
    }
    previous.forEach((el) => el.remove());
    this.laidOut = true;
    this.markerEls.forEach((el, id) => el.classList.toggle('is-hidden', shown.get(id) === false));
    return shown;
  }

  /** Dựng một ghim cụm (số ghim bên trong); chỉ lần bố trí đầu tiên mới có hiệu ứng rơi, các lần sau hiện thẳng. */
  private buildCluster(ids: readonly string[], ctx: LayoutContext): HTMLButtonElement {
    const el = Object.assign(document.createElement('button'), { type: 'button', className: this.laidOut ? 'tm-cluster is-still' : 'tm-cluster' });
    el.setAttribute('aria-label', ctx.clusterLabel(ids.length));
    el.appendChild(Object.assign(document.createElement('b'), { textContent: String(ids.length) }));
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      ctx.onCluster([...ids]);
    });
    this.pins.appendChild(el);
    return el;
  }

  /** Đặt nhãn tên cho các ghim đang hiện (ghim đang chọn trước, ghim mờ sau); trả các hộp nhãn đã đặt. */
  private placePinLabels(ctx: LayoutContext, shown: Map<string, boolean>, pinBoxes: readonly Box[]): Box[] {
    this.labels.querySelectorAll('.tm-pin-label').forEach((n) => n.remove());
    this.pinLabels = [];
    const order = ctx.markers
      .filter((m) => shown.get(m.id) && m.label && (!m.muted || m.id === ctx.selected))
      .sort((a, b) => Number(b.id === ctx.selected) - Number(a.id === ctx.selected) || Number(Boolean(a.muted)) - Number(Boolean(b.muted)));
    const els = order.map((m) => {
      const el = Object.assign(document.createElement('span'), { className: m.muted ? 'tm-pin-label is-muted' : 'tm-pin-label', textContent: m.label });
      this.labels.appendChild(el);
      return { m, el, w: el.offsetWidth, h: el.offsetHeight };
    });
    const { placed, boxes } = placeLabels(els.map((e) => ({ id: e.m.id, at: ctx.project(e.m.p), w: e.w, h: e.h })), pinBoxes, ctx.size);
    els.forEach((e) => {
      const at = placed.get(e.m.id);
      if (at) {
        const anchor = ctx.project(e.m.p);
        this.pinLabels.push({ el: e.el, p: e.m.p, offset: [at[0] - anchor[0], at[1] - anchor[1]] });
        moveTo(e.el, at);
      }
      else e.el.remove();
    });
    return boxes;
  }
}
