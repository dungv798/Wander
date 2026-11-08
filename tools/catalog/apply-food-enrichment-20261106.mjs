/** Nhập các ảnh đã xem, món muốn thử và gợi ý địa phương; không sửa các thẻ/ảnh/khoảnh khắc cũ. */
import fs from 'node:fs';
import path from 'node:path';
import { foodRegions } from './enrichment-foods-20261106.mjs';
import { foodCopy, localIdeas } from './enrichment-food-copy-20261106.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const catalogDir = path.join(root, 'backend/src/main/resources/catalog');
const file = path.join(root, 'docs/research/food-photo-candidates-20261106.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
// Ảnh tìm dưới bài xíu mại thực tế là bánh mì kẹp, đã xem và phân loại lại đúng món.
const sandwich = manifest['Bánh mì xíu mại'].candidates.find(photo => photo.title === 'File:Bánh mì.jpg');
if (sandwich && !manifest['Bánh mì'].candidates.some(photo => photo.source === sandwich.source)) manifest['Bánh mì'].candidates.push(sandwich);
const approved = {
  'Thịt trâu gác bếp': [1], 'Trà Shan tuyết': [1], 'Bánh căn': [1, 2], 'Bánh canh': [2],
  'Bánh xèo': [1], 'Bánh bèo': [1], 'Bún chả cá': [1], 'Bánh tráng': [3],
  'Phở': [1, 2], 'Bún chả': [1, 2], 'Cà phê trứng': [1, 3], 'Cơm tấm': [2, 1], 'Hủ tiếu': [1, 3],
  'Bánh mì': [manifest['Bánh mì'].candidates.findIndex(photo => photo.source === sandwich?.source) + 1],
  'Bún bò Huế': [1, 2], 'Bánh bột lọc': [3], 'Mì Quảng': [1], 'Cao lầu': [3, 2], 'Nem nướng': [2, 1],
  'Bún quậy': [3], 'Bánh cống': [1], 'Bún đỏ': [1], 'Cà phê sữa đá': [1], 'Bánh cuốn': [1, 2],
  'Chả mực': [1], 'Dê núi Ninh Bình': [3], 'Thắng cố': [1], 'Xôi ngũ sắc': [1],
};
for (const [title, topic] of Object.entries(manifest)) {
  topic.approved = (approved[title] ?? []).filter(index => index > 0 && topic.candidates[index - 1]);
  topic.reviewedAt = '2026-11-06';
  topic.reviewNotes = 'Đã xem ảnh nguyên tỷ lệ trên contact sheet. Chỉ giữ đúng món; loại ảnh món khác trong gallery, nguyên liệu, động vật sống, ảnh địa danh và ảnh quảng cáo. Ảnh món minh họa, không xác nhận một quán hay công thức của riêng vùng.';
}
fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
const provenance = { researchedAt: '2026-11-06', trendSource: 'https://news.booking.com/the-era-of-you-bookingcom-predicts-the-top-trends-defining-travel-in-2026-with-individuality-taking-center-stage/', trendScope: 'Khảo sát ý định toàn cầu, không phải xếp hạng nhu cầu Việt Nam hay dữ liệu thời gian thực.', destinations: {} };
for (const [id, region] of Object.entries(foodRegions)) {
  const target = path.join(catalogDir, `${id}.json`);
  const dest = JSON.parse(fs.readFileSync(target, 'utf8'));
  const anchor = dest.places.find(place => place.id === region.anchor) ?? dest.references[0];
  const linked = [];
  const guideItems = [];
  for (const [slug, name, title] of region.foods) {
    const topic = manifest[title];
    const images = (topic?.approved ?? []).map(index => topic.candidates[index - 1]);
    const placeId = `exp-food-${id}-${slug}`;
    const summary = foodCopy[title];
    if (!summary) throw new Error(`Thiếu nội dung món ${title}`);
    const eligible = images.length > 0 && (title !== 'Bánh xèo' || id === 'can-tho');
    guideItems.push({ icon: title.includes('phê') || title.includes('Trà') ? 'coffee' : 'tools-kitchen-2', title: name, text: summary, placeId: eligible ? placeId : null });
    // Bánh xèo miền Tây trong ảnh không được dùng làm ảnh bánh xèo tôm nhảy hoặc phiên bản miền Trung.
    if (!eligible) continue;
    const photos = images.map(image => {
      const photoTarget = path.join(catalogDir, 'photos', image.file);
      const bytes = fs.readFileSync(path.join(root, '.logs/refinement-food-photos', image.file));
      if (fs.existsSync(photoTarget) && !bytes.equals(fs.readFileSync(photoTarget))) throw new Error(`Không ghi đè ảnh ${image.file}`);
      fs.writeFileSync(photoTarget, bytes);
      return { file: image.file, author: image.author, license: image.license, sourceUrl: image.source };
    });
    if (!dest.places.some(place => place.id === placeId)) dest.places.push({
      id: placeId, name, category: 'am', area: `Mốc khu vực ${dest.name}`,
      hook: summary.split('. ')[0] + '.', summary: `${summary} Đây là ý tưởng thử món; chọn quán trước khi chốt điểm dừng.`,
      lat: anchor.lat, lon: anchor.lon, bestMonths: [], bestLabel: 'Tùy nơi bạn chọn', duration: 'Tùy bữa ăn và nơi bạn chọn', difficulty: 'Không áp dụng',
      highlights: ['Món muốn thử', 'Chọn quán sau'], verdict: 'worth', verdictReason: 'Gợi ý ẩm thực theo vùng để bạn cân nhắc theo khẩu vị.', bestSlots: [], slotReason: 'Chưa có giờ của một quán cụ thể; chọn thời gian sau khi xác nhận nơi ăn.',
      tips: ['Ghim là mốc khu vực, không phải địa chỉ quán đã xác minh.', 'Ảnh minh họa món, không đại diện cho một quán cụ thể hoặc phiên bản riêng của vùng.', 'Hỏi thành phần, giá và giờ phục vụ tại quán bạn chọn.'],
      photos, wikipediaTitle: topic.wikipediaTitle ?? null,
    });
    linked.push(placeId);
  }
  const guide = dest.guide.find(section => section.id === 'an');
  if (guide) {
    for (const item of guideItems) if (!guide.items.some(old => old.title === item.title)) guide.items.push(item);
  } else dest.guide.push({ id: 'an', layout: 'CARDS', category: 'am', icon: 'tools-kitchen-2', title: 'Ăn gì', summary: 'Chọn một món để bắt đầu chuyến khám phá.', items: guideItems });
  const ideaId = 'goi-y-trai-nghiem-2026';
  if (!dest.guide.some(section => section.id === ideaId)) dest.guide.push({ id: ideaId, layout: 'ROWS', category: 'van', icon: 'route', title: 'Đi vì một trải nghiệm', summary: 'Ẩm thực, đời sống và những khoảng đi chậm.', items: localIdeas[id].map(([title, text], index) => ({ icon: index ? 'route' : 'tools-kitchen-2', title, text })) });
  const first = dest.places.find(place => place.id === linked[0]);
  const momentId = `food-research-${id}`;
  if (first && !(dest.moments ?? []).some(moment => moment.id === momentId)) {
    dest.moments ??= [];
    dest.moments.push({ id: momentId, theme: 'mon-an', caption: `${first.name} · một món muốn thử (ảnh minh họa)`, ...first.photos[0] });
  }
  fs.writeFileSync(target, `${JSON.stringify(dest, null, 2)}\n`);
  provenance.destinations[id] = { source: region.source, anchor: region.anchor ?? dest.references[0].id, coordinateKind: 'AREA_REFERENCE_NOT_VENUE', foodCards: linked, guideFoods: guideItems.map(item => item.title) };
  console.log(`${id}: ${linked.length} thẻ món, ${guideItems.length} mục cẩm nang`);
}
fs.writeFileSync(path.join(root, 'docs/research/food-experiences-20261106.json'), `${JSON.stringify(provenance, null, 2)}\n`);
