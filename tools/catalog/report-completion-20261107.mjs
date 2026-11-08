import fs from 'node:fs';
import assert from 'node:assert/strict';
import {input,out,read,save} from './complete-research-20261107.mjs';
const audit=read(out+'/apply-audit.json'),s=audit.summary,profiles=read(out+'/profiles.json').records;
assert(audit.appliedToCatalog,'Run the reviewed apply command before reporting.');
const cats=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));
for(const d of cats)assert.deepEqual(d,read(out+'/apply-payload/'+d.id+'.json'));
const all=cats.flatMap(d=>d.places),apps=new Map(audit.recordApplications.map(a=>[a.recordId,a]));
const venues=audit.events.map(e=>({entityType:'VENUE',destinationId:e.dest,place:all.find(p=>p.id===e.id),sourceRecordIds:e.records,sourceUrls:[...new Set(e.records.flatMap(id=>profiles.find(r=>r.id===id).sourceUrls))]}));
const dishes=profiles.filter(r=>r.kind==='dish').map(r=>({entityType:'REGIONAL_DISH',id:r.id,destinationId:r.dest,guideItem:r.guideItem,sourceUrls:r.sourceUrls,application:apps.get(r.id).action}));
assert.equal(venues.length,400);assert.equal(dishes.length,100);
save(out+'/ready-500.json',{schemaVersion:1,checkedAt:'2026-11-07',venues,dishes,coverage:{phone:s.withPhone,serviceHours:s.withHours,priceNote:s.withPriceNote,venuePhotos:s.withPhotos},photoPolicy:'Venue photos are optional in the existing Place contract; only approved named-business photos are attached.'});
save(out+'/held-112.json',audit.blocked);
// CSV để review bằng Excel; chặn ký tự bắt đầu công thức. JSON là payload để apply.
const csvCell=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
const cols=['recordId','name','kind','destination','canonicalPlaceId','status','address','phone','serviceHours','priceNote','website','summary','highlights','tips','lat','lon','photos','sourceUrls','checkedAt'];
const lines=profiles.map(r=>{
 const app=apps.get(r.id),p=app?.placeId?all.find(p=>p.id===app.placeId):r.place;
 return [r.id,r.name,r.kind,r.dest||r.targetDestination||'',app?.placeId||'',app?.action||r.completion.problems?.join('|'),p?.venue.address,p?.venue.phone,p?.venue.serviceHours,p?.venue.priceNote,p?.venue.website,p?.summary||r.summary,p?.highlights?.join(' | '),p?.tips?.join(' | '),p?.lat,p?.lon,p?.photos?.length??0,r.sourceUrls.join(' | '),'2026-11-07'];
});
fs.writeFileSync(out+'/all-620.csv','\uFEFF'+[cols,...lines].map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n');
const blockedKinds={};for(const r of audit.blocked){const key=!r.dest?'Ngoài 20 điểm đến hiện có':r.position==='HOLD_SOURCE_CONFLICT'?'Mâu thuẫn địa chỉ/loại đối tượng hoặc tạm đóng':r.problems.includes('CONTENT_NEEDS_REVIEW')?'Thiếu nội dung riêng đủ căn cứ':'Cần đối chiếu vị trí';blockedKinds[key]=(blockedKinds[key]||0)+1;}
const kinds={};for(const r of venues)kinds[r.place.venue.kind]=(kinds[r.place.venue.kind]||0)+1;
const md=`# Hoàn thiện dữ liệu để áp dụng — 07/11/2026

Đã cập nhật trực tiếp 20 tệp catalog của app. Tổng catalog từ **${s.catalogBefore} lên ${s.catalogAfter} thẻ**. Đợt hoàn thiện có **400 cơ sở riêng biệt và 100 món địa phương**, đóng gói trong [ready-500.json](ready-500.json).

400 cơ sở gồm **${kinds.restaurant} quán ăn, ${kinds.cafe} café, ${kinds.bar} bar và ${kinds.lodging} chỗ ở**. Trong đó 297 thẻ nhập đợt trước được bổ sung nội dung, 98 cơ sở được thêm mới và 5 cơ sở có sẵn được bổ sung metadata. 8 cặp hồ sơ cùng cơ sở được gộp, giữ ID đã có khi có thể. 100 món địa phương gồm 81 mục cẩm nang của đợt research và 19 món đã được thể hiện trong các mục biên tập trước đó.

## Nội dung đã có trong app

Mỗi cơ sở được áp dụng có tên, loại hình, khu vực, mô tả ngắn và chi tiết, tọa độ gắn với cơ sở, điểm nổi bật, lý do gợi ý, lưu ý, địa chỉ, nguồn và ngày đối chiếu. Lịch phục vụ, số liên hệ, website và phân khúc giá chỉ nhập khi có căn cứ. Các thẻ cũ vẫn đọc được với metadata mới là tùy chọn.

| Trường có dữ liệu | Số cơ sở / 400 |
|---|---:|
| Số liên hệ | ${s.withPhone} |
| Website | ${venues.filter(r=>r.place.venue.website).length} |
| Giờ phục vụ hoặc giờ nhận/trả phòng | ${s.withHours} |
| Phân khúc giá Michelin | ${s.withPriceNote} |
| Ảnh cơ sở đã duyệt | ${s.withPhotos} |

Ảnh là trường tùy chọn của Place hiện tại. Đã thêm **11 ảnh cho 8 cơ sở**, xác nhận chủ thể bằng cách xem ảnh và đối chiếu giấy phép trên trang Flickr gốc; tổng 9/400 cơ sở trong nhóm này có ảnh, bao gồm ảnh đã có. 391 cơ sở còn dùng placeholder. [approved-photos.json](approved-photos.json) ghi tác giả, giấy phép, nguồn và bằng chứng kiểm tra. Không dùng ảnh món chung để minh họa một nhà hàng cụ thể. Ảnh Hồng Phát ở 58 Phan Văn Trị bị loại vì khác chi nhánh Võ Văn Tần; ảnh Novotel Đà Nẵng được sửa khỏi kết quả gắn nhầm Nha Trang.

Phân khúc Michelin là mức chi tiêu định tính, không phải giá niêm yết. Giá món theo số tiền, giá phòng, phòng trống và khả năng đặt bàn chưa được thu thập đầy đủ. Ngày đối chiếu nguồn không thể hiện việc gọi điện hay kiểm tra hoạt động thực địa. Lịch phục vụ có thể thay đổi vào ngày lễ. Tháng đẹp và buổi ghé để trống khi không có dữ liệu riêng của cơ sở; không suy từ lịch tham quan điểm đến.

## Nguồn và vị trí

- [MICHELIN Guide Việt Nam](https://guide.michelin.com/en/vn/restaurants): mô tả riêng, địa chỉ, lịch, số liên hệ và phân khúc được trích từ trang cơ sở đã lưu ở đợt research trước.
- [Accor Việt Nam](https://all.accor.com/a/en/destination/country/hotels-vietnam-pvn.html): hồ sơ khách sạn và từng nhà hàng có tên; ghim nhà hàng trong khách sạn được ghi rõ là lối vào khách sạn.
- [Vietnam Travel](https://vietnam.travel/) cùng các bài địa phương được dẫn trong từng hồ sơ món. Món vùng miền nằm trong cẩm nang, không nhận tọa độ tâm thành phố để giả làm quán.
- Website của cơ sở, [Wikivoyage](https://en.wikivoyage.org/wiki/Vietnam) và [OpenStreetMap](https://www.openstreetmap.org/copyright) bổ sung nhận diện/vị trí. Các điểm từ cẩm nang gần đây được giữ nhãn căn cứ và lưu ý xác nhận lối vào; không đổi thành nhãn tọa độ website.

Đã sửa các nhận diện địa phương sai do tên món/quán chứa Huế, Hội An hoặc đường Nguyễn Huệ. Salinda dùng điểm cơ sở !3d/!4d từ liên kết bản đồ website; loại ghim văn phòng TP.HCM và tọa độ tâm khung nhìn. Chi tiết ở [primary-position-review.json](primary-position-review.json), [salinda-official-map.json](salinda-official-map.json) và [reviewed-positions.json](reviewed-positions.json).

## Hồ sơ còn chờ

Giữ riêng **${s.blocked} hồ sơ** trong [held-112.json](held-112.json), có lý do theo từng dòng:

${Object.entries(blockedKinds).map(([k,n])=>'- '+k+': '+n+'.').join('\n')}

Không ép địa điểm Hồ Tràm, Vũng Tàu, Côn Đảo hay Đồng Hới vào một điểm đến gần đó. Phương Mai Hotel có ghi chú tạm đóng tháng 10/2026; các kết quả trạm xe buýt, ngọn đồi hay khách sạn cùng tên khác địa chỉ được giữ ngoài.

## Tệp sử dụng

- [ready-500.json](ready-500.json): 400 thẻ cơ sở với đủ trường Place và 100 mục món địa phương, nguồn, độ phủ metadata.
- [apply-payload](apply-payload/): 20 tệp điểm đến cuối cùng, cùng cấu trúc catalog backend.
- [all-620.csv](all-620.csv): toàn bộ nghiên cứu và trạng thái áp dụng, để lọc/review bằng Excel.
- [apply-audit.json](apply-audit.json): thay đổi, gộp ID, liên kết cẩm nang và hồ sơ chưa đủ căn cứ.
- [profiles.json](profiles.json): 620 hồ sơ đã bổ sung, gồm cả hồ sơ chưa áp dụng; xem audit để lấy trạng thái cuối.

## Kiểm tra

Toàn bộ payload được kiểm trước khi ghi: độ dài/kiểu trường, ID duy nhất, URL HTTPS, tọa độ, tệp ảnh/ghi công và liên kết cẩm nang. Giữ nội dung 309 thẻ trước research, bìa, moments và guide biên tập trước đó; 5 venue gốc được bổ sung metadata và ảnh đã duyệt.

Kết quả chạy mã và giao diện được ghi ở [verification.json](verification.json). Giao diện kiểm 390 px và 1440 px với quán ăn, bar và khách sạn; dùng JSON catalog thật qua API giả lập cô lập. Kiểm tra API backend dùng Spring và PostgreSQL trong Testcontainers.

## Tái lập

Các nguồn đầu vào đã lưu trong [đợt research trước](../expansion-20261107/README.md). Không chạy lại builder nhập thưa của đợt đó lên catalog đã hoàn thiện. Các bước bổ sung trong đợt này:

\
\
    node tools/catalog/completion-position-review-20261107.mjs
    node tools/catalog/completion-contact-review-20261107.mjs
    node tools/catalog/completion-primary-position-review-20261107.mjs
    node tools/catalog/completion-profiles-20261107.mjs
    node tools/catalog/apply-completion-20261107.mjs --apply
    node tools/catalog/report-completion-20261107.mjs

Builder kiểm tra catalog hiện tại khớp baseline hoặc payload đợt trước trước khi ghi, tránh ghi đè chỉnh sửa phát sinh sau review. Ảnh đã duyệt và metadata giấy phép nằm trong repo; không cần tải lại ảnh khi áp dụng payload.
`;
fs.writeFileSync(out+'/README.md',md.replace('\\\n\\\n',''));
if(fs.existsSync(out+'/runtime-applied.json')){
 const live=read(out+'/runtime-applied.json');
 fs.appendFileSync(out+'/README.md','\n## Đã áp dụng vào app đang chạy\n\nBản backend mới đã chạy tại [localhost:8787](http://localhost:8787/), trả đúng '+live.api.catalogPlaces+' thẻ và '+live.api.destinations+' điểm đến. Đã đối chiếu 400 hồ sơ cơ sở qua API thật, mở 5 loại thẻ trên mỗi kích thước 390/1440 px và lưu thử 2 chuyến bằng danh tính kiểm tra riêng. Quán ăn, bar và khách sạn giữ đúng loại khi lưu; tải lại vẫn giữ các mục. Database hiện có và recovery key được giữ nguyên, schema không cần migration. Xem [runtime-applied.json](runtime-applied.json).\n');
}
const previous=input+'/README.md',old=fs.readFileSync(previous,'utf8'),notice='> **Đã có đợt hoàn thiện tiếp theo:** xem [bản áp dụng 500 mục](../completion-20261107/README.md). Số lượng và các trường còn thiếu dưới đây là trạng thái của đợt nhập ban đầu.\n\n';
if(!old.includes('completion-20261107/README.md'))fs.writeFileSync(previous,notice+old);
console.log(JSON.stringify({ready:venues.length+dishes.length,venues:venues.length,dishes:dishes.length,catalog:all.length,csvRows:lines.length,held:audit.blocked.length}));
