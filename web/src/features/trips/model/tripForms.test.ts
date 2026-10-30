import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDates, parseItemForm, parseMoneyField, parseTripName } from './tripForms.ts';
import type { ItemForm } from './tripForms.ts';

const FORM: ItemForm = { title: 'Ăn trưa', type: 'food', isPlace: false, day: '2026-10-31', time: '12:30', duration: '60', note: ' ghi chú ', cost: '120', included: false, reference: '', booked: false };

test('biểu mẫu lưu 1430 thành 14:30, xóa thành null và chặn giờ ngoài 24h', () => {
  const quick = parseItemForm({ ...FORM, time: '1430' });
  assert.equal(quick.ok && quick.value.patch.timeOfDay, '14:30');
  const cleared = parseItemForm({ ...FORM, time: '' });
  assert.equal(cleared.ok && cleared.value.patch.timeOfDay, null);
  assert.equal(parseItemForm({ ...FORM, time: '2400' }).ok, false);
});

test('ô tiền: rỗng là chưa biết, 0 là biết bằng không, sai thì có lời nhắc kèm tên ô', () => {
  assert.deepEqual(parseMoneyField('', 'Chi phí'), { ok: true, value: null });
  assert.deepEqual(parseMoneyField('0', 'Chi phí'), { ok: true, value: 0 });
  const bad = parseMoneyField('-5', 'Chi phí');
  assert.equal(bad.ok, false);
  assert.match(bad.ok ? '' : bad.error, /^Chi phí: /);
});

test('ngày chắc: kiểm thứ tự và 366 ngày; ngày dự kiến: tính ngày về từ số ngày', () => {
  assert.equal(parseDates({ start: '', end: '', tentative: false, days: '' }).ok, false);
  assert.equal(parseDates({ start: '2026-11-02', end: '2026-11-01', tentative: false, days: '' }).ok, false);
  assert.deepEqual(parseDates({ start: '2026-10-31', end: '2026-11-02', tentative: false, days: '' }), { ok: true, value: { startDate: '2026-10-31', endDate: '2026-11-02', datesTentative: false } });
  assert.deepEqual(parseDates({ start: '2026-10-31', end: '', tentative: true, days: '3' }), { ok: true, value: { startDate: '2026-10-31', endDate: '2026-11-02', datesTentative: true } });
  assert.equal(parseDates({ start: '2026-10-31', end: '', tentative: true, days: '367' }).ok, false);
  assert.equal(parseDates({ start: '2026-10-31', end: '', tentative: true, days: 'abc' }).ok, false);
});

test('mục tự do: cần tên; thời lượng ≤ 10080; ghi chú được cắt khoảng trắng', () => {
  assert.equal(parseItemForm({ ...FORM, title: '  ' }).ok, false);
  assert.equal(parseItemForm({ ...FORM, duration: '10081' }).ok, false);
  const r = parseItemForm(FORM);
  assert.equal(r.ok && r.value.patch.note, 'ghi chú');
  assert.equal(r.ok && r.value.patch.costK, 120);
  assert.equal(r.ok && r.value.patch.booking, 'pending');
});

test('địa điểm trong kho không cần tên; Nghỉ không giá/đặt chỗ dù biểu mẫu còn dữ liệu cũ; giá tham khảo chỉ khi đã bao gồm', () => {
  assert.equal(parseItemForm({ ...FORM, title: '', isPlace: true }).ok, true);
  const rest = parseItemForm({ ...FORM, type: 'rest', cost: '500', included: true, reference: '9', booked: true });
  assert.deepEqual(rest.ok && [rest.value.patch.costK, rest.value.patch.included, rest.value.patch.referenceK, rest.value.patch.booking], [null, false, null, null]);
  const inc = parseItemForm({ ...FORM, included: true, reference: '25', cost: '' });
  assert.deepEqual(inc.ok && [inc.value.patch.included, inc.value.patch.referenceK], [true, 25]);
  const noRef = parseItemForm({ ...FORM, included: false, reference: '25' });
  assert.equal(noRef.ok && noRef.value.patch.referenceK, null);
});

test('tên chuyến bắt buộc và cắt 120 ký tự', () => {
  assert.equal(parseTripName('   ').ok, false);
  const long = parseTripName('x'.repeat(200));
  assert.equal(long.ok && long.value.length, 120);
});

test('tên mục > 200 và ghi chú > 2000 ký tự bị chặn ngay ở hàm miền (không chỉ nhờ maxLength của ô)', () => {
  assert.equal(parseItemForm({ ...FORM, title: 'x'.repeat(201) }).ok, false);
  assert.equal(parseItemForm({ ...FORM, note: 'x'.repeat(2001) }).ok, false);
  assert.equal(parseItemForm({ ...FORM, title: 'x'.repeat(200), note: 'x'.repeat(2000) }).ok, true);
});
