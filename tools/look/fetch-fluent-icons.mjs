import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUT = path.join(ROOT, 'web/public/look/icons');
const SOURCE = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/';
const MANIFEST = new URL('./fluent-icons.json', import.meta.url);
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const IHDR_END = 24;
const TIMEOUT_MS = 30_000;

/** Chỉ nhận tệp từ kho Microsoft qua HTTPS; phản hồi lỗi không được ghi thành ảnh. */
async function download(file) {
  const url = SOURCE + file.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${response.status}: ${file}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Kiểm chữ ký PNG và IHDR có kích thước thật, tránh lưu HTML/lỗi HTTP thành tài nguyên. */
function validatePng(buffer, file) {
  if (buffer.length < IHDR_END || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
    || buffer.toString('ascii', 12, 16) !== 'IHDR' || !buffer.readUInt32BE(16) || !buffer.readUInt32BE(20)) {
    throw new Error(`PNG không hợp lệ: ${file}`);
  }
}

/** Tải manifest đã kiểm kê; lưu giấy phép gốc trước, dừng rõ ràng nếu Microsoft đổi đường dẫn. */
async function main() {
  const icons = JSON.parse(await fs.readFile(MANIFEST, 'utf8'));
  await fs.mkdir(OUT, { recursive: true });
  const license = (await download('LICENSE')).toString('utf8');
  if (!license.includes('MIT License') || !license.includes('Permission is hereby granted')) throw new Error('Giấy phép nguồn không phải MIT như dự kiến');
  await fs.writeFile(path.join(OUT, 'LICENSE-NOTICE.txt'), `Microsoft Fluent UI Emoji\nNguồn: https://github.com/microsoft/fluentui-emoji\nTài nguyên: ${SOURCE}assets/\n\n${license}`);
  for (const icon of icons) {
    if (icon.file !== `assets/${icon.fluentName}/3D/${path.basename(icon.file)}` || !/^[a-z0-9_]+_3d\.png$/.test(path.basename(icon.file))) throw new Error(`Đường dẫn không hợp lệ: ${icon.file}`);
    const data = await download(icon.file);
    validatePng(data, icon.file);
    await fs.writeFile(path.join(OUT, path.basename(icon.file)), data);
    console.log(`OK ${icon.fluentName}`);
  }
}

await main();
