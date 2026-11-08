import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/research/photo-candidates/curated-2026-11-06/audit.json'),'utf8'));
const {summary,entries}=audit;
const report=[
 '# Kho ảnh và điểm đến — 06/11/2026','',
 'Mở rộng đại diện các vùng Việt Nam; chưa phải danh mục đầy đủ toàn quốc. 136 điểm Discover và 1.434 POI phụ trợ là hai tập khác nhau. POI phụ trợ đã được API đọc, không phải chỉ có trong tài liệu thử nghiệm.','',
 `Hiện có ${summary.destinations} điểm đến, ${entries.reduce((s,e)=>s+e.places,0)} điểm Discover, ${summary.totalPoiPhotos} ảnh POI và ${summary.totalMoments} khoảnh khắc. Mốc trước đợt tuyển 05–06/11: 12 điểm đến, 136 điểm Discover, 270 ảnh POI, 50 khoảnh khắc.`,
 '', '| Điểm đến | Điểm Discover | Ảnh POI | Khoảnh khắc |','|---|---:|---:|---:|',
 ...entries.map(e=>`| ${e.name} | ${e.places} | ${e.photos} | ${e.moments} |`),'',
 '## Kiểm tra và giới hạn','',
 '- So sánh đầy đủ nội dung, ảnh, khoảnh khắc và bìa cũ tại 12 điểm đến với snapshot trước đợt tuyển. Không xoá hoặc ghi đè dữ liệu cũ.',
 '- Từng ảnh Pexels được kiểm tra trang nguồn, tác giả, quyền dùng và xem đầy đủ tỷ lệ trong contact sheet trước khi thêm. Không dùng API Pexels, không cào mạng xã hội. Manifest ghi cả ảnh bị hoãn.',
 '- Unsplash chỉ dùng cho khoảnh khắc/bìa, giữ hotlink và báo lượt dùng; không gán ảnh vùng cho một POI cụ thể.',
 '- Tám bộ ảnh POI mới đã được xem; bỏ các tham chiếu sai địa điểm hoặc không phù hợp với trải nghiệm hiện tại. Giữ tệp trên đĩa để đối chiếu. Không tự lấy ảnh lân cận để lấp chỗ trống.',
 '- Category leo gồm cả đi bộ tham quan và trekking; chi tiết phải nói rõ loại trải nghiệm. Đỉnh/VQG trên bản đồ không phải đầu tuyến hoặc GPX. Thời lượng, giá, giờ và tuyến mở chưa xác minh phải được thể hiện trung thực.',
 '', 'Các điểm mới còn thiếu ảnh POI đúng nơi:',
 ...entries.filter(e=>e.missing.length).map(e=>`- ${e.name}: ${e.missing.join('; ')}.`),'',
 'Bằng chứng: [audit.json](photo-candidates/curated-2026-11-06/audit.json), [Pexels đã duyệt](photo-candidates/pexels-editorial-2026-11-06.json), [sửa ghép nhầm](photo-candidates/national-visual-review-2026-11-06.json).','',
 'Nguồn quyền dùng: [Pexels License](https://www.pexels.com/license/), [Pexels Terms](https://www.pexels.com/terms-of-service/), [Unsplash API Guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines), [Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).',
 ];
fs.writeFileSync(path.join(root,'docs/research/photo-curation-2026-11-06.md'),report.join('\n')+'\n');
console.log(JSON.stringify(summary));
