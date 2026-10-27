/* Bản đồ địa hình riêng của Wander (prototype). Không dùng thư viện bản đồ, không khóa API, không gọi máy chủ bản đồ:
   - nền là ảnh độ cao + bóng núi dựng sẵn bằng `docs/ux/tools/build-map.mjs` (AWS Terrain Tiles + OpenStreetMap, xem ghi công ở góc bản đồ);
   - màu của bản đồ đọc từ token `--map-*` trong tokens.css, nên đổi bộ màu là bản đồ đổi theo;
   - ghim, nhãn, tuyến là phần tử HTML/SVG do lớp TerrainMap điều khiển (camera, gộp cụm, hoạt họa).
   Quy ước mã: chuẩn FE (docs/architecture/frontend-standards.md): chú thích trước mỗi hàm, hằng số ở MAP_CONST, không số ma thuật rải rác. */

/** Hằng số của bản đồ (đơn vị: điểm ảnh màn hình trừ khi ghi khác). */
const MAP_CONST = Object.freeze({
  DATA_URL: new URL('../map/', document.currentScript.src).href,   // thư mục dữ liệu (map/<điểm đến>/), tính từ vị trí tệp này
  MIN_SCALE: 0.1,                   // thu nhỏ tối đa (ngoài vùng dữ liệu là màu đất phẳng)
  MAX_SCALE: 1.8,                   // phóng tối đa (điểm ảnh màn hình trên điểm ảnh zoom 12)
  FIT_PADDING: 36,                  // lề khi vừa khung các điểm
  FLY_MS: 750,                      // thời lượng camera bay
  CLUSTER_PX: 34,                   // hai ghim gần hơn mức này thì gộp thành cụm (chế độ duyệt)
  LABEL_GAP: 4,                     // khoảng cách tối thiểu giữa hai nhãn
  TOWN_MIN_SCALE: 0.16,             // chỉ hiện tên thị trấn khi phóng đủ
  ARC_CURVE: 0.18,                  // độ cong của đường nối (tỉ lệ độ dài)
  ZOOM_STEP: 1.6,                   // hệ số mỗi lần bấm +/−
  WHEEL_SENS: 0.0016,               // độ nhạy lăn chuột
  RAMP_TOKENS: ['--map-low', '--map-mid', '--map-high', '--map-peak'],
  PIN_HALF: 20,                     // nửa cạnh ô chiếm chỗ của một ghim (dùng khi đặt nhãn)
  CLUSTER_HALF: 18,                 // nửa cạnh ô của ghim cụm
  LABEL_X: 24, LABEL_Y: 22,         // khoảng nhãn cách tâm ghim theo ngang / dọc
  EDGE_PAD: 4,                      // lề tối thiểu giữa nhãn và mép khung
  TOWN_NEAR_X: 40, TOWN_NEAR_Y: 14, // tên thị trấn không đè lên ghim/nhãn trong phạm vi này
  FIT_MAX_FACTOR: 0.55,             // phóng tối đa khi vừa khung (tỉ lệ MAX_SCALE)
  FIT_MIN_SPAN: 60,                 // bề rộng/cao tối thiểu của vùng cần vừa khung (điểm ảnh bản đồ)
  PAN_STEP: 80,                     // bước dịch bằng phím mũi tên (điểm ảnh màn hình)
  CREDIT: 'Độ cao: AWS Terrain Tiles · Đường, sông: © OpenStreetMap',
  TEXT: Object.freeze({ MAP: 'Bản đồ địa hình', ERR: 'Không tải được bản đồ.', RETRY: 'Thử lại', ZOOM_IN: 'Phóng to', ZOOM_OUT: 'Thu nhỏ', CLUSTER: 'nơi gần nhau, chạm để phóng to' })
});

/** Hàm ease cho camera: chậm đầu, nhanh giữa, chậm cuối. */
const mapEase = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Tải và nhớ dữ liệu bản đồ của một điểm đến (meta + vector). */
class TerrainData {
  static #cache = new Map();

