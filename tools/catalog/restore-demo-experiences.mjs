import fs from 'node:fs';
import path from 'node:path';
import { experiences } from '../../docs/design/liquid-review-2026-11-05/people-data.mjs';

const root = path.resolve(import.meta.dirname, '../..');
const catalog = path.join(root, 'backend/src/main/resources/catalog');
const demo = path.join(root, 'docs/design/liquid-review-2026-11-05');
const file = path.join(catalog, 'ha-giang.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const names = { 'cho-phien': 'Đi chợ ở Đồng Văn', 'bua-sang': 'Ăn sáng ở Đồng Văn', 'ban-lang': 'Ghé bản Lũng Cẩm', 'khoang-dung': 'Dừng ngắm Mã Pì Lèng' };
const categories = { 'cho-phien': 'cho', 'bua-sang': 'am', 'ban-lang': 'van', 'khoang-dung': 'canh' };

/** Chuyển ảnh đã tuyển của demo thành tệp catalog, giữ nguyên tác giả/giấy phép/nguồn. */
function photo(source) {
  const filename = `demo-people-${path.basename(source.url)}`;
  fs.copyFileSync(path.join(demo, source.url), path.join(catalog, 'photos', filename));
  return { file: filename, author: source.author, license: source.license, sourceUrl: source.sourceUrl };
}

const restored = experiences.filter(experience => experience.placeId).map(experience => {
  const anchor = data.places.find(place => place.id === experience.placeId);
  if (!anchor) throw new Error(`Thiếu mốc thật: ${experience.placeId}`);
  return {
    ...anchor, id: `exp-${experience.id}`, name: names[experience.id], category: categories[experience.id],
    hook: experience.intro, summary: experience.detail,
    duration: 'Tự chọn thời lượng', difficulty: 'Tùy hoạt động',
    highlights: [experience.takeaway], verdict: 'ifconv', verdictReason: experience.detail,
    bestSlots: [], slotReason: experience.practical,
    tips: [experience.practical, 'Ghim là mốc khu vực để bắt đầu tìm hiểu, chưa phải địa chỉ của một dịch vụ đã xác minh.', ...(experience.source ? [`Đọc thêm: ${experience.source}`] : [])],
    photos: experience.photo ? [photo(experience.photo), ...experience.gallery.map(photo)] : anchor.photos,
    wikipediaTitle: null,
  };
});
data.places = [...restored, ...data.places.filter(place => !restored.some(experience => experience.id === place.id))];
data.coverPlaceId = 'deo-ma-pi-leng';
data.coverPhoto = data.places.find(place => place.id === data.coverPlaceId).photos[0];
fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Khôi phục ${restored.length} trải nghiệm từ demo B; giữ mốc khu vực và ghi công ảnh.`);
