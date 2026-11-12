import test from 'node:test';
import assert from 'node:assert/strict';
import type { Map as MlMap } from 'maplibre-gl';
import { showBasemapError } from './geoMapErrors.ts';

test('lỗi nền liên tiếp chỉ hiện một cảnh báo; thử lại giữ nguyên kiểu chứa tuyến', (t) => {
  const notices: unknown[] = [];
  let click: (() => void) | undefined;
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    /** Builds a minimal element to check the warning and the retry button without a browser. */
    createElement() {
      return {
        /** Records a polite notice region that does not take the pin's focus. */
        setAttribute(name: string, value: string) { assert.equal(name, 'role'); assert.equal(value, 'status'); },
        /** Records the retry action instead of triggering it by itself while an error is shown. */
        addEventListener(_event: string, callback: () => void) { click = callback; },
        /** Accepts the notice content and the button that are put together into the box. */
        append() {},
        /** Simulates removing the box before reloading so the next error can be reported again. */
        remove() { notices.pop(); },
      };
    },
  } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  });
  const host = {
    /** Returns the warning currently shown to prevent duplicate reports. */
    querySelector() { return notices[0]; },
    /** Records the number of warnings currently shown on the map. */
    appendChild(node: unknown) { notices.push(node); },
  } as unknown as HTMLElement;
  const style = { sources: { 'wander-route': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } } } };
  let reloads = 0;
  const map = {
    /** Keeps the route source too when the base style reloads. */
    getStyle() { return style; },
    /** Checks that the source is reloaded instead of creating a new camera/map. */
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
