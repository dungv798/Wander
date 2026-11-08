/** Tìm thêm ảnh đúng món cho các bài thiếu ảnh hoặc chỉ có ảnh nguyên liệu; vẫn chờ xem trước khi nhập. */
import fs from 'node:fs';
import path from 'node:path';
import { getJson, usableImages, getBytes } from './build-catalog.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const file = path.join(root, 'docs/research/food-photo-candidates-20261106.json');
const manifest = JSON.parse(fs.readFileSync(file, 'utf8'));
const queries = {
  'Bánh căn': '"bánh căn"', 'Bánh mì': '"banh mi" sandwich', 'Cơm gà Hội An': '"Hoi An" "chicken rice"',
  'Bánh mì xíu mại': '"banh mi xiu mai"', 'Bún quậy': '"bun quay"', 'Gỏi cá trích': '"goi ca trich"', 'Bún kèn': '"bun ken"',
  'Cơm cháy': '"Ninh Binh" "rice" food', 'Dê núi Ninh Bình': '"Ninh Binh" goat food', 'Xôi ngũ sắc': '"xoi ngu sac"',
  'Phở chua': '"pho chua"', 'Cá ngừ đại dương': '"tuna" "Phu Yen"', 'Đậu phụ': '"tofu" "Sapa"',
  'Su su': '"chayote" "Sapa"', 'Bánh cuốn chả mực': '"banh cuon" "cha muc"',
};
for (const [title, query] of Object.entries(queries)) {
  const topic = manifest[title] ?? { title, candidates: [], approved: [] };
  if (topic.searchReviewed) continue;
  try {
    const result = await getJson('https://commons.wikimedia.org/w/api.php', { action: 'query', generator: 'search', gsrsearch: `${query} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '16' });
    const old = new Set(topic.candidates.map(candidate => candidate.source));
    const images = (await usableImages(Object.values(result.query?.pages ?? {}).map(page => page.title))).filter(image => !old.has(image.source)).slice(0, 4);
    for (const image of images) {
      const photoFile = `food-extra-${Object.keys(queries).indexOf(title)}-${topic.candidates.length + 1}.jpg`;
      fs.writeFileSync(path.join(root, '.logs/refinement-food-photos', photoFile), await getBytes(image.url));
      topic.candidates.push({ ...image, file: photoFile });
    }
    topic.searchReviewed = true;
    manifest[title] = topic;
    fs.writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`);
    console.log(`${title}: +${images.length}`);
  } catch (error) { console.log(`! ${title}: ${error.message}`); }
}
