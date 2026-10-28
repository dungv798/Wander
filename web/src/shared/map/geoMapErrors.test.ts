import test from 'node:test';
import assert from 'node:assert/strict';
import type { Map as MlMap } from 'maplibre-gl';
import { showBasemapError } from './geoMapErrors.ts';

test('lỗi nền liên tiếp chỉ hiện một cảnh báo; thử lại giữ nguyên kiểu chứa tuyến', (t) => {
  const notices: unknown[] = [];
  let click: (() => void) | undefined;
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    /** Dựng phần tử tối thiểu để kiểm tra cảnh báo và nút thử lại không cần trình duyệt. */
    createElement() {
      return {
        /** Ghi nhận vùng thông báo lịch sự, không giành focus của ghim. */
        setAttribute(name: string, value: string) { assert.equal(name, 'role'); assert.equal(value, 'status'); },
        /** Ghi nhận thao tác thử lại thay vì tự kích hoạt trong lúc báo lỗi. */
        addEventListener(_event: string, callback: () => void) { click = callback; },
        /** Chấp nhận nội dung thông báo và nút được ghép vào hộp. */
        append() {},
        /** Mô phỏng gỡ hộp trước khi tải lại để lần lỗi sau có thể báo tiếp. */
        remove() { notices.pop(); },
      };
    },
  } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  const host = {
    /** Trả cảnh báo hiện có để chống báo lặp. */
    querySelector() { return notices[0]; },
    /** Ghi lại số cảnh báo đang hiện trên bản đồ. */
    appendChild(node: unknown) { notices.push(node); },
  } as unknown as HTMLElement;
  const style = { sources: { 'wander-route': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } } };
  let reloads = 0;
  const map = {
    /** Giữ cả nguồn tuyến khi tải lại kiểu nền. */
    getStyle() { return style; },
    /** Kiểm tra nạp lại nguồn thay vì khởi tạo camera/bản đồ mới. */
    setStyle(next: unknown, options: unknown) { assert.equal(next, style); assert.deepEqual(options, { diff: false }); reloads++; },
  } as unknown as MlMap;
  showBasemapError(map, host, { sourceId: 'openmaptiles' });
  showBasemapError(map, host, { sourceId: 'openmaptiles' });
  assert.equal(notices.length, 1);
  assert.equal(reloads, 0);
  assert.ok(click);
  click();
  assert.equal(reloads, 1);
  assert.equal(notices.length, 0);
  showBasemapError(map, host, { sourceId: 'openmaptiles' });
  assert.equal(notices.length, 1);
});
