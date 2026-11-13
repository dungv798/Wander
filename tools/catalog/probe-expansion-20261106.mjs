/** Truy vấn OSM nhỏ theo tên cho địa danh chưa phân giải; lưu nguồn thô để xem trước khi chọn. */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const output = path.join(root, 'docs/research/osm-expansion-candidates-20261106.json');
const data = fs.existsSync(output) ? JSON.parse(fs.readFileSync(output, 'utf8')) : {};
const terms = {
  'buon-ma-thuot': 'Khải Đoan|Khải Đoan|Coffee Museum|Thế giới Cà phê|tàng Đắk Lắk|Ak[oôOÔ]|Yang Tao',
  'can-tho': 'Chùa Ông|Munir|Trúc Lâm Phương Nam|Giàn Gừa|Cồn Sơn',
  'cao-bang': 'Mắt Thần|Mã Phục|Trúc Lâm Bản Giốc',
  'ninh-binh': 'Vân Long|Thung Nham',
  'phong-nha': 'Hang Tối|Nước Moọc|Nuoc Mooc|Hang Va',
  'phu-quoc': 'Suối Tranh|Hàm Ninh|Gành Dầu',
  'sa-pa': 'Thác Tình Yêu|Love Waterfall|Nhà thờ|Nhìu Cồ San|Lảo Thẩn',
  'vinh-hy': 'Bàu Trúc|Mỹ Nghiệp|Nam Cương|Bình Tiên|Binh Tien',
  'phu-yen': 'Bãi Xép|Bãi Môn',
  'quy-nhon': 'Eo Gió|Eo Gio|Long Khánh',
};
for (const [id, pattern] of Object.entries(terms)) {
  if (data[id]?.elements?.length) continue;
  const dest = JSON.parse(fs.readFileSync(path.join(root, 'backend/src/main/resources/catalog', `${id}.json`), 'utf8'));
  const ref = dest.references[0];
  const query = `[out:json][timeout:60];nwr["name"~"${pattern}",i](around:110000,${ref.lat},${ref.lon});out center tags;`;
  try {
    const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'WanderCatalog/0.2 (local research; contact https://github.com/dungv798/Wander)' }, signal: AbortSignal.timeout(90000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    data[id] = { fetchedAt: new Date().toISOString(), osmTimestamp: raw.osm3s?.timestamp_osm_base, query, attribution: '© OpenStreetMap contributors', license: 'ODbL-1.0', elements: raw.elements ?? [] };
    console.log(`${id}: ${data[id].elements.length}`);
  } catch (error) { data[id] = { error: String(error.message) }; console.log(`! ${id}: ${error.message}`); }
  fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);
  await new Promise(resolve => setTimeout(resolve, 1500));
}
