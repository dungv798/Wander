import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { SHELL_MAP } from './shellMap.const.ts';

const TOKENS = fs.readFileSync(new URL('../../../styles/tokens.css', import.meta.url), 'utf8');

/** Reads a numeric token (any unit) from tokens.css. */
function token(name: string, unit: string): number {
  const match = new RegExp(`${name}:\\s*(\\d+)${unit}`).exec(TOKENS);
  assert.ok(match, `thiếu token ${name}`);
  return Number(match[1]);
}

test('lề camera của bản đồ khung khớp hình học CSS của tờ kính (không để ghim chui xuống dưới tờ)', () => {
  assert.equal(1 - token('--shell-sheet-top', '%') / 100, SHELL_MAP.SHEET_OPEN_FRACTION, 'tờ mở che đúng phần chiều cao camera đã trừ');
  assert.equal(token('--shell-peek-height', 'px'), SHELL_MAP.PEEK_INSET_PX - 0, 'tờ thu lại cao bằng lề camera');
  assert.ok(SHELL_MAP.PANEL_INSET_PX >= token('--shell-panel-width', 'px') + token('--shell-panel-gap', 'px'), 'lề trái phải trùm bảng + khoảng hở');
});

test('Home mobile vừa camera trong vùng map thật sự lộ ra, khớp vị trí tờ riêng của Home', () => {
  const css = fs.readFileSync(new URL('../homeSurface.css', import.meta.url), 'utf8');
  const top = /--shell-sheet-top:\s*(\d+)%/.exec(css);
  assert.ok(top);
  assert.equal(1 - Number(top[1]) / 100, SHELL_MAP.HOME_SHEET_COVER_FRACTION);
});

test('camera dùng đúng chiều cao header và vùng xem trước của trang điện thoại', () => {
  assert.equal(token('--mobile-header-height', 'px'), SHELL_MAP.DOCUMENT_HEADER_PX);
  assert.equal(token('--mobile-map-preview', 'px'), SHELL_MAP.DOCUMENT_PREVIEW_PX);
});
