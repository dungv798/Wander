/** Dò địa chỉ theo tên từ Nominatim; tối đa một yêu cầu mỗi giây, chỉ lưu ứng viên để xem. */
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const file = path.join(root, 'docs/research/geocode-expansion-20261106.json');
const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
const queries = {
  'quy-nhon-eo-gio': 'Eo Gió',
  'vinh-hy-bau-truc': 'Bàu Trúc',
  'phu-yen-bai-xep': 'Bãi Xép',
  'can-tho-chua-ong': 'Chùa Ông Cần Thơ',
  'can-tho-truc-lam-phuong-nam': 'Trúc Lâm Phương Nam',
  'can-tho-munir-ansay': 'Munir Ansay',
  'can-tho-gian-gua': 'Giàn Gừa',
  'can-tho-con-son': 'Cồn Sơn Cần Thơ',
  'cao-bang-deo-ma-phuc': 'Đèo Mã Phục',
  'cao-bang-nui-mat-than': 'Núi Mắt Thần',
  'buon-ma-thuot-bao-tang-ca-phe': 'Bảo tàng Thế giới Cà phê, Buôn Ma Thuột, Vietnam',
  'buon-ma-thuot-chua-khai-doan': 'Chùa Khải Đoan, Buôn Ma Thuột, Vietnam',
};
for (const [id, query] of Object.entries(queries)) {
  if (data[id]?.hits?.length) continue;
  try {
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q: query, format: 'jsonv2', limit: '3', countrycodes: 'vn' })}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'WanderCatalog/0.2 (local data preparation; contact https://github.com/dungv798/Wander)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data[id] = { query, fetchedAt: new Date().toISOString(), attribution: '© OpenStreetMap contributors (ODbL)', hits: await res.json() };
  } catch (error) { data[id] = { query, error: String(error.message) }; }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${id}: ${JSON.stringify(data[id])}`);
  await new Promise(resolve => setTimeout(resolve, 1200));
}
