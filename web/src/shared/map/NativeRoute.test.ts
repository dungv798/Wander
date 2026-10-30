import test from 'node:test';
import assert from 'node:assert/strict';
import type { Map as MlMap } from 'maplibre-gl';
import { NativeRoute } from './NativeRoute.ts';
import { MAP } from './map.const.ts';
import { ROUTE } from './route.const.ts';

/** Khung DOM/GL tối thiểu để kiểm hiệu ứng hữu hạn và cùng callback bàn phím/native. */
function fixture(t: test.TestContext) {
  const originals = new Map(['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame'].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  let reduced = false, serial = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const items: Element[] = [];
  class Element extends EventTarget {
    dataset: Record<string, string> = {};
    textContent = '';
    appendChild(child: Element) { items.push(child); }
    remove() { const index = items.indexOf(this); if (index >= 0) items.splice(index, 1); }
  }
  Object.defineProperties(globalThis, {
    window: { configurable: true, value: { matchMedia: () => ({ matches: reduced }) } },
    document: { configurable: true, value: { createElement: () => new Element() } },
    requestAnimationFrame: { configurable: true, value: (callback: FrameRequestCallback) => { frames.set(++serial, callback); return serial; } },
    cancelAnimationFrame: { configurable: true, value: (id: number) => frames.delete(id) },
  });
  t.after(() => originals.forEach((descriptor, name) => { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else Reflect.deleteProperty(globalThis, name); }));
  const host = { dataset: {} as Record<string, string>, querySelector: () => new Element() };
  const updates = new Map<string, { features: { geometry: { coordinates: number[][] } }[] }[]>();
  let hits: { properties: { id: string } }[] = [];
  const map = {
    getSource: (id: string) => ({ setData: (value: { features: { geometry: { coordinates: number[][] } }[] }) => { updates.set(id, [...updates.get(id) ?? [], value]); } }),
    getLayer: () => ({}), queryRenderedFeatures: () => hits,
    project: (point: [number, number]) => ({ x: point[0], y: point[1] }),
  };
  const route = new NativeRoute(host as unknown as HTMLElement);
  Object.assign(route, { map: map as unknown as MlMap });
  return { route, host, updates, frames, items, setReduced: (value: boolean) => { reduced = value; }, setHits: (value: typeof hits) => { hits = value; } };
}
const markers = [{ id: 'a', label: 'Hồ', lat: 12, lon: 108 }, { id: 'b', label: 'Đồi', lat: 12.1, lon: 108.2 }];

test('vẽ chỉ lần đầu mỗi tab, hit luôn đầy đủ; quay lại tab không chạy lại và hủy không để frame sống', (t) => {
  const f = fixture(t);
  const day = { ids: ['a', 'b'], labels: [], viewKey: 'day-1' };
  f.route.update(day, markers, () => undefined);
  assert.equal(f.frames.size, 1);
  const full = f.updates.get(ROUTE.HIT_LAYER)!.at(-1)!;
  const partial = f.updates.get(MAP.ROUTE_SOURCE_ID)!.at(-1)!;
  assert.ok(full.features[0]!.geometry.coordinates.length > partial.features[0]!.geometry.coordinates.length);
  f.route.update({ ...day, viewKey: 'day-2' }, markers);
  assert.equal(f.frames.size, 1, 'đổi tab hủy hiệu ứng cũ');
  f.route.update(day, markers);
  assert.equal(f.frames.size, 0, 'tab đã mở không vẽ lại');
  f.route.update({ ...day, viewKey: 'day-3' }, markers);
  assert.equal(f.frames.size, 1);
  f.route.destroy();
  assert.equal(f.frames.size, 0);
});

test('giảm chuyển động bỏ hiệu ứng, nút đoạn và chạm native mở cùng mã và snapshot chỉ đọc tọa độ', (t) => {
  const f = fixture(t);
  f.setReduced(true);
  const opened: string[] = [];
  f.route.update({ ids: ['a', 'b'], labels: [], viewKey: 'day-1' }, markers, (id) => opened.push(id));
  assert.equal(f.frames.size, 0);
  const button = f.items[0]!;
  assert.match(button.textContent, /^Đoạn 1: Hồ → Đồi, ~\d+ km$/);
  button.dispatchEvent(new Event('click'));
  f.setHits([{ properties: { id: opened[0]! } }]);
  assert.equal(f.route.hit({ x: 108.1, y: 12.05 }), true);
  assert.deepEqual(opened, [opened[0], opened[0]]);
  f.setHits([]);
  assert.equal(f.route.hit({ x: 0, y: 0 }), false);
  f.route.snapshot();
  const snapshot = JSON.parse(f.host.dataset['segments']!);
  assert.equal(snapshot[0].from, 'a');
  assert.deepEqual(snapshot[0].points[0], { x: 108, y: 12 });
});

test('nhãn công khai không bị thay bằng phép tính khác; thiếu ghim giữ đúng nhãn đoạn còn lại', (t) => {
  const f = fixture(t); f.setReduced(true);
  f.route.update({ ids: ['a', 'missing', 'b', 'a'], labels: ['bỏ', 'bỏ', 'nhãn đã cấp'] }, markers);
  assert.deepEqual(f.route.labels().labels, ['nhãn đã cấp']);
});