  /** Trả về Promise<{ meta, vectors }>; gọi nhiều lần chỉ tải một lần. */
  static load(dest) {
    if (!TerrainData.#cache.has(dest)) {
      const base = `${MAP_CONST.DATA_URL}${dest}/`;
      const get = (f) => fetch(base + f).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + f); return r.json(); });
      TerrainData.#cache.set(dest, Promise.all([get('meta.json'), get('vectors.json')]).then(([meta, vectors]) => ({ dest, base, meta, vectors })).catch((e) => { TerrainData.#cache.delete(dest); throw e; }));   // lỗi không được nhớ: lần sau tải lại được
    }
    return TerrainData.#cache.get(dest);
  }

  /** Chiếu (vĩ độ, kinh độ) sang toạ độ điểm ảnh của ảnh nền (cùng cách với build-map.mjs). */
  static project(meta, lat, lon) {
    const n = 2 ** meta.zoom, r = (lat * Math.PI) / 180;
    return [((lon + 180) / 360) * n * 256 - meta.origin[0], ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n * 256 - meta.origin[1]];
  }
}

/** Đọc một màu CSS bất kỳ (kể cả var()) thành [r, g, b] 0..1 bằng canvas. */
function mapRgb(css) {
  const c = mapRgb.ctx || (mapRgb.ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true }));
  c.clearRect(0, 0, 1, 1); c.fillStyle = '#000'; c.fillStyle = css; c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255];
}

/** Bản đồ địa hình tương tác: camera, ghim, tuyến, nhãn, gộp cụm. */
class TerrainMap {
  #host; #opt; #data = null; #svg; #vb = { x: 0, y: 0, w: 1, h: 1 };
  #cam = { cx: 0, cy: 0, s: 0.2 }; #size = { w: 1, h: 1 }; #inset = { top: 0, right: 0, bottom: 0, left: 0 };
  #markers = []; #markerEls = new Map(); #clusterEls = []; #route = null; #raf = 0; #ro = null; #dead = false;
  static #seq = 0; #uid = ''; #layers = {}; #pointers = new Map(); #drag = null; #selected = null; #mode = 'browse';

