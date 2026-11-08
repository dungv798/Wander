import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import { MAP } from '../map/map.const.ts';
import { MOTION, MOTION_RANGE } from './motion.const.ts';

const TOKENS = fs.readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8');

/** Đọc một token thời lượng (ms) trong khối `:root` đầu tiên của tokens.css. */
function tokenMs(name: string): number {
  const match = new RegExp(`${name}:\\s*(\\d+)ms`).exec(TOKENS);
  assert.ok(match, `thiếu token ${name}`);
  return Number(match[1]);
}

test('mỗi nhóm chuyển động nằm trong khoảng đã duyệt', () => {
  for (const key of Object.keys(MOTION) as (keyof typeof MOTION)[]) {
    const [min, max] = MOTION_RANGE[key];
    assert.ok(MOTION[key] >= min && MOTION[key] <= max, `${key}=${MOTION[key]} ngoài [${min}, ${max}]`);
  }
});

test('token CSS khớp hằng số TS: bấm = --dur-press, đổi bề mặt = --dur-med; camera khớp MAP.FLY_MS', () => {
  assert.equal(tokenMs('--dur-press'), MOTION.PRESS_MS);
  assert.equal(tokenMs('--dur-med'), MOTION.SURFACE_MS);
  assert.equal(MAP.FLY_MS, MOTION.MAP_FLY_MS);
});
