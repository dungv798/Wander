// Dựng bản đọc cho PO từ snapshot kiểm tra; các đề xuất bên dưới không sửa dữ liệu nguồn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here,'../..');
const audit = JSON.parse(fs.readFileSync(path.join(here,'catalog-check.json'),'utf8'));
const drafts = audit.destinations.filter(d=>d.id!=='ha-giang');
const data = id => JSON.parse(fs.readFileSync(path.join(root,'backend/src/main/resources/catalog',id+'.json'),'utf8'));
const esc = x => String(x ?? '—').replaceAll('|','\\|').replaceAll('\n',' ');
const table = (headers, rows) => ['| '+headers.join(' | ')+' |','| '+headers.map(()=>'---').join(' | ')+' |',...rows.map(row=>'| '+row.map(esc).join(' | ')+' |')].join('\n');
const months = a => a.length===12 ? 'Quanh năm (1–12)' : a.join(', ');
const wiki = title => `https://vi.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ','_'))}`;
const cat = {canh:'Cảnh quan',van:'Văn hóa',cho:'Chợ / làng nghề',leo:'Leo núi',am:'Ẩm thực',luu:'Lưu trú'};
const verdict = {must:'Nên ưu tiên',worth:'Đáng ghé',ifconv:'Tiện thì ghé'};
const slots = {sang:'sáng',trua:'trưa',chieu:'chiều',toi:'tối'};
const parts = [`# Bản DUYỆT nội dung catalog — 11 điểm đến mới

Ngày rà soát: 28/10/2026. **PROPOSED — chờ PO duyệt; chưa phê duyệt hay sửa catalog/seed.** Hà Giang đã được duyệt từ trước, chỉ xuất hiện ở mục ưu tiên bổ sung.

**Đọc nhanh:** 98 địa điểm / 186 lượt ảnh; 0 mô tả rỗng, 0 thiếu tọa độ; 50 nơi có tháng đẹp trùng tháng mưa. Khuyến nghị giữ Tà Xùa ngoài đợt phát hành này; 10 điểm đến còn lại duyệt sau khi sửa các mục nêu dưới. Mọi lựa chọn cuối cùng thuộc PO.

## 1. Tổng quan

Số liệu lấy từ JSON đang có, không đếm các mục chỉ nằm trong seed. Tháng là nội dung nháp **UNVERIFIED**, không phải kết luận khí hậu đã kiểm chứng.
`,table(['Điểm đến','Địa điểm','Ảnh','Summary rỗng','Thiếu tọa độ','Tháng đẹp nhất (nháp)','Mưa nhiều (nháp)'],drafts.map(d=>[d.name,d.placeCount,d.photoCount,d.emptySummaries,d.missingCoordinates,months(d.bestMonths),months(d.rainyMonths)])),`
## 2. Nội dung từng điểm đến

**Cách đọc nguồn/rủi ro:** “Wikipedia (repo)” là tiêu đề nguồn được JSON ghi và quy trình builder dùng để lấy summary; chưa đối chiếu trực tuyến từng đoạn. Đây không phải bằng chứng cho lời biên tập. JSON không lưu QID/OSM ID hay nguồn riêng từng tọa độ, nên không thể gán chính xác Wikipedia/Wikidata/OSM cho mỗi ghim.

Trong từng hàng, **UNVERIFIED: hook; nhãn + lý do; tháng; mẹo; thời lượng; độ khó; buổi + lý do; highlights** áp dụng riêng cho toàn bộ nội dung của các trường được liệt kê. Các giá trị đều được chép ở hàng đó; không khẳng định chúng sai, nhưng repo không có dẫn chứng gắn từng khẳng định. Mẹo yêu cầu hỏi giờ/giá không phải giờ/giá đã được xác nhận. Nhãn “Nên ưu tiên / Đáng ghé / Tiện thì ghé” tương ứng must / worth / ifconv, là cách đọc trong bản duyệt.

Tagline, lời dẫn mùa, ghi chú mùa và danh sách chuẩn bị bên dưới đều **UNVERIFIED**, từ seed tương ứng (guide trong JSON). Repo không có lời dẫn tổng quan riêng ngoài tagline và summary mùa; không tự viết thêm lời quảng bá. Ảnh ghi số lượng và giấy phép theo metadata repo; liên kết từng ảnh dẫn tới nguồn Commons, chưa xem nội dung toàn bộ ảnh hay xác minh lại toàn bộ giấy phép.
`];
for(const d of drafts) {
  const src=data(d.id), season=src.guide.find(g=>g.id==='mua'), packing=src.guide.find(g=>g.id==='chuanbi');
  parts.push(`### ${d.name} — \`${d.id}\`\n\nNguồn: [JSON](../../backend/src/main/resources/catalog/${d.id}.json) · [seed](../../tools/catalog/seeds/${d.id}.mjs).\n\n**Tagline:** ${src.tagline}\n\n**Lời dẫn mùa:** ${season.summary}\n\n**Ghi chú mùa:** ${season.notes.join(' ')}\n\n**Chuẩn bị:** ${packing.summary} ${packing.items.map(i=>i.title).join('; ')}.\n`);
  parts.push(table(['Tên / mã','Loại','Hook','Nhãn nên đi + lý do','Tháng đẹp','Mẹo','Nguồn mô tả','Ảnh: số lượng + giấy phép','Rủi ro nội dung'],src.places.map(p=>{
    const a=d.places.find(x=>x.id===p.id);
    const licenses=[...new Set(p.photos.map(ph=>ph.license))].join('; ');
    const photoLinks=p.photos.map((ph,i)=>`[${i+1}](${ph.sourceUrl}) ${ph.author}`).join('; ');
    const risk=['UNVERIFIED: hook; nhãn/lý do; tháng; mẹo',`thời lượng: ${p.duration}`,`độ khó: ${p.difficulty}`,`buổi: ${p.bestSlots.map(x=>slots[x]??x).join(', ')} — ${p.slotReason}`];
    if(p.highlights.length) risk.push(`highlights: ${p.highlights.join('; ')}`);
    if(a.defaultedFields.length) risk.push(`Mặc định builder: ${a.defaultedFields.join(', ')}`);
    if(a.overlapMonths.length) risk.push(`Trùng mưa: ${months(a.overlapMonths)}`);
    if(a.absoluteClaims.length) risk.push('Có khẳng định tuyệt đối / bao quát (xem §3)');
    if(a.photoIssues.length) risk.push(...a.photoIssues);
    if(a.absoluteSummary) risk.push('Summary có từ tuyệt đối; có nguồn repo, chưa kiểm chứng');
    if(['ta-xua','bac-yen','ca-na'].includes(p.id)) risk.push('Summary đơn vị hành chính; hook trải nghiệm cần xác định lại đối tượng');
    return [`${p.name} (\`${p.id}\`)`,cat[p.category]??p.category,p.hook,`${verdict[p.verdict]??p.verdict}: ${p.verdictReason}`,`${p.bestLabel}; [${months(p.bestMonths)}]`,p.tips.join(' '),p.wikipediaTitle?`[Wikipedia (repo): ${p.wikipediaTitle}](${wiki(p.wikipediaTitle)})`:'UNVERIFIED — thiếu nguồn',`${p.photos.length} — ${licenses}. ${photoLinks}`,risk.join('<br>')];
  })));
}
parts.push(`## 3. Lỗi và nghi vấn

### 3.1. Đếm, thiếu trường, trùng lặp

- **EVIDENCE:** 12 JSON / 107 địa điểm / 213 ảnh kể cả Hà Giang; 11 bản nháp / 98 địa điểm / 186 ảnh. Không có summary rỗng, tọa độ thiếu hoặc ngoài miền hợp lệ ở 11 bản nháp; không ảnh nào thiếu trường author/license/sourceUrl, không thiếu tệp ảnh, không giấy phép ngoài danh sách cho phép.
- **EVIDENCE:** không trùng ID/tên/summary hay tọa độ làm tròn 5 chữ số trong từng điểm đến; không trùng ID hoặc URL ảnh giữa các điểm đến. Không suy ra rằng mọi nơi/ảnh đã đúng đối tượng.
- **EVIDENCE:** 4 nhóm mẹo giống hệt nhau, lần lượt có ${audit.repeatedTips.map(g=>g.length).join(', ')} nơi (chi tiết trong snapshot). Đây là dấu hiệu nội dung chung, không phải địa điểm trùng. Trường thiếu trong seed được builder gán mặc định theo loại; các dòng đã ghi rõ. Ví dụ Bát Tràng nhận lời khuyên “hàng tươi”, Bắc Yên chọn chiều nhưng lý do mặc định vẫn nhắc sáng/chiều.
- **EVIDENCE:** ảnh \`hoang-thanh-hue-1.jpg\` ghi author = “Wikimedia Commons”, không rỗng nhưng chưa xác định người chụp. [Commons: Ngomon2.jpg](https://commons.wikimedia.org/wiki/File:Ngomon2.jpg) đã đọc ngày 28/10/2026 nêu tác giả **Lưu Ly**, Public domain; đề xuất thay ghi công theo nguồn. Chưa sửa file.

### 3.2. Tháng đẹp trùng mưa

Không có giao nhau ở hai mảng tháng cấp điểm đến; có **50 địa điểm** giao nhau với rainyMonths của điểm đến. Đây là nghi vấn cần diễn giải (tham quan trong nhà/quanh năm hoặc ngắm thác mùa nước), không tự động là lỗi. Chưa có nguồn cho lịch mùa hay độ an toàn. Các tháng cụ thể đã ghi từng hàng; bảng sau gom để PO quét:
`);
parts.push(table(['Điểm đến','Địa điểm — tháng trùng mưa'],drafts.map(d=>[d.name,d.places.filter(p=>p.overlapMonths.length).map(p=>`${p.name}: ${months(p.overlapMonths)}`).join('; ')||'Không'])));
parts.push(`### 3.3. Tọa độ, đối tượng và phạm vi

- **EVIDENCE / UNVERIFIED:** mọi điểm nháp nằm trong ngưỡng builder (60 km đường chim bay; Tà Xùa 90 km). Ngưỡng chỉ lọc rất xa, không xác nhận cổng vào hay điểm ngắm. Các mốc references đều approximate. Địa điểm cách mốc >30 km được liệt kê dưới; không tự kết luận sai vì nhiều điểm thuộc chuyến ngoại ô.
`);
parts.push(table(['Điểm đến','Địa điểm xa mốc gần nhất (>30 km)'],drafts.filter(d=>d.places.some(p=>p.distanceKm>30)).map(d=>[d.name,d.places.filter(p=>p.distanceKm>30).map(p=>`${p.name}: ${p.distanceKm} km`).join('; ')])));
parts.push(`
- **EVIDENCE:** mốc “Tuy Hòa” trong Phú Yên là (13.0882, 109.0929); [Wikipedia: Tuy Hòa (thành phố)](https://vi.wikipedia.org/wiki/Tuy_H%C3%B2a_(th%C3%A0nh_ph%E1%BB%91)) đã đọc ghi (13.08750, 109.31056), chênh khoảng 23,6 km đường chim bay. Đề xuất kiểm tra lại tâm trước khi dùng khoảng cách/lịch trình. Không tự coi tọa độ hành chính là cổng tham quan.
- **UNVERIFIED:** Thiền viện Trúc Lâm Đà Lạt có ghim (11.93071389,108.45953056), trong khi hook nói nhìn hồ Tuyền Lâm và hồ có ghim (11.89968889,108.43231111). Cần đối chiếu vị trí thiền viện/cổng vào thay vì duyệt chỉ vì gần tâm. Chùa Thiên Mụ, Sông Hương và Phố cổ Hội An cũng cần ghim tham quan cụ thể thay cho tâm vùng/dòng sông.
- **EVIDENCE:** Tà Xùa: summary nói xã, hook nói dãy núi và sống lưng; Bắc Yên: summary huyện cũ nhưng hook coi là điểm nghỉ. Cà Ná cũng là summary xã, hook bãi biển. Cần tách rõ đối tượng; ảnh Bắc Yên có tên tệp nguồn nhắc Tà Xùa, chưa chứng minh ảnh đại diện đúng điểm nghỉ.
- **EVIDENCE:** Phú Yên/Quy Nhơn/Vĩnh Hy dùng tên du lịch cũ trong khi summary chứa Đắk Lắk/Gia Lai/Khánh Hòa; không tự kết luận sai hành chính. Cần PO chọn cách giải thích “vùng du lịch” và rà lại area. Ví dụ Nhà thờ Mằng Lăng: area “Tuy Hòa”, summary “Tuy An Đông”; Tháp Hòa Lai: area “Bác Ái”, summary “Thuận Bắc”.

### 3.4. Khẳng định biên tập cần sửa/nguồn

- **CONTRADICTION:** Mũi Điện có hook “cực Đông” và lý do “bình minh sớm nhất cả nước”. [Wikipedia: Mũi Điện](https://vi.wikipedia.org/wiki/M%C5%A9i_%C4%90i%E1%BB%87n), mục Địa lý đã đọc, mô tả xa thứ hai về phía Đông sau Mũi Đôi và là một trong những nơi đón bình minh đầu tiên. Đề xuất bỏ hai khẳng định cực trị, dùng mô tả mũi đất có hải đăng đã có nguồn.
- **UNVERIFIED:** Bưu điện Sài Gòn “miễn phí để vào”; Cầu Rồng biểu diễn cuối tuần; tàu Nha Trang thường khởi hành sáng; mọi thời lượng/độ khó và “ít đông”, “biển êm”, hoạt động lặn/đi tàu. Cần nguồn trực tiếp còn áp dụng hoặc chuyển thành lời gợi ý có điều kiện, không cam kết vận hành/an toàn. Hỏi giá tại quầy không xác nhận miễn phí.
- **EVIDENCE:** nhiều summary được lấy từ Wikipedia vẫn có lời tán dương, ví dụ Po Klong Garai “hùng vĩ và đẹp nhất”. Có tiêu đề nguồn trong repo không đủ xác minh khẳng định cực trị; đề xuất giữ dữ kiện trung tính và dẫn chứng cụ thể.

Danh sách máy quét bắt được ở các trường biên tập của JSON nháp (bao gồm cả “ít nhất”, chỉ là ứng viên rà soát):
`);
parts.push(table(['Điểm đến / địa điểm','Trường — nguyên văn chưa có dẫn chứng riêng'],drafts.flatMap(d=>d.places.flatMap(p=>p.absoluteClaims.map(c=>[`${d.name} / ${p.name}`,`${c.field}: ${c.text}`])))));
parts.push(`### 3.5. Seed có nhưng JSON chưa có

Không có log dựng trong phạm vi bằng chứng này để kết luận vì thiếu ảnh, thiếu tọa độ hay không khớp bài. Builder có thể bỏ mục và đổi ảnh bìa dự phòng. Không lấy số seed làm số nơi sẵn sàng phát hành.
`);
parts.push(table(['Điểm đến','Mục seed chưa có trong JSON'],drafts.filter(d=>d.omittedSeedPlaces.length).map(d=>[d.name,d.omittedSeedPlaces.map(p=>`${p.name} (\`${p.id}\`)`).join('; ')])));
parts.push(`
**EVIDENCE:** Quy Nhơn seed chọn bìa Kỳ Co, JSON chuyển sang Tháp Đôi. Tagline hứa Kỳ Co/Eo Gió nhưng cả hai chưa có trong 7 nơi hiện hành; Vĩnh Hy hứa đồi cát/làng Chăm nhưng hai mục tương ứng không dựng được. Hội An hứa nhà cổ/làng nghề trong khi chưa có các thẻ riêng tương ứng. Chỉ là lệch nội dung được giới thiệu với tập thẻ, không tự sửa tagline.

## 4. Cần PO quyết

**Khuyến nghị (không phải quyết định).** Điều kiện chung **C** cho mọi mục “Duyệt sau khi sửa”: PO duyệt riêng hook/nhãn/mẹo; sửa lời tuyệt đối thành dữ kiện trung tính; gắn nguồn cho mùa/buổi, thời lượng, độ khó và thông tin vận hành hoặc bỏ/chuyển sang gợi ý không cam kết; giải thích tháng quanh năm trùng mưa; thay mẹo mặc định không phù hợp. Chỉ PO duyệt biên tập không làm dữ kiện UNVERIFIED thành đã xác minh. Các sửa dưới đây đều là đề xuất, chưa thực hiện.

| Điểm đến | Đề xuất | Sửa cụ thể trước khi duyệt |
| --- | --- | --- |
| Đà Lạt | Duyệt sau khi sửa | C; xác minh ghim Thiền viện; bỏ “gần như ai”, “nổi bật nhất”; giải thích mùa nước ở Prenn/Datanla/Pongour cùng cảnh báo mưa thay vì gọi chung tháng đẹp. |
| Đà Nẵng | Duyệt sau khi sửa | C; xác minh lịch Cầu Rồng, không hứa biểu diễn cuối tuần khi chưa có nguồn; bỏ “nổi bật nhất/đẹp nhất”; rà ghim/đối tượng Chùa Linh Ứng; xác định có cần phục hồi 2 mục chưa dựng. |
| Hà Nội | Duyệt sau khi sửa | C; nguồn cụ thể cho “lớn nhất/cổ nhất” hoặc bỏ; đổi mẹo “hàng tươi” của Bát Tràng; xác minh quy định Lăng; PO quyết có cần thẻ Phố cổ riêng. |
| TP. Hồ Chí Minh | Duyệt sau khi sửa | C; kiểm chứng/bỏ “miễn phí” ở Bưu điện và “cao nhất” ở Landmark; rà khả năng tham quan Nhà thờ Đức Bà; phân biệt thời lượng tham quan với di chuyển Củ Chi/Cần Giờ; rà mô tả Chợ Lớn là khu vực. |
| Hội An | Duyệt sau khi sửa | C; bỏ “đẹp nhất/quan trọng nhất”; nêu rõ Cù lao Chàm/Mỹ Sơn là chuyến ngoài phố cổ, phụ thuộc vận hành; đổi lời “ngập nhẹ” chưa có nguồn; bổ sung thẻ nhà cổ/làng nghề hoặc chỉnh lời giới thiệu; thêm tối thiểu 5 nơi nếu giữ mục tiêu 10–20. |
| Huế | Duyệt sau khi sửa | C; sửa ghi công Ngomon2 thành Lưu Ly theo Commons; bỏ “đẹp nhất” của lăng Tự Đức; phân biệt Đại Nội với bài nguồn Kinh thành; rà ghim chùa/sông và thời gian đi Lăng Cô/Bạch Mã. |
| Nha Trang | Duyệt sau khi sửa | C; bỏ “hầu hết/êm nhất”; xác minh điều kiện tham quan Bình Ba, tàu và hoạt động biển trước khi gợi ý; nguồn cho “đảo lớn nhất”; thêm ít nhất 2 nơi, ưu tiên tháp Chăm để khớp tagline. |
| Phú Yên | Duyệt sau khi sửa | C; sửa hai cực trị Mũi Điện theo nguồn; kiểm lại tâm Tuy Hòa; sửa area Nhà thờ Mằng Lăng; bỏ “nổi bật nhất”; thêm ít nhất 3 nơi. |
| Quy Nhơn | Duyệt sau khi sửa | C; PO chọn sửa tagline/bìa cho khớp 7 nơi hoặc bổ sung biển thật; nguồn cho “tháp cao nhất”; kiểm mô tả “phía nam” của Đầm Thị Nại (ghim ở phía bắc mốc); thêm ít nhất 3 nơi. |
| Tà Xùa | Bỏ khỏi bản phát hành | Chỉ hoãn đợt này; không xóa dữ liệu. Có 2 thẻ hành chính/vùng rộng, chưa chứng minh điểm sống lưng/cổng vào; không đủ 10–20 nơi. Tách đúng xã/dãy núi, kiểm ghim/ảnh và nội dung an toàn/mùa săn mây trước khi trình lại. |
| Vĩnh Hy | Duyệt sau khi sửa | C; làm rõ phạm vi vùng rộng (Cà Ná 52,4 km); đổi đối tượng xã/bãi biển Cà Ná; rà area Tháp Hòa Lai; bỏ cực trị; bổ sung đồi cát/làng nghề hoặc chỉnh tagline; thêm ít nhất 4 nơi. |

PO có thể chọn **Duyệt** từng bản sau khi xử lý các điểm trên; hiện chưa có cơ sở đề xuất duyệt nguyên trạng. Mục tiêu 10–20 nơi lấy từ DR-023; số lượng không thay thế độ đúng nội dung.

### Ưu tiên bổ sung nơi (<10)

Theo khoảng thiếu tới 10 và mức lệch lời giới thiệu: Tà Xùa → Hội An → Vĩnh Hy → Quy Nhơn → Phú Yên → Nha Trang → Hà Giang. Không thêm địa điểm hành chính chỉ để đủ số. Các ứng viên dưới **chỉ được xác minh có bài Wikipedia thật**, chưa xác nhận có ảnh đạt chuẩn/cổng vào/được phép tham quan. Đã mở đọc các liên kết ngày 28/10/2026; bản tóm tắt dưới chỉ dùng thông tin tối thiểu xác định đối tượng.

| Ưu tiên | Điểm đến / thiếu tới 10 | Ứng viên có nguồn đã đọc | Điều kiện trước khi nhập |
| --- | --- | --- | --- |
| 1 | Tà Xùa: 2 / thiếu 8 | [Thác Dải Yếm](https://vi.wikipedia.org/wiki/Th%C3%A1c_D%E1%BA%A3i_Y%E1%BA%BFm), có trong seed; bài xác định ở Mộc Châu | Chỉ cân nhắc tuyến kết hợp Mộc Châu, không coi là điểm sát Tà Xùa. Chưa xác minh được ứng viên mới sát Tà Xùa nên không đề xuất tên khác; cần nguồn PO/biên tập cho điểm săn mây cụ thể. |
| 2 | Hội An: 5 / thiếu 5 | Chưa có ứng viên mới đủ điều kiện Wikipedia/Wikidata trong lượt tra này | Không dùng các URL không đọc được/404 để chứng minh có bài; ưu tiên xác minh lại nhà cổ/làng nghề trong seed rồi trình tiếp. |
| 3 | Vĩnh Hy: 6 / thiếu 4 | [Làng gốm Bàu Trúc](https://vi.wikipedia.org/wiki/L%C3%A0ng_g%E1%BB%91m_B%C3%A0u_Tr%C3%BAc); bài xác nhận làng nghề | Seed đang tra “Bàu Trúc”; thử tiêu đề bài đúng trong đợt sửa được giao riêng, kiểm ảnh/vị trí; làm rõ thuộc tuyến vùng Phan Rang, không ngay vịnh. |
| 4 | Quy Nhơn: 7 / thiếu 3 | [Cù lao Xanh](https://vi.wikipedia.org/wiki/C%C3%B9_lao_Xanh); bài có tọa độ đảo | Đã có seed nhưng chưa có JSON; cần điều tra lý do bỏ, nguồn ảnh hợp lệ và điều kiện tàu. Không suy ra bài tồn tại là dựng được thẻ. |
| 5 | Phú Yên: 7 / thiếu 3 | [Núi Đá Bia](https://vi.wikipedia.org/wiki/N%C3%BAi_%C4%90%C3%A1_Bia); bài đặt ở khối Đại Lãnh/Đèo Cả | Đã có seed nhưng chưa có JSON; rà area “Tuy An” trong seed và tọa độ/cổng vào, độ khó trước khi nhập. |
| 6 | Nha Trang: 8 / thiếu 2 | [Po Nagar](https://en.wikipedia.org/wiki/Po_Nagar); bài xác định quần thể tháp Chăm ở Nha Trang | Đã có seed Tháp Bà Ponagar nhưng chưa có JSON; rà tiêu đề/liên kết Wikidata và ảnh. Bài tiếng Anh không xác minh lịch/giá hiện hành. |
| 7 | Hà Giang: 9 / thiếu 1 | [Đèo Bắc Sum](https://vi.wikipedia.org/wiki/%C4%90%C3%A8o_B%E1%BA%AFc_Sum); bài xác định trên QL4C | Tránh trùng trải nghiệm Cổng trời Quản Bạ; kiểm tọa độ dừng chân và ảnh. Không mở lại duyệt 9 thẻ cũ. |

## 5. Nguồn và kiểm tra tái lập

- [DR-023](../decisions/DR-023-po-phan-hoi-28-10-du-lieu-ban-do-giao-dien.md), “Quyết định thực hiện” §1–2: nội dung biên tập là nháp, dữ liệu JSON theo ADR-010.
- [ADR-009](../architecture/adr/ADR-009-nguon-dia-diem-mien-phi.md), “Quyết định/Hệ quả”: nguồn mở, ảnh và mô tả có nguồn/giấy phép/tác giả; [ADR-010](../architecture/adr/ADR-010-module-catalog.md), §2, §7, “Hệ quả”: catalog chỉ đọc, kiểm dữ liệu, tham chiếu có thể approximate.
- [Builder](../../tools/catalog/build-catalog.mjs), DEFAULTS/buildPlace/main: nguồn summary, mặc định biên tập, điều kiện bỏ mục, đổi bìa. JSON không lưu revision Wikipedia hay nguồn theo từng trường; cần bổ sung trong một việc được giao riêng nếu muốn kiểm toán đầy đủ.
- Chạy thực tế: \`node docs/content-review/check-catalog.mjs\` → exit 0; [log](catalog-check.log), [snapshot và SHA-256 đầu vào](catalog-check.json). Exit 0 chỉ xác nhận chạy kiểm tra hoàn tất. Script không gọi mạng, không sửa JSON/seed, không chạy test dự án. Log để trong thư mục được giao thay vì .logs/ do giới hạn owned paths.
- Dựng lại bản đọc: \`node docs/content-review/render-review.mjs\`. Nội dung đề xuất là nhận định biên tập tĩnh; nếu catalog đổi cần rà lại, không chỉ chạy script.
- **Giới hạn:** không chạy test dự án (theo yêu cầu); không xem từng ảnh bằng mắt; không kiểm chứng trực tuyến toàn bộ 98 mô tả, tọa độ hoặc khí hậu. Tra công khai chỉ xác minh những nguồn được ghi rõ đã đọc, không coi liên kết tự dựng từ wikipediaTitle là trang đã truy cập.

**Công cụ đã dùng:** skill [wander-debug](../../tools/codex-skills/wander-debug/SKILL.md), đọc file/rg/git status, Node.js kiểm tra dữ liệu, web mở nguồn công khai. Chỉ các tệp trong docs/content-review/ được tạo; không commit/push/deploy. Các quyết định còn chờ trong phạm vi này: 11 lựa chọn duyệt ở §4, cách diễn đạt mùa/thông tin vận hành chưa có nguồn, và thứ tự bổ sung nơi.
`);
fs.writeFileSync(path.join(here,'duyet-noi-dung-catalog.md'),parts.join('\n\n')+'\n');
console.log(`Rendered ${drafts.length} destinations, ${drafts.reduce((n,d)=>n+d.placeCount,0)} place rows.`);
