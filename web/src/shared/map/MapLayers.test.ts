import test from 'node:test';
import assert from 'node:assert/strict';
import { MapLayers } from './MapLayers.ts';
import { MAP } from './map.const.ts';
import type { Pt } from './map.types.ts';

/** DOM tối thiểu để kiểm hành vi nút thay thế canvas bằng bàn phím/click mà không cần dependency. */
class Element extends EventTarget {
  dataset: Record<string, string> = {};
  attrs = new Map<string, string>();
  children: Element[] = [];
  parentElement?: Element;
  textContent = '';
  disabled = false;
  hidden = false;
  appendChild(child: Element) { this.children.push(child); child.parentElement = this; return child; }
  append(...children: Element[]) { children.forEach((child) => this.appendChild(child)); }
  setAttribute(key: string, value: string) { this.attrs.set(key, value); }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); }
}

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