  /**
   * @param {HTMLElement} host phần tử chứa (cần kích thước; sẽ được thêm class `tm`)
   * @param {{dest:string, interactive?:boolean, towns?:boolean, onPin?:(id:string)=>void, credit?:boolean}} opt
   */
  constructor(host, opt) {
    this.#host = host; this.#opt = Object.assign({ interactive: true, towns: true, credit: true }, opt);
    host.classList.add('tmroot'); host.dataset.ready = '0'; host.setAttribute('role', 'region'); host.setAttribute('aria-label', this.#opt.label || MAP_CONST.TEXT.MAP); this.#uid = `${this.#opt.dest}-${++TerrainMap.#seq}`;
    host.innerHTML = '<svg class="tm-svg" aria-hidden="true"></svg><div class="tm-labels" aria-hidden="true"></div><div class="tm-pins"></div>';
    this.#svg = host.querySelector('.tm-svg');
    this.#layers = { labels: host.querySelector('.tm-labels'), pins: host.querySelector('.tm-pins') };
    if (this.#opt.interactive) this.#buildControls(); else host.classList.add('tm-static');
    if (this.#opt.credit) host.insertAdjacentHTML('beforeend', `<p class="tm-credit">${MAP_CONST.CREDIT}</p>`);
    this.#ro = new ResizeObserver(() => this.#onResize()); this.#ro.observe(host);
    this.#load();
  }

  /** Tải dữ liệu bản đồ; lỗi thì hiện thông báo kèm nút thử lại (không để bản đồ chết im lặng). */
  #load() {
    this.#host.querySelector('.tm-err')?.remove(); this.#host.dataset.ready = '0';
    TerrainData.load(this.#opt.dest).then((d) => { if (!this.#dead) this.#init(d); }).catch(() => {
      if (this.#dead) return;
      this.#host.dataset.ready = 'err';
      this.#host.insertAdjacentHTML('beforeend', `<div class="tm-err" role="alert"><span>${MAP_CONST.TEXT.ERR}</span><button type="button">${MAP_CONST.TEXT.RETRY}</button></div>`);
      this.#host.querySelector('.tm-err button').addEventListener('click', () => this.#load());
    });
  }

  /** Phần tử chứa bản đồ (để gắn lại khi màn dựng lại mà không tạo bản đồ mới). */
  get host() { return this.#host; }

  /** Giải phóng quan sát kích thước và dừng hoạt họa. */
  destroy() { this.#dead = true; cancelAnimationFrame(this.#raf); clearTimeout(this.#wheelT); this.#ro?.disconnect(); }

  /** Chạy khi dữ liệu đã tải: dựng SVG nền, vector, rồi hiện ghim đang chờ. */
  #init(d) {
    this.#data = d; const { meta, vectors, base } = d;
    this.#cam = { cx: meta.width / 2, cy: meta.height / 2, s: 0.2 };
    const ramp = MAP_CONST.RAMP_TOKENS.map((t) => mapRgb(getComputedStyle(this.#host).getPropertyValue(t).trim()));
    const table = (k) => ramp.map((c) => c[k].toFixed(3)).join(' ');
    const vec = (arr, cls, fn) => arr.map((r) => `<polyline class="${cls}${fn ? ' ' + fn(r) : ''}" points="${r.p.join(' ')}"/>`).join('');
    const roads = vectors.roads.filter((r) => !/^[GSXY]\d/i.test(r.n) && !/[㐀-鿿]/.test(r.n));
    this.#svg.innerHTML = `<defs><filter id="tmr-${this.#uid}" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues="${table(0)}"/><feFuncG type="table" tableValues="${table(1)}"/><feFuncB type="table" tableValues="${table(2)}"/></feComponentTransfer></filter><mask id="tmm-${this.#uid}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${meta.width}" height="${meta.height}"><image href="${base}height.webp" width="${meta.width}" height="${meta.height}" preserveAspectRatio="none"/></mask></defs>
      <image class="tm-height" href="${base}height.webp" width="${meta.width}" height="${meta.height}" preserveAspectRatio="none" filter="url(#tmr-${this.#uid})"/>
      <image class="tm-shade" href="${base}shade.webp" width="${meta.width}" height="${meta.height}" preserveAspectRatio="none"/>
      <g class="tm-vec" mask="url(#tmm-${this.#uid})"><g class="tm-water">${vec(vectors.rivers, 'tm-river')}</g>
      <g class="tm-roads">${vec(roads, 'tm-road-casing', (r) => 'k-' + r.k)}${vec(roads, 'tm-road', (r) => 'k-' + r.k)}</g></g>
      <g class="tm-route"></g>`;
    this.#layers.route = this.#svg.querySelector('.tm-route');
    this.#onResize(true);
    this.#renderTowns();
    this.#host.dataset.ready = '1';
    this.#applyMarkers();
    if (this.#pendingFit) { const f = this.#pendingFit; this.#pendingFit = null; this.fitTo(f.ids, f.o); } else this.fitAll(false);
  }
  #pendingFit = null;

  /** Cập nhật kích thước khung khi đổi cỡ và giữ nguyên tâm. */
  #onResize(first) {
    const r = this.#host.getBoundingClientRect(); this.#size = { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    if (!this.#data) return;
    this.#minScale = MAP_CONST.MIN_SCALE;
    if (first) return;
    if (!this.#touched && this.#lastFit) this.fitTo(this.#lastFit.ids, Object.assign({}, this.#lastFit.o, { animate: false }));   // chưa ai kéo/phóng: vừa khung lại theo cỡ mới
    else { this.#apply(); this.#layout(); }
  }
  #touched = false; #lastFit = null;
  #minScale = 0.1;

  /** Đặt vùng nhìn thấy thật sự (ví dụ trừ phần tờ dưới che) để camera căn giữa đúng. */
  setInsets(inset) { this.#inset = Object.assign({ top: 0, right: 0, bottom: 0, left: 0 }, inset); }

  /** Danh sách ghim: [{id, lat, lon, label, num, thumb, muted, kind}]. */
  setMarkers(list) {
    this.#markers = list.map((m) => Object.assign({ p: null }, m));
    if (this.#data) this.#applyMarkers();
  }

  /** Chế độ: 'browse' (gộp cụm) hoặc 'route' (đánh số, không gộp). */
  setMode(mode) { this.#mode = mode; if (this.#data) this.#layout(); }

  /** Vẽ tuyến nối các ghim theo thứ tự id; nhãn khoảng cách tùy chọn theo từng đoạn. */
  setRoute(ids, labels) {
    this.#route = ids && ids.length > 1 ? { ids, labels: labels || [] } : null;
    if (this.#data) this.#drawRoute();
  }

  /** Chọn một ghim (phóng to nhẹ, vòng sáng). */
  select(id) {
    this.#selected = id;
    this.#markerEls.forEach((el, k) => el.classList.toggle('is-sel', k === id));
  }

  /** Vừa khung toàn bộ vùng dữ liệu. */
  fitAll(animate = true) { this.#flyTo(this.#data ? { cx: this.#data.meta.width / 2, cy: this.#data.meta.height / 2, s: this.#minScale } : this.#cam, animate); }

  /** Vừa khung các ghim theo id (bỏ trống = tất cả ghim). */
  fitTo(ids, o = {}) {
    this.#lastFit = { ids, o };
    if (!this.#data) { this.#pendingFit = { ids, o }; return; }
    const pts = this.#markers.filter((m) => !ids || ids.includes(m.id)).map((m) => m.p).filter(Boolean);
    if (!pts.length) { this.fitAll(o.animate !== false); return; }
    const pad = o.padding ?? MAP_CONST.FIT_PADDING, I = this.#inset;
    const vw = this.#size.w - I.left - I.right - pad * 2, vh = this.#size.h - I.top - I.bottom - pad * 2;
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const s = Math.min(MAP_CONST.MAX_SCALE * (o.maxZoomFactor ?? MAP_CONST.FIT_MAX_FACTOR), Math.max(this.#minScale, Math.min(vw / Math.max(MAP_CONST.FIT_MIN_SPAN, maxX - minX), vh / Math.max(MAP_CONST.FIT_MIN_SPAN, maxY - minY))));
    const cx = (minX + maxX) / 2 - (I.left - I.right) / 2 / s, cy = (minY + maxY) / 2 - (I.top - I.bottom) / 2 / s;
    this.#flyTo({ cx, cy, s }, o.animate !== false);
  }

  /** Bay camera tới trạng thái đích (có hoạt họa; giảm chuyển động thì nhảy luôn). */
  #flyTo(to, animate) {
    cancelAnimationFrame(this.#raf);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    to = this.#clamp(to);
    if (!animate || reduce || !this.#data) { this.#cam = to; this.#apply(); this.#layout(); return; }
    const from = Object.assign({}, this.#cam), t0 = performance.now(), ls = Math.log(from.s), le = Math.log(to.s);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / MAP_CONST.FLY_MS), e = mapEase(t);
      this.#cam = { cx: from.cx + (to.cx - from.cx) * e, cy: from.cy + (to.cy - from.cy) * e, s: Math.exp(ls + (le - ls) * e) };
      this.#apply();
      if (t < 1) this.#raf = requestAnimationFrame(step); else this.#layout();
    };
    this.#raf = requestAnimationFrame(step);
  }

  /** Giữ camera trong vùng dữ liệu và trong khoảng zoom cho phép. */
  #clamp(c) {
    if (!this.#data) return c;
    const s = Math.min(MAP_CONST.MAX_SCALE, Math.max(this.#minScale, c.s)), m = this.#data.meta;
    return { s, cx: Math.min(m.width, Math.max(0, c.cx)), cy: Math.min(m.height, Math.max(0, c.cy)) };
  }

  /** Áp camera lên SVG (viewBox) và dời ghim/nhãn tương ứng. */
  #apply() {
    const { cx, cy, s } = this.#cam, w = this.#size.w / s, h = this.#size.h / s;
    this.#svg.setAttribute('viewBox', `${cx - w / 2} ${cy - h / 2} ${w} ${h}`);
    this.#svg.style.setProperty('--k', String(1 / s));
    this.#vb = { x: cx - w / 2, y: cy - h / 2, w, h };
    this.#placeAll();
  }

  /** Toạ độ ảnh nền → toạ độ màn hình trong khung. */
  #toScreen(p) { const s = this.#cam.s; return [(p[0] - this.#cam.cx) * s + this.#size.w / 2, (p[1] - this.#cam.cy) * s + this.#size.h / 2]; }

  /** Dựng phần tử ghim từ danh sách (có hoạt họa rơi xuống lần đầu). */
  #applyMarkers() {
    const meta = this.#data.meta, keep = new Set();
    this.#markers.forEach((m, i) => {
      m.p = TerrainData.project(meta, m.lat, m.lon); keep.add(m.id);
      let el = this.#markerEls.get(m.id);
      if (!el) {
        el = document.createElement('button'); el.type = 'button'; el.className = 'tm-pin'; el.dataset.id = m.id;
        el.addEventListener('click', (e) => { e.stopPropagation(); this.#opt.onPin?.(m.id); });
        this.#layers.pins.appendChild(el); this.#markerEls.set(m.id, el);
      }
      el.style.setProperty('--i', String(i));
      el.className = `tm-pin${m.muted ? ' is-muted' : ''}${m.kind === 'hub' ? ' is-hub' : ''}${m.id === this.#selected ? ' is-sel' : ''}`;
      el.setAttribute('aria-label', (m.num != null ? `${m.num}. ` : '') + (m.label || m.id));
      el.innerHTML = `<span class="tm-pin-body">${m.thumb ? `<img alt="" src="${m.thumb}">` : ''}${m.num != null ? `<b>${m.num}</b>` : m.kind === 'hub' ? '<i class="tm-hub-dot"></i>' : ''}</span>`;
    });
    this.#markerEls.forEach((el, id) => { if (!keep.has(id)) { el.remove(); this.#markerEls.delete(id); } });
    this.#drawRoute(); this.#layout();
  }

  /** Vẽ tuyến: mỗi đoạn là một cung nhẹ, vẽ dần lần lượt; kèm chấm di chuyển và nhãn khoảng cách. */
  #drawRoute() {
    const g = this.#layers.route; if (!g) return; g.innerHTML = '';
    this.#layers.labels.querySelectorAll('.tm-seg-label').forEach((n) => n.remove());
    this.#segMids = [];
    if (!this.#route) return;
    const have = this.#route.ids.map((id, k) => ({ p: this.#markers.find((m) => m.id === id)?.p, k })).filter((x) => x.p), pts = have.map((x) => x.p);
    let d = '', all = '';
    pts.forEach((p, i) => {
      if (!i) { all = `M${p[0]} ${p[1]}`; return; }
      const q = pts[i - 1], dx = p[0] - q[0], dy = p[1] - q[1], len = Math.hypot(dx, dy) || 1, k = MAP_CONST.ARC_CURVE * len, mx = (p[0] + q[0]) / 2 - (dy / len) * k, my = (p[1] + q[1]) / 2 + (dx / len) * k;
      const seg = `M${q[0]} ${q[1]} Q${mx} ${my} ${p[0]} ${p[1]}`; all += ` Q${mx} ${my} ${p[0]} ${p[1]}`;
      d += `<path class="tm-seg-halo" d="${seg}" pathLength="1"/><path class="tm-seg" d="${seg}" pathLength="1" style="--d:${i * 0.45}s"/>`;
      this.#segMids.push({ x: 0.25 * q[0] + 0.5 * mx + 0.25 * p[0], y: 0.25 * q[1] + 0.5 * my + 0.25 * p[1], i });
    });
    g.innerHTML = d + (pts.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? `<circle class="tm-dot" r="1"><animateMotion dur="${Math.max(4, pts.length * 2.2)}s" repeatCount="indefinite" path="${all}" begin="${pts.length * 0.45}s"/></circle>` : '');
    have.forEach((x, i) => {   // nhãn của đoạn kết thúc ở ghim thứ k nằm ở labels[k - 1]
      const txt = i ? (this.#route.labels || [])[x.k - 1] : ''; if (!txt) return;
      const el = document.createElement('span'); el.className = 'tm-seg-label'; el.dataset.i = String(i); el.textContent = txt; this.#layers.labels.appendChild(el);
    });
    this.#placeAll();
  }
  #segMids = [];

  /** Tên các thị trấn nền (mờ, chỉ khi phóng đủ và không đè ghim). */
  #renderTowns() {
    this.#towns = (this.#opt.towns ? this.#data.vectors.places.filter((p) => p.k === 'city' || p.k === 'town') : []).map((p) => {
      const el = document.createElement('span'); el.className = 'tm-town'; el.textContent = p.n; this.#layers.labels.appendChild(el); return { el, p: p.p };
    });
  }
  #towns = [];

  /** Dời mọi phần tử HTML theo camera (gọi mỗi khung hình khi bay/kéo). */
  #placeAll() {
    this.#markers.forEach((m) => {
      const el = this.#markerEls.get(m.id); if (!el || !m.p) return;
      const [x, y] = this.#toScreen(m.p); el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    this.#clusterEls.forEach((c) => { const [x, y] = this.#toScreen(c.p); c.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; });
    this.#towns.forEach((t) => { const [x, y] = this.#toScreen(t.p); t.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; });
    this.#segMids.forEach((m) => { const el = this.#layers.labels.querySelector(`.tm-seg-label[data-i="${m.i}"]`); if (!el) return; const [x, y] = this.#toScreen([m.x, m.y]); el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; });
  }

  /** Sau khi camera dừng: gộp cụm, đặt nhãn không chồng, ẩn/hiện tên thị trấn. */
  #layout() {
    if (!this.#data) return;
    this.#placeAll();
    // 1) gộp cụm (chỉ chế độ duyệt)
    this.#clusterEls.forEach((c) => c.el.remove()); this.#clusterEls = [];
    const shown = new Map(this.#markers.filter((m) => m.p).map((m) => [m.id, true]));
    if (this.#mode === 'browse') {
      const left = this.#markers.filter((m) => m.p && m.kind !== 'hub').map((m) => ({ m, s: this.#toScreen(m.p) })), used = new Set();
      left.forEach((a) => {
        if (used.has(a.m.id)) return;
        const group = left.filter((b) => !used.has(b.m.id) && Math.hypot(a.s[0] - b.s[0], a.s[1] - b.s[1]) < MAP_CONST.CLUSTER_PX);
        if (group.length < 2) return;
        group.forEach((b) => { used.add(b.m.id); shown.set(b.m.id, false); });
        const p = [group.reduce((t, b) => t + b.m.p[0], 0) / group.length, group.reduce((t, b) => t + b.m.p[1], 0) / group.length];
        const el = document.createElement('button'); el.type = 'button'; el.className = 'tm-cluster'; el.setAttribute('aria-label', `${group.length} ${MAP_CONST.TEXT.CLUSTER}`); el.innerHTML = `<b>${group.length}</b>`;
        el.addEventListener('click', (e) => { e.stopPropagation(); this.fitTo(group.map((b) => b.m.id), { padding: 60 }); });
        this.#layers.pins.appendChild(el); this.#clusterEls.push({ el, p });
      });
    }
    this.#markerEls.forEach((el, id) => el.classList.toggle('is-hidden', shown.get(id) === false));
    this.#placeAll();
    // 2) nhãn ghim không chồng nhau
    this.#layers.labels.querySelectorAll('.tm-pin-label').forEach((n) => n.remove());
    const boxes = [], pinBoxes = this.#markers.filter((m) => m.p && shown.get(m.id)).map((m) => { const [x, y] = this.#toScreen(m.p); return [x - MAP_CONST.PIN_HALF, y - MAP_CONST.PIN_HALF, MAP_CONST.PIN_HALF * 2, MAP_CONST.PIN_HALF * 2]; });
    this.#clusterEls.forEach((c) => { const [x, y] = this.#toScreen(c.p); pinBoxes.push([x - MAP_CONST.CLUSTER_HALF, y - MAP_CONST.CLUSTER_HALF, MAP_CONST.CLUSTER_HALF * 2, MAP_CONST.CLUSTER_HALF * 2]); });
    const order = this.#markers.filter((m) => m.p && shown.get(m.id) && m.label && (!m.muted || m.id === this.#selected)).sort((a, b) => (b.id === this.#selected) - (a.id === this.#selected) || (a.muted ? 1 : 0) - (b.muted ? 1 : 0));
    order.forEach((m) => {
      const el = document.createElement('span'); el.className = 'tm-pin-label' + (m.muted ? ' is-muted' : ''); el.textContent = m.label; this.#layers.labels.appendChild(el);
      const [x, y] = this.#toScreen(m.p), w = el.offsetWidth, h = el.offsetHeight, gap = MAP_CONST.LABEL_GAP;
      const tries = [[x + MAP_CONST.LABEL_X, y - h / 2], [x - MAP_CONST.LABEL_X - w, y - h / 2], [x - w / 2, y + MAP_CONST.LABEL_Y], [x - w / 2, y - MAP_CONST.LABEL_Y - h]], E = MAP_CONST.EDGE_PAD;
      const ok = tries.find(([bx, by]) => bx > E && by > E && bx + w < this.#size.w - E && by + h < this.#size.h - E && ![...boxes, ...pinBoxes].some(([ox, oy, ow, oh]) => bx < ox + ow + gap && bx + w + gap > ox && by < oy + oh + gap && by + h + gap > oy));
      if (!ok) { el.remove(); return; }
      el.style.transform = `translate3d(${ok[0].toFixed(1)}px, ${ok[1].toFixed(1)}px, 0)`; boxes.push([ok[0], ok[1], w, h]);
    });
    // 3) tên thị trấn nền
    this.#towns.forEach((t) => {
      const [x, y] = this.#toScreen(t.p), near = [...pinBoxes, ...boxes].some(([ox, oy, ow, oh]) => x > ox - MAP_CONST.TOWN_NEAR_X && x < ox + ow + MAP_CONST.TOWN_NEAR_X && y > oy - MAP_CONST.TOWN_NEAR_Y && y < oy + oh + MAP_CONST.TOWN_NEAR_Y);
      t.el.classList.toggle('is-on', this.#cam.s >= MAP_CONST.TOWN_MIN_SCALE && !near);
    });
  }

  /** Nút +/−/căn lại và cử chỉ kéo, chụm, lăn chuột, chạm đúp. */
  #buildControls() {
    this.#host.tabIndex = 0;
    this.#host.addEventListener('keydown', (e) => {   // phím mũi tên dịch bản đồ, + và − phóng/thu
      if (e.target !== this.#host) return;
      const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (k) { e.preventDefault(); this.#touched = true; this.#flyTo({ cx: this.#cam.cx + k[0] * MAP_CONST.PAN_STEP / this.#cam.s, cy: this.#cam.cy + k[1] * MAP_CONST.PAN_STEP / this.#cam.s, s: this.#cam.s }, false); }
      else if (e.key === '+' || e.key === '=') this.#zoomBy(MAP_CONST.ZOOM_STEP, null, true);
      else if (e.key === '-') this.#zoomBy(1 / MAP_CONST.ZOOM_STEP, null, true);
    });
    this.#host.insertAdjacentHTML('beforeend', `<div class="tm-ctl"><button type="button" data-z="in" aria-label="${MAP_CONST.TEXT.ZOOM_IN}">+</button><button type="button" data-z="out" aria-label="${MAP_CONST.TEXT.ZOOM_OUT}">−</button></div>`);
    this.#host.querySelector('.tm-ctl').addEventListener('click', (e) => { const b = e.target.closest('[data-z]'); if (b) this.#zoomBy(b.dataset.z === 'in' ? MAP_CONST.ZOOM_STEP : 1 / MAP_CONST.ZOOM_STEP, null, true); });
    const h = this.#host;
    h.addEventListener('pointerdown', (e) => { if (e.target.closest('.tm-pin, .tm-cluster, .tm-ctl')) return; h.setPointerCapture(e.pointerId); this.#pointers.set(e.pointerId, [e.clientX, e.clientY]); this.#touched = true; this.#drag = { moved: 0, pinch: null }; cancelAnimationFrame(this.#raf); });
    h.addEventListener('pointermove', (e) => {
      if (!this.#pointers.has(e.pointerId)) return;
      const prev = this.#pointers.get(e.pointerId); this.#pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (this.#pointers.size === 1) {
        const dx = e.clientX - prev[0], dy = e.clientY - prev[1]; this.#drag.moved += Math.abs(dx) + Math.abs(dy);
        this.#cam = this.#clamp({ cx: this.#cam.cx - dx / this.#cam.s, cy: this.#cam.cy - dy / this.#cam.s, s: this.#cam.s }); this.#apply();
      } else if (this.#pointers.size === 2) {
        const [a, b] = [...this.#pointers.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (this.#drag.pinch) this.#zoomBy(d / this.#drag.pinch, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], false);
        this.#drag.pinch = d;
      }
    });
    const up = (e) => { this.#pointers.delete(e.pointerId); if (!this.#pointers.size && this.#drag) { this.#drag = null; this.#layout(); } };
    h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    h.addEventListener('wheel', (e) => { e.preventDefault(); this.#zoomBy(Math.exp(-e.deltaY * MAP_CONST.WHEEL_SENS), [e.clientX, e.clientY], false); clearTimeout(this.#wheelT); this.#wheelT = setTimeout(() => this.#layout(), 140); }, { passive: false });
    h.addEventListener('dblclick', (e) => { if (!e.target.closest('.tm-pin, .tm-cluster, .tm-ctl')) this.#zoomBy(MAP_CONST.ZOOM_STEP, [e.clientX, e.clientY], true); });
  }
  #wheelT = 0;

  /** Phóng/thu quanh một điểm màn hình (clientX/Y) hoặc quanh tâm. */
  #zoomBy(f, client, animate) {
    const r = this.#host.getBoundingClientRect(), px = client ? client[0] - r.left : this.#size.w / 2, py = client ? client[1] - r.top : this.#size.h / 2;
    const s = Math.min(MAP_CONST.MAX_SCALE, Math.max(this.#minScale, this.#cam.s * f)), k = this.#cam.s / s;
    const cx = this.#cam.cx + (px - this.#size.w / 2) / this.#cam.s * (1 - k), cy = this.#cam.cy + (py - this.#size.h / 2) / this.#cam.s * (1 - k);
    this.#flyTo({ cx, cy, s }, animate);
  }
}

window.TerrainMap = TerrainMap;
window.TerrainData = TerrainData;
