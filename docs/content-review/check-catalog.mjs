// Chỉ đọc catalog/seed; chỉ ghi kết quả kiểm tra trong thư mục của script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const catalog = path.join(root, 'backend/src/main/resources/catalog');
const seeds = path.join(root, 'tools/catalog/seeds');
const blank = x => typeof x !== 'string' || !x.trim();
const validCoord = p => Number.isFinite(p.lat) && Number.isFinite(p.lon) && Math.abs(p.lat) <= 90 && Math.abs(p.lon) <= 180;
const rad = n => n * Math.PI / 180;
const km = (a, b) => 12742 * Math.asin(Math.min(1, Math.sqrt(Math.sin(rad(b.lat-a.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(b.lon-a.lon)/2)**2)));
const fingerprint = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const watched = [
  ...fs.readdirSync(catalog).filter(f => f.endsWith('.json')).map(f => path.join(catalog, f)),
  ...fs.readdirSync(seeds).filter(f => f.endsWith('.mjs')).map(f => path.join(seeds, f)),
  path.join(root, 'tools/catalog/build-catalog.mjs'),
];
const inputs = Object.fromEntries(watched.map(f => [path.relative(root, f).replaceAll('\\', '/'), fingerprint(f)]));
const groups = values => [...Map.groupBy(values, x => x[0]).values()].filter(xs => xs.length > 1).map(xs => xs.map(x => x[1]));
const absolute = /nhất|miễn phí|mọi lứa tuổi|gần như ai|hầu hết|cực Đông/iu;
const rows = [];
const allPlaces = [];
for (const f of fs.readdirSync(catalog).filter(f => f.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(catalog, f), 'utf8'));
  const seedFile = path.join(seeds, d.id + '.mjs');
  const seed = fs.existsSync(seedFile) ? (await import(pathToFileURL(seedFile).href)).default : null;
  const season = d.guide.find(g => g.id === 'mua');
  const references = d.references.filter(validCoord);
  const places = d.places.map(p => {
    const s = seed?.places.find(s => s.id === p.id);
    const coordinateMissing = p.lat == null || p.lon == null;
    const distanceKm = validCoord(p) && references.length ? Math.min(...references.map(r => km(r, p))) : null;
    const photos = p.photos ?? [];
    const claimFields = ['hook', 'verdictReason', 'slotReason', 'tips', 'highlights'];
    allPlaces.push({ destination: d.id, ...p });
    return {
      id: p.id, name: p.name, coordinateMissing, coordinateInvalid: !validCoord(p),
      distanceKm: distanceKm == null ? null : Math.round(distanceKm * 10) / 10,
      far: distanceKm != null && distanceKm > (seed?.radiusKm ?? 60),
      emptySummary: blank(p.summary), missingDescriptionSource: blank(p.wikipediaTitle),
      overlapMonths: (p.bestMonths ?? []).filter(m => season?.rainyMonths?.includes(m)),
      invalidMonths: (p.bestMonths ?? []).filter(m => !Number.isInteger(m) || m < 1 || m > 12),
      photoCount: photos.length,
      photoIssues: photos.flatMap(ph => ['author', 'license', 'sourceUrl', 'file'].filter(k => blank(ph[k])).map(k => `${ph.file ?? '?'}: thiếu ${k}`)
        .concat(!blank(ph.file) && !fs.existsSync(path.join(catalog, 'photos', ph.file)) ? [`${ph.file}: thiếu tệp`] : [])
        .concat(!blank(ph.license) && (!/^(CC BY(-SA)? \d(\.\d)?|CC0|Public domain|PD)/i.test(ph.license) || /-NC|-ND/i.test(ph.license)) ? [`${ph.file}: giấy phép ngoài danh sách`] : [])
        .concat(ph.author === 'Wikimedia Commons' ? [`${ph.file}: tác giả chung chung`] : [])),
      absoluteClaims: claimFields.flatMap(field => (Array.isArray(p[field]) ? p[field] : [p[field]]).filter(v => v && absolute.test(v)).map(text => ({ field, text }))),
      absoluteSummary: !blank(p.summary) && absolute.test(p.summary) ? p.summary : null,
      defaultedFields: s ? ['slots', 'slotReason', 'tips', 'difficulty'].filter(k => s[k] === undefined) : [],
    };
  });
  rows.push({
    id: d.id, name: d.name, placeCount: places.length, photoCount: places.reduce((n,p) => n+p.photoCount,0),
    emptySummaries: places.filter(p => p.emptySummary).length, missingCoordinates: places.filter(p => p.coordinateMissing).length,
    invalidCoordinates: places.filter(p => p.coordinateInvalid).length,
    bestMonths: season?.bestMonths ?? [], rainyMonths: season?.rainyMonths ?? [],
    seasonOverlap: (season?.bestMonths ?? []).filter(m => season?.rainyMonths?.includes(m)),
    missingCover: !d.places.some(p => p.id === d.coverPlaceId),
    coverSeedDifference: seed && seed.coverPlaceId !== d.coverPlaceId ? { seed: seed.coverPlaceId, catalog: d.coverPlaceId } : null,
    omittedSeedPlaces: seed?.places.filter(s => !d.places.some(p => p.id === s.id)).map(s => ({ id: s.id, name: s.name ?? s.wiki })) ?? [],
    seedOnlyAbsoluteClaims: seed?.places.filter(s => !d.places.some(p => p.id === s.id)).flatMap(s => ['hook','verdictReason','slotReason'].filter(k => s[k] && absolute.test(s[k])).map(field => ({id:s.id, field, text:s[field]}))) ?? [],
    duplicateIds: groups(d.places.map(p => [p.id,p.id])),
    duplicateNames: groups(d.places.map(p => [p.name.normalize('NFC').toLocaleLowerCase('vi'),p.id])),
    duplicateCoordinates: groups(d.places.filter(validCoord).map(p => [`${p.lat.toFixed(5)},${p.lon.toFixed(5)}`,p.id])),
    duplicateSummaries: groups(d.places.filter(p=>!blank(p.summary)).map(p=>[p.summary.trim(),p.id])),
    missingPhotoFields: d.places.flatMap(p=>(p.photos ?? []).flatMap(ph=>['author','license','sourceUrl'].filter(k=>blank(ph[k])))).length,
    places,
  });
}
const draft = rows.filter(d => d.id !== 'ha-giang');
const report = {
  scope: '12 JSON; 11 điểm đến nháp; Hà Giang chỉ đối chiếu số lượng, không xét duyệt lại',
  sourceIntegrity: watched.every(f => fingerprint(f) === inputs[path.relative(root,f).replaceAll('\\','/')]) ? 'PASS' : 'FAIL',
  inputs,
  totals: { destinations: rows.length, draftDestinations: draft.length, draftPlaces: draft.reduce((n,d)=>n+d.placeCount,0), draftPhotos: draft.reduce((n,d)=>n+d.photoCount,0),
    emptySummaries: draft.reduce((n,d)=>n+d.emptySummaries,0), missingCoordinates: draft.reduce((n,d)=>n+d.missingCoordinates,0),
    photoIssues: draft.flatMap(d=>d.places.flatMap(p=>p.photoIssues)).length,
    overlappingPlaces: draft.flatMap(d=>d.places.filter(p=>p.overlapMonths.length)).length },
  crossDestinationDuplicateIds: groups(allPlaces.map(p => [p.id,`${p.destination}/${p.id}`])),
  sharedPhotos: groups(allPlaces.flatMap(p => (p.photos ?? []).map(ph=>[ph.sourceUrl,`${p.destination}/${p.id}: ${ph.file}`]))),
  repeatedTips: groups(allPlaces.filter(p=>p.destination !== 'ha-giang').map(p=>[JSON.stringify(p.tips),`${p.destination}/${p.id}`])),
  destinations: rows,
  limits: ['Không tra mạng trong script; nguồn từng trường tọa độ không được JSON lưu lại.', 'Ngưỡng xa: 60 km, riêng Tà Xùa 90 km theo builder/seed; không chứng minh ghim đúng.', 'Trùng tọa độ làm tròn 5 chữ số chỉ là tín hiệu rà soát.', 'Không kiểm ảnh bằng mắt, không xác nhận giấy phép đang có trên Commons.', 'Exit 0 nghĩa là kiểm tra chạy xong; không phải nội dung đã đạt duyệt.'],
};
fs.writeFileSync(path.join(here,'catalog-check.json'), JSON.stringify(report,null,2)+'\n');
const log = `node docs/content-review/check-catalog.mjs\n${JSON.stringify(report.totals)}\nsourceIntegrity=${report.sourceIntegrity}; snapshot=catalog-check.json; exit=0\n`;
fs.writeFileSync(path.join(here,'catalog-check.log'),log);
console.log(log.trim());
