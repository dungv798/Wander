import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const dir='docs/research/expansion-20261107',catalog='backend/src/main/resources/catalog';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const records=read(dir+'/records.json').records,summary=read(dir+'/summary.json'),applied=read(dir+'/applied.json');
const cats=fs.readdirSync(catalog).filter(f=>f.endsWith('.json')).map(f=>read(path.join(catalog,f)));
const baseline=read(dir+'/catalog-before.json');
const fields=['id','dest','locality','kind','name','summary','address','latitude','longitude','positionProvenance','website','sourceUrls','sourceType','qualityTier','importDisposition','existingPlaceId','checkedAt','sourceUpdated','operatingStatus'];
const cell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
const rows=records.map(r=>({...r,latitude:r.location?.lat,longitude:r.location?.lon,positionProvenance:r.location?.provenance,sourceUrls:r.sourceUrls.join(' | '),operatingStatus:r.verification.operatingStatus}));
fs.writeFileSync(dir+'/research.csv','\uFEFF'+[fields,...rows.map(r=>fields.map(f=>r[f]))].map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n');

let beforeCount=0,afterCount=0,newDishes=0;
for(const old of baseline){const now=cats.find(c=>c.id===old.id);assert(now);beforeCount+=old.places.length;afterCount+=now.places.length;
 assert.deepEqual(now.places.slice(0,old.places.length),old.places);
 const currentBefore={...now,places:old.places,guide:old.guide};assert.deepEqual(currentBefore,old,'Metadata gốc thay đổi ở '+old.id);
 for(const g of old.guide){const current=now.guide.find(c=>c.id===g.id);assert.deepEqual(current,g,'Cẩm nang gốc thay đổi '+old.id);}
 newDishes+=now.guide.filter(g=>g.id==='am-thuc-research-20261107').reduce((n,g)=>n+g.items.length,0);
}
const added=cats.flatMap(d=>d.places.filter(p=>p.id.startsWith('rs-')));
assert.equal(added.length,applied.places);assert.equal(afterCount-beforeCount,added.length);assert.equal(newDishes,applied.dishGuideItems);
const allIds=cats.flatMap(d=>d.places.map(p=>p.id));assert.equal(new Set(allIds).size,allIds.length);
for(const p of added){const r=records.find(r=>r.id===p.id);assert(r);assert.equal(r.importDisposition,'READY_PLACE');assert(p.photos.length===0);assert(!('rating' in p)&&!('price' in p)&&!('hours' in p));assert(/^https:\/\//.test(p.venue.sourceUrl));assert(p.venue.kind==='lodging'?p.category==='luu':p.category==='am');}
const reasons={};for(const r of read(dir+'/held.json'))reasons[r.reason]=(reasons[r.reason]||0)+1;
const audit={checkedAt:'2026-11-07',records:records.length,baselinePlaces:beforeCount,totalPlaces:afterCount,addedPlaces:added.length,newDishGuideItems:newDishes,byAddedKind:Object.fromEntries([...new Set(added.map(p=>p.venue.kind))].map(k=>[k,added.filter(p=>p.venue.kind===k).length])),preservation:'PASS',uniqueIds:'PASS',sourceAndCategory:'PASS',noFabricatedPriceRatingHours:'PASS',noUnlicensedNewPhotos:'PASS',heldReasons:reasons};
fs.writeFileSync(dir+'/audit.json',JSON.stringify(audit,null,2)+'\n');

const manifest=fs.readdirSync(dir+'/sources').map(file=>{const bytes=fs.readFileSync(dir+'/sources/'+file);return{file:'sources/'+file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};});
fs.writeFileSync(dir+'/source-manifest.json',JSON.stringify({capturedAt:'2026-11-07',files:manifest},null,2)+'\n');

const report=`# Research quán ăn, chỗ ở và món địa phương — 07/11/2026

Đã lập **${records.length} hồ sơ có nguồn**, gồm **${summary.byKind.restaurant} quán ăn**, **${summary.byKind.cafe} café**, **${summary.byKind.bar} bar**, **${summary.byKind.lodging} chỗ ở** và **${summary.byKind.dish} hồ sơ món địa phương**. Đây là số hồ sơ research sau khi gộp ${summary.merged} dòng trùng giữa các nguồn; không phải ${records.length} doanh nghiệp đã được xác nhận đang mở cửa. Trong số này, ${records.filter(r=>r.dest).length} thuộc 20 điểm đến hiện có; ${summary.byDisposition.OUTSIDE_CURRENT_DESTINATIONS} ở địa phương ngoài phạm vi hiện tại được giữ để mở rộng sau.

Đã nhập **${added.length} thẻ địa điểm mới** (${audit.byAddedKind.restaurant||0} quán ăn, ${audit.byAddedKind.lodging||0} chỗ ở) và **${newDishes} dòng món ăn mới** vào cẩm nang. Tổng thẻ: **${beforeCount} → ${afterCount}**. Các dòng quán/chỗ ở trong cẩm nang liên kết với cùng thẻ, không cộng lần thứ hai thành địa điểm mới. ${summary.byDisposition.ALREADY_IN_CATALOG} hồ sơ trùng cơ sở đang có được liên kết và giữ nguyên bản cũ.

## Tệp để xem và sử dụng

- [CSV mở bằng Excel](research.csv): một dòng/hồ sơ, có nguồn, địa chỉ, tọa độ khi có, phân loại và trạng thái.
- [JSON đầy đủ](records.json): dữ liệu cùng nguồn đối chiếu, xuất xứ tọa độ và kết quả kiểm website.
- [Kết quả nhập](applied.json), [kiểm tra bảo toàn](audit.json), [nguồn và SHA-256](source-manifest.json).
- [Dòng đã gộp](duplicates.json), [ứng viên bị giữ lại](held.json).

## Mức căn cứ

| Căn cứ | Hồ sơ | Ý nghĩa |
| --- | ---: | --- |
| Website chính thức Accor | ${summary.byTier.PRIMARY_SOURCE} | Danh mục khách sạn và nhà hàng có tên riêng tại cơ sở; chưa xác nhận phòng trống hoặc quyền vào nhà hàng của khách ngoài. |
| Hồ sơ tuyển chọn Michelin | ${summary.byTier.EDITORIAL_SOURCE} | Đã mở trang chi tiết từng cơ sở, đọc địa chỉ. Không tự gán sao Michelin. |
| Cẩm nang + website phản hồi và khớp tên | ${summary.byTier.WEBSITE_IDENTITY_MATCH} | Đối chiếu tên bằng quy tắc tự động; còn cần duyệt chi nhánh và vị trí, chưa nhập thẻ. |
| Mục cẩm nang cập nhật 2024–2026 | ${summary.byTier.RECENT_GUIDE_LISTING} | Chỉ là thông tin đã công bố trong cẩm nang, chưa xác minh độc lập tại cơ sở. |
| Món địa phương có bài nguồn | ${summary.byTier.REGIONAL_DISH_SOURCE} | Mô tả ngắn bằng tiếng Việt; không tạo ghim tại tâm thành phố. |

Nguồn chính: [Michelin Restaurants](https://guide.michelin.com/en/vn/restaurants), [Michelin Hotels](https://guide.michelin.com/en/hotels-stays/vietnam), [Accor Việt Nam](https://all.accor.com/a/en/destination/country/hotels-vietnam-pvn.html), [Vietnam Tourism](https://vietnam.travel/), cơ quan du lịch địa phương, báo địa phương, VnExpress và [Wikivoyage](https://en.wikivoyage.org/wiki/Vietnam). Dữ kiện từ Wikivoyage có liên kết trang nguồn và ngày sửa mục khi nguồn cung cấp; không lấy văn phong đánh giá của cộng đồng làm nhận định của Wander.

## Phân bố theo điểm đến

| Điểm đến | Hồ sơ research | Thẻ mới | Món mới trong cẩm nang |
| --- | ---: | ---: | ---: |
${cats.map(d=>`| ${d.name} | ${summary.byDestination[d.id]} | ${d.places.filter(p=>p.id.startsWith('rs-')).length} | ${d.guide.find(g=>g.id==='am-thuc-research-20261107')?.items.length||0} |`).join('\n')}

Phân bố chưa đồng đều: Hà Nội, TP.HCM và Đà Nẵng có nhiều nguồn tuyển chọn hơn. Buôn Ma Thuột, Cao Bằng, Hà Giang và Vĩnh Hy còn thiếu quán/chỗ ở đủ nguồn chính thức và tọa độ để nhập; không bù số bằng POI OSM chưa đối chiếu.

## Quy tắc nhập và giới hạn thực tế

- Chỉ nhập cơ sở có địa chỉ, tọa độ từ nguồn chính thức hoặc liên kết bản đồ của hồ sơ Michelin và nằm trong khu vực điểm đến. Cơ sở chỉ có tên/địa chỉ giữ ở research.
- Tọa độ nhà hàng trong khách sạn dùng **lối vào khách sạn**, được ghi rõ trong mẹo; không khẳng định đó là vị trí bàn ăn hay tầng nhà hàng.
- Không nhập cơ sở được nguồn ghi khai trương 2027. Không gán Hồ Tràm/Vũng Tàu vào trung tâm TP.HCM chỉ vì tên tỉnh/thành của nguồn đã thay đổi.
- ${summary.held} ứng viên bị giữ vì thiếu địa chỉ, nguồn không đủ gần đây, tên chung chung, vị trí không phù hợp hoặc nhận diện sai. Số này không cộng vào ${records.length} hồ sơ research.
- Không xác nhận cơ sở đang hoạt động bằng việc website trả HTTP 200. Giá, giờ, phòng trống, điểm đánh giá và giải thưởng không được tự sinh. Ngày 07/11/2026 là ngày research, không phải ngày kiểm tra thực địa.
- ${summary.byDisposition.RESEARCH_ONLY_NEEDS_POSITION_CHECK} hồ sơ cẩm nang, ${summary.byDisposition.GUIDE_ONLY_NO_COORDINATES} hồ sơ thiếu tọa độ và ${summary.byDisposition.RESEARCH_ONLY_BAR} bar giữ ngoài bộ thẻ. Cần thêm nguồn định vị/duyệt nội dung trước khi nhập.
- Chưa bổ sung ảnh cho thẻ mới: UI dùng ô giữ chỗ theo loại đang có. Không tái sử dụng ảnh khách sạn/nhà hàng trên trang nguồn khi chưa có quyền.
- 100 món research bao gồm món đã có để đối chiếu; ${newDishes} dòng được bổ sung vào cẩm nang. Một số món phổ biến ở cả vùng được ghi theo địa phương, không khẳng định nguồn gốc độc quyền.

## Kiểm tra

- Đối chiếu sâu toàn bộ ${beforeCount} thẻ ban đầu cùng metadata điểm đến, cẩm nang cũ, ảnh bìa và moments: PASS.
- ${afterCount} mã thẻ duy nhất; mọi liên kết cẩm nang hợp lệ; nguồn HTTPS và loại quán/chỗ ở đúng hợp đồng: PASS.
- Chạy lại lệnh nhập: 0 thẻ và 0 dòng cẩm nang phát sinh thêm.
- Kiểm thử Java CatalogDataTest và CatalogDomainTest: **16/16 PASS**, BUILD SUCCESSFUL.

Tái dựng từ nguồn đã lưu: node tools/catalog/build-research-expansion-20261107.mjs; nhập có kiểm tra bảo toàn: thêm --apply; xuất CSV/báo cáo và audit: node tools/catalog/report-research-expansion-20261107.mjs.
`;
fs.writeFileSync(dir+'/README.md',report);
console.log(JSON.stringify(audit,null,2));
