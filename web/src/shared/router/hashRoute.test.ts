import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHash, toHash } from './hashRoute.ts';

test('địa chỉ trống hoặc lạ về Khám phá', () => {
  assert.deepEqual(parseHash(''), { view: 'explore', id: null, sub: null });
  assert.deepEqual(parseHash('#/khong-co'), { view: 'explore', id: null, sub: null });
});

test('màn có mã điểm đến', () => {
  assert.deepEqual(parseHash('#/dest/ha-giang'), { view: 'dest', id: 'ha-giang', sub: null });
  assert.deepEqual(parseHash('#/deck'), { view: 'deck', id: 'ha-giang', sub: null });
  assert.deepEqual(parseHash('#/picked'), { view: 'picked', id: null, sub: null });
});

test('toHash và parseHash đối xứng', () => {
  assert.equal(toHash('explore'), '#/');
  assert.equal(toHash('dest', 'ha-giang'), '#/dest/ha-giang');
  assert.deepEqual(parseHash(toHash('deck', 'ha-giang')), { view: 'deck', id: 'ha-giang', sub: null });
});

test('mã điểm đến lạ hoặc có ký tự nguy hiểm thì về Khám phá; chuỗi truy vấn bị bỏ', () => {
  assert.deepEqual(parseHash('#/dest/../etc'), { view: 'explore', id: null, sub: null });
  assert.deepEqual(parseHash('#/dest/HA GIANG'), { view: 'explore', id: null, sub: null });
  assert.deepEqual(parseHash('#/dest/ha-giang?x=1'), { view: 'dest', id: 'ha-giang', sub: null });
});

test('màn chuyến đi mang mã chuyến và tab; bộ thẻ thêm vào chuyến mang mã chuyến ở tham số phụ', () => {
  assert.deepEqual(parseHash('#/trip/abc-123/2'), { view: 'trip', id: 'abc-123', sub: '2' });
  assert.deepEqual(parseHash('#/trip/abc-123'), { view: 'trip', id: 'abc-123', sub: null });
  assert.deepEqual(parseHash('#/trip'), { view: 'explore', id: null, sub: null });
  assert.deepEqual(parseHash('#/deck/ha-giang/abc-123'), { view: 'deck', id: 'ha-giang', sub: 'abc-123' });
  assert.equal(toHash('trip', 'abc', 'ov'), '#/trip/abc/ov');
  assert.equal(toHash('deck', 'ha-giang', 'abc'), '#/deck/ha-giang/abc');
  assert.equal(toHash('trips'), '#/trips');
});

test('liên kết mời #/join/<mã>: mã 43 ký tự base64url (có chữ hoa, gạch dưới) được giữ; mã sai dạng về Khám phá', () => {
  const code = `Ab_${'x'.repeat(39)}-`;
  assert.equal(code.length, 43);
  assert.deepEqual(parseHash(`#/join/${code}`), { view: 'join', id: code, sub: null });
  assert.equal(parseHash('#/join/ngan').view, 'explore');
  assert.equal(parseHash(`#/join/${code}x`).view, 'explore');
  assert.equal(parseHash('#/join').view, 'explore');
  assert.equal(parseHash(`#/dest/${code}`).view, 'explore', 'chữ hoa vẫn bị cấm ở mã điểm đến');
  assert.equal(toHash('join', code), `#/join/${code}`);
});
