import test from 'node:test';
import assert from 'node:assert/strict';
import { fitMaxZoom, fitPadding } from './geoMapPolicy.ts';
import type { Pt } from './map.types.ts';

test('một/cặp ghim gần được nhìn rõ hơn nhưng khoảng xa và cụm giữ trần riêng', () => {
  const a: Pt = [108.44, 11.94];
  assert.equal(fitMaxZoom({}, [a]), 16);
  assert.equal(fitMaxZoom({}, [a, a]), 17);
  assert.equal(fitMaxZoom({}, [a, [108.441, 11.94]]), 17);
  assert.equal(fitMaxZoom({}, [a, [108.45, 11.94]]), 16);
  assert.equal(fitMaxZoom({}, [a, [108.48, 11.94]]), 15);
  assert.equal(fitMaxZoom({}, [a, [109, 12]]), 14);
  assert.equal(fitMaxZoom({}, [a, a, a]), 14);
  assert.equal(fitMaxZoom({ maxZoom: 13 }, [a, a]), 13);
  assert.equal(fitMaxZoom({ maxZoom: 99 }, [a]), 17);
});

test('lề khung 390×240 chừa >=24px, đủ tên dưới ghim, cộng inset và ghi công', () => {
  const size = { w: 390, h: 240 };
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  assert.deepEqual(fitPadding(size, inset), { top: 24, right: 56, bottom: 56, left: 56 });
  assert.deepEqual(fitPadding(size, { ...inset, bottom: 10 }, 24, true), { top: 24, right: 56, bottom: 110, left: 56 });
  const tiny = fitPadding({ w: 20, h: 10 }, { top: 200, right: 300, bottom: 400, left: 500 });
  assert.ok(tiny.left + tiny.right < 20 && tiny.top + tiny.bottom < 10);
});

test('tờ đáy che 60% khung: lề đáy không bị kẹp ở nửa khung nên camera vừa khung trong phần bản đồ còn thấy', () => {
  const phone = { w: 390, h: 844 };
  const padding = fitPadding(phone, { top: 72, right: 0, bottom: 506, left: 0 }, 56, true);
  assert.ok(padding.bottom > phone.h / 2, 'lề đáy phải vượt nửa khung để né tờ đáy');
  assert.ok(padding.top + padding.bottom < phone.h, 'vẫn còn vùng nhìn dương');
  assert.equal(padding.top, 128);
});

test('lề quá lớn co theo tỉ lệ, giữ nguyên thứ tự lớn nhỏ giữa hai lề đối diện', () => {
  const p = fitPadding({ w: 100, h: 100 }, { top: 100, right: 0, bottom: 300, left: 0 }, 0);
  assert.ok(p.top < p.bottom && p.top + p.bottom < 100);
});
