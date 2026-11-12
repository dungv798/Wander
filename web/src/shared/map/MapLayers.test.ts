import test from 'node:test';
import assert from 'node:assert/strict';
import { MapLayers } from './MapLayers.ts';
import { MAP } from './map.const.ts';
import type { Pt } from './map.types.ts';
import { markerFeatures, markerThumbnail } from './nativeMarkers.ts';
import { PIN_ENTRANCE } from './pinEntrance.const.ts';

/** A minimal DOM to check the behavior of the button that replaces the canvas by keyboard/click without a dependency. */
class Element extends EventTarget {
  dataset: Record<string, string> = {};
  attrs = new Map<string, string>();
  children: Element[] = [];
  parentElement?: Element;
  textContent = '';
  disabled = false;
  hidden = false;
  focused = false;
  focus() { this.focused = true; }
  click() { this.dispatchEvent(new Event('click')); }
  insertBefore(child: Element, before: Element | null) { child.remove(); const index = before ? this.children.indexOf(before) : this.children.length; this.children.splice(index, 0, child); child.parentElement = this; return child; }
  appendChild(child: Element) { this.children.push(child); child.parentElement = this; return child; }
  append(...children: Element[]) { children.forEach((child) => this.appendChild(child)); }
  setAttribute(key: string, value: string) { this.attrs.set(key, value); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); }
}

test('chỉ yêu cầu quay mới thêm dần native feature; đổi dữ liệu hủy frame và reduced-motion hiện đủ ngay', (t) => {
  const names = ['document', 'window', 'location', 'requestAnimationFrame', 'cancelAnimationFrame'];
  const originals = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const frames = new Map<number, FrameRequestCallback>();
  let serial = 0, reduced = false;
  Object.defineProperties(globalThis, {
    document: { configurable: true, value: { createElement: () => new Element() } },
    window: { configurable: true, value: { matchMedia: () => ({ matches: reduced }) } },
    location: { configurable: true, value: { search: '' } },
    requestAnimationFrame: { configurable: true, value: (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; } },
    cancelAnimationFrame: { configurable: true, value: (id: number) => frames.delete(id) },
  });
  t.after(() => originals.forEach((descriptor, name) => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }));
  const counts: number[] = [];
  const host = new Element();
  const layers = new MapLayers(host as unknown as HTMLElement);
  Object.assign(layers, { map: { getSource: () => ({ setData: (data: { features: unknown[] }) => counts.push(data.features.length) }), setFilter: () => {}, setFeatureState: () => {} } });
  const markers = [0, 1, 2, 3, 4].map(i => ({ id: String(i), lat: 12 + i, lon: 108 }));
  layers.syncMarkers(markers, 'route', null);
  host.dispatchEvent(new Event(PIN_ENTRANCE.event));
  assert.equal(frames.size, 0, 'ghim thường không đăng ký hiệu ứng');
  assert.equal(counts.at(-1), 5);
  location.search = '?entrance=stagger';
  layers.syncMarkers(markers, 'route', null);
  host.dispatchEvent(new Event(PIN_ENTRANCE.event));
  assert.equal(counts.at(-1), 0);
  for (const [time, expected] of [[0, 1], [240, 2], [480, 3]]) {
    const tick = [...frames.values()][0]!; frames.clear(); tick(time!);
    assert.equal(counts.at(-1), expected);
  }
  layers.syncMarkers(markers.slice(0, 2), 'route', null);
  assert.equal(frames.size, 0, 'thay dữ liệu hủy lượt quay cũ');
  assert.equal(counts.at(-1), 2);
  reduced = true;
  counts.length = 0;
  host.dispatchEvent(new Event(PIN_ENTRANCE.event));
  assert.equal(frames.size, 0);
  assert.deepEqual(counts, [0, 2], 'nguồn cụm trống ở mode route; nguồn ghim hiện đủ ngay, không chớp rỗng');
  layers.destroy();
});

test('danh sách ghim có nút mang tên/số, giữ nút khi cập nhật và gọi cùng callback native', () => {
  const before = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => new Element() } });
  try {
    const host = new Element();
    const layers = new MapLayers(host as unknown as HTMLElement);
    const source = { setData: () => undefined };
    Object.assign(layers, { map: { getSource: () => source, setFilter: () => undefined, setFeatureState: () => undefined } });
    const opened: string[] = [];
    const markers = [{ id: 'lake', lat: 12, lon: 108, label: 'Hồ', num: 1 }];
    layers.syncMarkers(markers, 'route', 'lake', (id) => opened.push(id));
    const list = host.children[1]!;
    const button = list.children[0]!.children[0]!;
    assert.equal(list.hidden, false);
    assert.equal(list.attrs.get('aria-label'), 'Địa điểm trên bản đồ');
    assert.equal(button.textContent, '1. Hồ');
    assert.equal(button.disabled, false);
    assert.equal(button.attrs.get('aria-pressed'), 'true');
    button.dispatchEvent(new Event('click'));
    assert.deepEqual(opened, ['lake']);
    layers.syncMarkers([{ ...markers[0]!, num: 2 }], 'route', null, (id) => opened.push(id));
    assert.equal(list.children[0]!.children[0], button, 'cập nhật không làm mất phần tử đang focus');
    assert.equal(button.textContent, '2. Hồ');
    layers.syncMarkers([], 'browse', null);
    assert.equal(list.children.length, 0);
    assert.equal(list.hidden, true, 'map chỉ xem không thêm điểm dừng Tab');
  } finally {
    if (before) Object.defineProperty(globalThis, 'document', before);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});

