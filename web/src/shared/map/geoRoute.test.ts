import test from 'node:test';
import assert from 'node:assert/strict';
import { arcBetween, routeArcs } from './geoRoute.ts';

const DALAT: readonly [number, number] = [108.44, 11.94];
const NHATRANG: readonly [number, number] = [109.19, 12.24];

test('cung nối hai điểm: bắt đầu và kết thúc đúng tại hai điểm', () => {
  const { line } = arcBetween(DALAT, NHATRANG);
  assert.deepEqual(line[0], DALAT);
  const last = line[line.length - 1];
  assert.ok(last && Math.abs(last[0] - NHATRANG[0]) < 1e-9 && Math.abs(last[1] - NHATRANG[1]) < 1e-9);
});

test('cung cong nhẹ: điểm giữa lệch khỏi đường thẳng nối hai điểm nhưng vẫn gần nó', () => {
  const { mid } = arcBetween(DALAT, NHATRANG);
  const chordMid = [(DALAT[0] + NHATRANG[0]) / 2, (DALAT[1] + NHATRANG[1]) / 2];
  const offset = Math.hypot(mid[0] - (chordMid[0] ?? 0), mid[1] - (chordMid[1] ?? 0));
  assert.ok(offset > 0.01, 'có độ cong');
  assert.ok(offset < 0.2, 'không cong quá mức (độ lệch dưới 0,2 độ cho đoạn ~80 km)');
});

test('hai điểm trùng nhau không làm hàm lỗi (không chia cho 0)', () => {
  const { line, mid } = arcBetween(DALAT, DALAT);
  assert.ok(line.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
  assert.ok(Number.isFinite(mid[0]) && Number.isFinite(mid[1]));
});

test('tuyến n điểm có n-1 cung và n-1 điểm giữa; ít hơn hai điểm thì rỗng', () => {
  const r = routeArcs([DALAT, NHATRANG, [109.34, 12.0]]);
  assert.equal(r.lines.length, 2);
  assert.equal(r.mids.length, 2);
  assert.deepEqual(routeArcs([DALAT]), { lines: [], mids: [] });
});
