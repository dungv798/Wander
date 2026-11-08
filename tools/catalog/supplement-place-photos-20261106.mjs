/** Tệp Commons đã đọc trang nguồn; tải để xem ảnh trước khi gắn vào đúng địa danh. */
import fs from 'node:fs';
import path from 'node:path';
import { usableImages, getBytes } from './build-catalog.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'docs/research/place-photo-candidates-20261106.json');
const data = JSON.parse(fs.readFileSync(output, 'utf8'));
const picks = {
  'quy-nhon-ky-co': ['File:Ky Co - Nhon Ly - Quy Nhon - Binh Dinh - Viet Nam.jpg'],
  'quy-nhon-eo-gio': ['File:Eo Gió - Nhơn Lý.jpg'],
  'vinh-hy-bau-truc': ['File:Hợp tác xã Gốm Chăm Bàu Trúc.jpg', 'File:Gốm Bàu Trúc.JPG'],
  'phu-yen-bai-xep': ['File:Bãi Xép 5.jpg', 'File:Bãi Xép 2.jpg'],
  'ninh-binh-dam-van-long': ['File:Van Long Nature Reserve Riet Grotten Kalksteen Ninh Binh.jpg'],
};
for (const [id, names] of Object.entries(picks)) {
  const topic = data[id] ?? { title: id, candidates: [], approved: [] };
  for (const image of await usableImages(names)) {
    if (topic.candidates.some(photo => photo.source === image.source)) continue;
    const file = `ref-${id}-${topic.candidates.length + 1}.jpg`;
    fs.writeFileSync(path.join(root, '.logs/refinement-place-photos', file), await getBytes(image.url));
    topic.candidates.push({ ...image, file });
  }
  data[id] = topic;
  fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${id}: ${topic.candidates.length}`);
}