test('move chỉ dời nhãn khoảng cách tuyến, không chiếu ghim hoặc nhãn tên', () => {
  const label = { style: { transform: '' } };
  const layers = Object.create(MapLayers.prototype) as MapLayers;
  Object.assign(layers, { segMids: [{ el: label, p: [108, 12] }] });
  let calls = 0;
  layers.place((): Pt => { calls++; return [200, 300]; });
  assert.equal(label.style.transform, 'translate3d(200.0px, 300.0px, 0)');
  assert.equal(calls, 1);
});

test('thử lại nền khôi phục ảnh đã cắt mà không tải lại URL; destroy chặn khôi phục', () => {
  const layers = Object.create(MapLayers.prototype) as MapLayers;
  const image = { width: 96, height: 96 };
  const restored: string[] = [];
  Object.assign(layers, { images: new Map([['/photo.jpg', image]]), map: {
    getSource: () => ({}), hasImage: (id: string) => id === MAP.EMPTY_IMAGE,
    addImage: (id: string, data: unknown, options: unknown) => {
      assert.equal(data, image);
      assert.deepEqual(options, { pixelRatio: 96 / 44 });
      restored.push(id);
    },
  } });
  layers.restore();
  assert.deepEqual(restored, ['/photo.jpg']);
  layers.destroy();
  layers.restore();
  assert.equal(restored.length, 1);
});

test('cụm dùng zoom native kẹp 17, đánh dấu camera do người dùng; kết quả cũ không đổi camera', async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { matchMedia: () => ({ matches: true }) } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original);
    else Reflect.deleteProperty(globalThis, 'window');
  });
  const layers = Object.create(MapLayers.prototype) as MapLayers;
  const calls: unknown[] = [];
  let touched = 0;
  const source = { getClusterExpansionZoom: async () => 99 };
  Object.assign(layers, { revision: 0, onCluster: () => touched++, map: {
    getSource: () => source, easeTo: (options: unknown) => calls.push(options),
  } });
  const native = layers as unknown as { expandCluster: (id: number, center: [number, number]) => Promise<void> };
  await native.expandCluster(7, [108, 12]);
  assert.deepEqual(calls, [{ center: [108, 12], zoom: 17, duration: 0 }]);
  assert.equal(touched, 1);
  let resolveZoom!: (zoom: number) => void;
  source.getClusterExpansionZoom = () => new Promise<number>((resolve) => { resolveZoom = resolve; });
  const pending = native.expandCluster(7, [109, 13]);
  Object.assign(layers, { revision: 1 });
  resolveZoom(15);
  await pending;
  assert.equal(calls.length, 1, 'nguồn đã đổi thì bỏ kết quả worker cũ');
  assert.equal(touched, 1);
});

test('URL có đường dẫn/truy vấn được addImage bằng đúng ID trong GeoJSON, bitmap 96 px hiển thị 44 px', async (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const bitmap = { width: 96, height: 96 };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    createElement: () => ({ getContext: () => ({ beginPath() {}, arc() {}, clip() {}, drawImage() {}, getImageData: () => bitmap }) }),
  } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  const marker = { id: 'lake', lat: 12, lon: 108, thumb: ' /catalog/photos/lake.jpg?size=96&crop=1 ' };
  const feature = markerFeatures([marker], 'browse', true).features[0]!;
  const registered: string[] = [];
  const layers = Object.create(MapLayers.prototype) as MapLayers;
  Object.assign(layers, { images: new Map(), loading: new Set(), host: { dataset: {} }, map: {
    loadImage: async (url: string) => {
      assert.equal(url, feature.properties?.['image']);
      return { data: { width: 192, height: 96 } };
    },
    addImage: (id: string, image: unknown, options: unknown) => {
      assert.equal(image, bitmap);
      assert.deepEqual(options, { pixelRatio: 96 / 44 });
      registered.push(id);
    },
  } });
  await (layers as unknown as { loadThumbnail: (url: string) => Promise<void> }).loadThumbnail(markerThumbnail(marker));
  assert.deepEqual(registered, [feature.properties?.['image']]);
});

test('↑/↓ đi theo thứ tự mới, giữ nút và mở đúng ghim, không tự đổi thứ tự dữ liệu', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => new Element() } });
  try {
    const host = new Element(), layers = new MapLayers(host as unknown as HTMLElement);
    Object.assign(layers, { map: { getSource: () => ({ setData() {} }), setFilter() {}, setFeatureState() {} } });
    const opened: string[] = [];
    const a = { id: 'a', label: 'Hồ', lat: 12, lon: 108 }, b = { id: 'b', label: 'Đồi', lat: 13, lon: 109 };
    layers.syncMarkers([a, b], 'route', null, (id) => opened.push(id));
    const list = host.children[1]!, buttonA = list.children[0]!.children[0]!;
    layers.syncMarkers([b, a], 'route', null, (id) => opened.push(id));
    assert.equal(list.children[1]!.children[0], buttonA);
    const up = new Event('keydown', { cancelable: true });
    Object.defineProperties(up, { key: { value: 'ArrowUp' }, target: { value: buttonA } });
    list.dispatchEvent(up);
    assert.equal(up.defaultPrevented, true);
    assert.deepEqual(opened, ['b']);
    assert.equal(list.children[0]!.children[0]!.focused, true);
    assert.deepEqual(list.children.map((item) => item.children[0]!.dataset['id']), ['b', 'a']);
  } finally { if (original) Object.defineProperty(globalThis, 'document', original); else Reflect.deleteProperty(globalThis, 'document'); }
});
