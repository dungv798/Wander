/** Chốt ảnh đã xem và sửa nhầm đơn vị hành chính/đỉnh núi chỉ trong đợt mới; không chạm bản ghi cũ. */
import fs from 'node:fs';
import path from 'node:path';
import { landmarkRegions } from './enrichment-landmarks-20261106.mjs';
import { getJson } from './build-catalog.mjs';
const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'backend/src/main/resources/catalog');
const before = JSON.parse(fs.readFileSync(path.join(root, '.logs/refinement-catalog-before.json'), 'utf8'));
const oldIds = new Set(before.flatMap(entry => entry.data.places.map(place => place.id)));
const photoFile = path.join(root, 'docs/research/place-photo-candidates-20261106.json');
const photos = JSON.parse(fs.readFileSync(photoFile, 'utf8'));
const geocodes = JSON.parse(fs.readFileSync(path.join(root, 'docs/research/geocode-expansion-20261106.json'), 'utf8'));
const approved = {
  'buon-ma-thuot-thac-dray-sap': [3, 4], 'buon-ma-thuot-buon-don': [2, 1], 'ninh-binh-co-do-hoa-lu': [4],
  'phu-quoc-hon-thom': [3], 'phu-quoc-ganh-dau': [3], 'quy-nhon-ghenh-rang': [1],
  'quy-nhon-eo-gio': [1], 'vinh-hy-bau-truc': [2, 1], 'phu-yen-bai-xep': [2, 1], 'ninh-binh-dam-van-long': [1],
};
const provenance = { checkedAt: '2026-11-06', added: {}, corrections: [], photoNotes: {} };
const chosenOsmIds = {
  'quy-nhon-eo-gio': 4132751593, 'vinh-hy-bau-truc': 12433562410, 'phu-yen-bai-xep': 4172081938,
  'buon-ma-thuot-bao-tang-ca-phe': 1545026830, 'buon-ma-thuot-chua-khai-doan': 241740050,
  'can-tho-chua-ong': 1924771927, 'can-tho-con-son': 26753093,
  'cao-bang-deo-ma-phuc': 1887114059, 'cao-bang-nui-mat-than': 13162197540,
};
/** Một điểm có nguồn tọa độ, giữ trống giờ/giá/thời lượng nếu chưa biết. */
function record(dest, id, name, category, lat, lon, sourceUrl, hook, wiki = null) {
  return { id, name, category, area: dest.name, hook, summary: '', lat, lon, bestMonths: [], bestLabel: 'Xem thời tiết trước khi đi', duration: category === 'leo' ? 'Theo tuyến và lịch đoàn' : 'Chưa có dữ liệu', difficulty: 'Chưa xác định', highlights: [], verdict: 'worth', verdictReason: 'Gợi ý biên tập để bạn cân nhắc theo sở thích.', bestSlots: [], slotReason: 'Xác nhận thời tiết và tình trạng tiếp cận tại địa phương.', tips: [category === 'leo' ? 'Ghim là mốc ngọn núi, không phải đầu tuyến trekking. Chốt tuyến, thời lượng và lịch đoàn với guide trước khi xếp ngày.' : 'Tọa độ tham khảo, không thay cho việc xác nhận lối vào hoặc điểm hẹn.', `Nguồn vị trí: ${sourceUrl}`, 'Xác nhận giờ, giá và khả năng đón khách trước chuyến đi.'], photos: [], wikipediaTitle: wiki };
}
for (const entry of before) {
  const file = path.join(dir, entry.file);
  const dest = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (dest.id === 'sa-pa') {
    dest.places = dest.places.filter(place => place.id !== 'sa-pa-ngu-chi-son' || oldIds.has(place.id));
    const source = JSON.parse(fs.readFileSync(path.join(root, 'tools/catalog/data/osm-candidates/sa-pa.json'), 'utf8')).places;
    for (const [id, name] of [['sa-pa-ngu-chi-son', 'Núi Ngũ Chỉ Sơn'], ['sa-pa-nhiu-co-san', 'Núi Nhìu Cồ San']]) {
      const hit = source.find(point => point.name === name && point.kind === 'peak');
      if (!hit || dest.places.some(place => place.id === id)) continue;
      const sourceUrl = `https://www.openstreetmap.org/${hit.osm}`;
      dest.places.push(record(dest, id, name.replace(/^Núi /, ''), 'leo', hit.lat, hit.lon, sourceUrl, 'Tìm hiểu một cung trekking, chuẩn bị theo tuyến và thể lực của bạn.'));
      provenance.added[id] = { sourceUrl, kind: 'peak', position: 'OSM_UNVERIFIED', route: 'UNKNOWN' };
    }
    provenance.corrections.push('Ngũ Chỉ Sơn: loại tọa độ xã; dùng đúng đối tượng peak từ OSM, không suy ra đầu tuyến.');
  }
  for (const [slug, wiki, category, hook] of landmarkRegions[dest.id] ?? []) {
    const id = `${dest.id}-${slug}`;
    if (dest.places.some(place => place.id === id)) continue;
    const hit = geocodes[id]?.hits?.find(hit => hit.osm_id === chosenOsmIds[id]);
    if (!hit) continue;
    // Chỉ tiếp tục sau khi người chạy đã đọc log và tên/loại/vùng phù hợp.
    if (!process.argv.includes('--geocodes-reviewed')) continue;
    const sourceUrl = `https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`;
    dest.places.push(record(dest, id, wiki.replace(/\s*\(.*\)/, ''), category, Number(hit.lat), Number(hit.lon), sourceUrl, hook));
    provenance.added[id] = { sourceUrl, name: hit.display_name, type: hit.type, position: 'OSM_UNVERIFIED' };
  }
  if (dest.id === 'ninh-binh' && !dest.places.some(place => place.id === 'ninh-binh-dam-van-long')) {
    const source = await getJson('https://www.wikidata.org/w/api.php', { action: 'wbgetentities', ids: 'Q105723502', props: 'claims' });
    const coord = source.entities.Q105723502.claims.P625[0].mainsnak.datavalue.value;
    dest.places.push(record(dest, 'ninh-binh-dam-van-long', 'Đầm Vân Long', 'canh', coord.latitude, coord.longitude, 'https://www.wikidata.org/wiki/Q105723502', 'Đi chậm trên mặt nước giữa những dãy núi.', 'Khu bảo tồn thiên nhiên đất ngập nước Vân Long'));
    provenance.added['ninh-binh-dam-van-long'] = { sourceUrl: 'https://www.wikidata.org/wiki/Q105723502', coordinateKind: 'RESERVE_REFERENCE_NOT_BOAT_PIER' };
  }
  for (const place of dest.places.filter(place => !oldIds.has(place.id))) {
    if (place.difficulty.length > 20) place.difficulty = 'Chưa xác định';
    const picks = (approved[place.id] ?? []).map(index => photos[place.id]?.candidates[index - 1]).filter(Boolean);
    if (picks.length) place.photos = picks.map(photo => {
      fs.copyFileSync(path.join(root, '.logs/refinement-place-photos', photo.file), path.join(dir, 'photos', photo.file));
      return { file: photo.file, author: photo.author, license: photo.license, sourceUrl: photo.source };
    });
    if (place.id === 'phu-quoc-ganh-dau') place.hook = 'Khám phá một góc Gành Dầu ở phía tây bắc đảo.';
    if (place.id === 'quy-nhon-ghenh-rang') place.hook = 'Ghé Ghềnh Ráng, tìm hiểu dấu tích gắn với Hàn Mặc Tử.';
    if (place.id === 'ninh-binh-co-do-hoa-lu') provenance.corrections.push('Hoa Lư: bỏ ảnh sơ đồ trong lượt mới, thay bằng ảnh thực tế đã xem.');
  }
  // Chỉ sửa link của các mục được thêm trong đợt này; không đổi nội dung cẩm nang cũ.
  for (const guide of dest.guide) for (const item of guide.items) {
    if (item.placeId?.startsWith('exp-food-') && !dest.places.some(place => place.id === item.placeId)) item.placeId = null;
  }
  fs.writeFileSync(file, `${JSON.stringify(dest, null, 2)}\n`);
}
for (const [id, topic] of Object.entries(photos)) {
  topic.approved = approved[id] ?? [];
  topic.reviewedAt = '2026-11-06';
  topic.reviewNotes = id === 'quy-nhon-ky-co' ? 'Tạm giữ ngoài app: tên file nói Kỳ Co nhưng cảnh vịnh có thể là Nhơn Lý; chưa đủ chắc để gắn POI.' : 'Đã xem nguyên tỷ lệ; loại ảnh địa danh khác, sơ đồ, vé và ảnh không đúng điểm. Ảnh thiếu căn cứ vẫn chưa nhập.';
}
fs.writeFileSync(photoFile, `${JSON.stringify(photos, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'docs/research/place-expansion-review-20261106.json'), `${JSON.stringify(provenance, null, 2)}\n`);
