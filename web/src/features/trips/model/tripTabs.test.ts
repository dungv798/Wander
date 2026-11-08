import assert from 'node:assert/strict';
import { test } from 'node:test';
import { modeOfTab, tabOfMode, validTab } from './tripTabs.ts';

test('địa chỉ cũ ov và số ngày vẫn hợp lệ; địa chỉ mới un và cost được nhận', () => {
  assert.equal(validTab('ov', 3), 'ov');
  assert.equal(validTab('2', 3), '2');
  assert.equal(validTab('un', 3), 'un');
  assert.equal(validTab('cost', 3), 'cost');
});

test('địa chỉ sai hoặc ngoài số ngày thì về tổng quan', () => {
  for (const bad of [null, '', '0', '4', '1.5', 'x', '-1']) assert.equal(validTab(bad, 3), 'ov', String(bad));
});

test('chế độ suy từ địa chỉ: số ngày = Lịch', () => {
  assert.equal(modeOfTab('ov'), 'overview');
  assert.equal(modeOfTab('3'), 'schedule');
  assert.equal(modeOfTab('un'), 'unassigned');
  assert.equal(modeOfTab('cost'), 'cost');
});

test('vào Lịch quay lại ngày đang xem gần nhất; các chế độ khác có địa chỉ cố định', () => {
  assert.equal(tabOfMode('schedule', '2'), '2');
  assert.equal(tabOfMode('overview', '2'), 'ov');
  assert.equal(tabOfMode('unassigned', '2'), 'un');
  assert.equal(tabOfMode('cost', '2'), 'cost');
});
