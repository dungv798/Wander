import fs from 'node:fs';
import assert from 'node:assert/strict';

const CSS = fs.readFileSync(new URL('../../web/src/styles/tokens.css', import.meta.url), 'utf8');
const HEX_RADIX = 16;
const CHANNEL_MAX = 255;
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_DIVISOR = 1.055;
const GAMMA = 2.4;
const LUMA = [0.2126, 0.7152, 0.0722];
const CONTRAST_OFFSET = 0.05;
const MIN_CONTRAST = 4.5;

/** Đọc token màu cố định của lớp kính, không sao chép giá trị thiết kế vào kiểm tra. */
function token(name) {
  const value = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`))?.[1];
  assert.ok(value, name);
  const alias = value.match(/^var\(--([\w-]+)\)$/);
  return alias ? token(alias[1]) : value;
}

/** Màu hex của token thành ba kênh để kiểm nền fallback và màu chữ. */
function hex(value) {
  return value.slice(1).match(/../g).map((pair) => parseInt(pair, HEX_RADIX));
}

/** Độ chói tuyến tính theo WCAG; tỉ lệ không phụ thuộc kích thước chữ. */
function luminance(rgb) {
  return rgb.reduce((sum, value, i) => {
    const channel = value / CHANNEL_MAX;
    const linear = channel <= LINEAR_THRESHOLD ? channel / LINEAR_DIVISOR : ((channel + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA;
    return sum + linear * LUMA[i];
  }, 0);
}

/** Tính cả hai chiều sáng/tối để phát hiện thay đổi token làm mất tương phản. */
function ratio(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + CONTRAST_OFFSET) / (values[1] + CONTRAST_OFFSET);
}

const foreground = hex(token('white'));
const channels = token('glass-photo-scrim').match(/[\d.]+/g).map(Number);
const alpha = channels.at(-1);
const RGB_CHANNELS = 3;
// Chữ trắng/glyph có scrim tối riêng, không có highlight trắng phía trên scrim.
for (const [name, level] of [['ảnh trắng + scrim', CHANNEL_MAX], ['ảnh đen + scrim', 0]]) {
  const background = channels.slice(0, RGB_CHANNELS).map((value) => value * alpha + level * (1 - alpha));
  const contrast = ratio(foreground, background);
  assert.ok(contrast >= MIN_CONTRAST, name);
  console.log(`PASS ${name}: ${contrast.toFixed(2)}:1 >= ${MIN_CONTRAST}:1`);
}
for (const name of ['glass-fallback', 'cta-g1', 'cta-2']) {
  const contrast = ratio(hex(token(name === 'glass-fallback' ? 'ink-fixed' : 'on-cta')), hex(token(name)));
  assert.ok(contrast >= MIN_CONTRAST, name);
  console.log(`PASS ${name}: ${contrast.toFixed(2)}:1 >= ${MIN_CONTRAST}:1`);
}

// Nền trung tính, điểm nhấn và viền mang thông tin của LOOK V2.
for (const [fg, bg, minimum] of [
  ...['bg', 'surface', 'surface-2', 'glass-fallback', 'scene-top'].flatMap(bg => ['ink', 'muted'].map(fg => [fg, bg, MIN_CONTRAST])),
  ['ink-fixed', 'brand-soft', MIN_CONTRAST], ['on-sun', 'sun', MIN_CONTRAST],
  ['border-ctrl', 'bg', 3], ['border-ctrl', 'surface', 3], ['border-ctrl', 'surface-2', 3],
  ['ink-fixed', 'brand-soft', 3], ['on-cta', 'cta-2', 3],
]) {
  const contrast = ratio(hex(token(fg)), hex(token(bg)));
  assert.ok(contrast >= minimum, `${fg}/${bg}: ${contrast}`);
  console.log(`PASS ${fg}/${bg}: ${contrast.toFixed(2)}:1 >= ${minimum}:1`);
}
// Đệm chữ sáng và đệm glyph tối phải giữ tương phản ngay cả trên nền cực trị.
for (const level of [0, CHANNEL_MAX]) {
  const light = [CHANNEL_MAX, CHANNEL_MAX, CHANNEL_MAX].map(value => value * .90 + level * .10);
  const contrast = ratio(hex(token('ink-fixed')), light);
  assert.ok(contrast >= MIN_CONTRAST);
  console.log(`PASS đệm chữ trên nền ${level}: ${contrast.toFixed(2)}:1`);
}
