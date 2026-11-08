import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='docs/research/photo-multisource-20261107',cache='.logs/photo-multisource-20261107';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const files=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json'));
const catalogs=root=>files.map(f=>read(root+'/'+f));
const publicData=catalogs('backend/src/main/resources/catalog'),preview=catalogs(cache+'/preview-catalog'),baseline=read(dir+'/baseline.json');
const venues=ds=>ds.flatMap(d=>d.places.filter(p=>p.venue).map(p=>({...p,destinationId:d.id})));
const before=venues(baseline),pub=venues(publicData),local=venues(preview),identity=p=>p.file||p.url||p.externalUrl;
const oldImages=new Set(before.flatMap(p=>p.photos.map(identity)));
const pubNew=[...new Map(pub.flatMap(p=>p.photos).filter(p=>!oldImages.has(identity(p))).map(p=>[identity(p),p])).values()];
const localNew=[...new Map(local.flatMap(p=>p.photos).filter(p=>!oldImages.has(identity(p))).map(p=>[identity(p),p])).values()];
const direct=p=>p.photos.some(ph=>!ph.caption?.startsWith('Ảnh khách sạn'));
const coverage=vs=>({venues:vs.length,withPhotos:vs.filter(p=>p.photos.length).length,withDirectVenuePhotos:vs.filter(direct).length,withHotelContextOnly:vs.filter(p=>p.photos.length&&!direct(p)).length,withoutPhotos:vs.filter(p=>!p.photos.length).length});
const live=read(dir+'/live-verification.json');assert.equal(live.withPhotos,local.filter(p=>p.photos.length).length);assert(live.browser.every(r=>r.status==='PASS'));
for(const d of publicData)for(const p of d.places)assert(!p.photos.some(ph=>ph.license.includes('-NC')));
const summary={checkedAt:new Date().toISOString(),catalogPlaces:preview.reduce((n,d)=>n+d.places.length,0),destinations:files.length,before:coverage(before),public:coverage(pub),localPreview:coverage(local),newUniquePublicImages:pubNew.length,newUniquePreviewImages:localNew.length,noncommercialImagesOnlyInLocalPreview:localNew.filter(ph=>ph.license.includes('-NC')).length,allNonPhotoFieldsPreserved:read(dir+'/preview-coverage.json').allNonPhotoFieldsPreserved,live};
save(dir+'/coverage.json',summary);
const rows=local.map(p=>{const pp=pub.find(x=>x.id===p.id);return {destinationId:p.destinationId,placeId:p.id,name:p.name,kind:p.venue.kind,publicPhotos:pp.photos.length,previewPhotos:p.photos.length,role:p.photos.length?(direct(p)?'VENUE':'HOTEL_CONTEXT'):'MISSING',sourceUrl:p.venue.sourceUrl};});
save(dir+'/photo-coverage.json',rows);
const csv=s=>'"'+String(s??'').replaceAll('"','""')+'"',columns=Object.keys(rows[0]);
fs.writeFileSync(dir+'/photo-coverage.csv','\uFEFF'+[columns,...rows.map(r=>columns.map(c=>r[c]))].map(r=>r.map(csv).join(',')).join('\n')+'\n');
save(dir+'/missing-photo-queue.json',local.filter(p=>!p.photos.length).map(p=>({placeId:p.id,name:p.name,destinationId:p.destinationId,kind:p.venue.kind,address:p.venue.address,website:p.venue.website,sourceUrl:p.venue.sourceUrl,requirement:'Ảnh đúng chi nhánh, nguồn và quyền dùng xác minh được; xem ảnh trước khi apply.'})));
save(dir+'/new-images.json',localNew.map(p=>({...p,usageScope:p.license.includes('-NC')?'LOCAL_NONCOMMERCIAL_PREVIEW_ONLY':'PUBLIC_CATALOG'})));
fs.writeFileSync(dir+'/README.md',`# Bổ sung ảnh từ nhiều nguồn — 07/11/2026

Đã áp dụng vào app tại http://127.0.0.1:8787. Catalog vẫn có **${summary.catalogPlaces} địa điểm tại ${summary.destinations} điểm đến**, gồm **421 cơ sở ăn uống/lưu trú**. Đợt này chỉ cập nhật ảnh, chú thích và đường dẫn ghi công tác giả; không tạo thêm cơ sở hay thay trường thông tin khác.

| Phạm vi | Có ảnh | Ảnh riêng của cơ sở | Chỉ có ảnh khách sạn chứa quán | Chưa có ảnh |
| --- | ---: | ---: | ---: | ---: |
| Trước đợt này | ${summary.before.withPhotos} | ${summary.before.withDirectVenuePhotos} | ${summary.before.withHotelContextOnly} | ${summary.before.withoutPhotos} |
| Catalog phát hành | ${summary.public.withPhotos} | ${summary.public.withDirectVenuePhotos} | ${summary.public.withHotelContextOnly} | ${summary.public.withoutPhotos} |
| Bản thử cục bộ | ${summary.localPreview.withPhotos} | ${summary.localPreview.withDirectVenuePhotos} | ${summary.localPreview.withHotelContextOnly} | ${summary.localPreview.withoutPhotos} |

Thêm **${summary.newUniquePreviewImages} ảnh độc lập**, gồm ${summary.newUniquePublicImages} ảnh dùng trong catalog phát hành và ${summary.noncommercialImagesOnlyInLocalPreview} ảnh CC BY-NC/BY-NC-SA chỉ dùng cho bản thử phi thương mại. Một ảnh khách sạn có thể xuất hiện ở nhiều nhà hàng trong cùng khách sạn nên số cơ sở được bổ sung ảnh khác số ảnh mới. Các ảnh đó có nhãn “Ảnh khách sạn” và bằng chứng operator. Ảnh lịch sử/nhìn từ khách sạn được chú thích, không dùng để khẳng định diện mạo hiện tại.

Ví dụ được bổ sung: Cục Gạch Quán, Phở 10 Lý Quốc Sư, Mì Quảng 1A, Chả Cá Thăng Long, Bánh Xèo 46A, La Villa, Mercure Bà Nà, Banyan Tree Lăng Cô, Lotte Hà Nội. Bản thử có thêm HAIAN, The Myst, Phong Nha Farmstay, Cassia Cottage, Azerai Huế, Mango Bay, Press Club, Skylight Nha Trang, Bún Chả Cá 109 và Năm Đảnh.

## Nguồn và quyết định duyệt

- Commons và Flickr: ảnh được xem, đối chiếu tên/chi nhánh và giấy phép từ metadata/trang nguồn chính. Tìm thêm bằng tên rút gọn, tên cũ và địa phương. Openverse được dùng để tìm nguồn, không thay bằng chứng cấp phép gốc.
- Unsplash: 2 ảnh đúng khách sạn, dùng hotlink API, ghi công tác giả có liên kết hồ sơ, đã ghi nhận download theo hướng dẫn. Không đưa khóa truy cập vào trình duyệt.
- Website operator, Michelin và cổng du lịch dùng đối chiếu danh tính/quan hệ nhà hàng–khách sạn. Không suy ra quyền sao chép ảnh từ việc ảnh xuất hiện trên trang chính thức.
- Loại ảnh trùng tên ở nước ngoài, chi nhánh cũ không khớp, quảng cáo đăng lại, món ăn không xác định quán, chân dung cá nhân và góc ảnh trùng. Không chèn ảnh món chung để làm tăng tỷ lệ có ảnh.

[Danh sách ảnh mới](new-images.json) giữ tác giả, giấy phép, nguồn, chú thích và phạm vi dùng. [Bằng chứng công khai](../photo-fill-20261107/primary-license-proof.json), [quyết định duyệt](../photo-fill-20261107/reviewed-selections.json), [ảnh Unsplash](unsplash-approved.json), [duyệt bản thử](preview-approved.json), [bằng chứng NC](preview-license-proof.json), [quan hệ khách sạn bổ sung](reviewed-contexts.json).

Nguồn đối chiếu: [Commons reuse](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia), [Flickr licenses](https://www.flickr.com/services/api/flickr.photos.licenses.getInfo.html), [Unsplash guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines), [Capella Hanoi](https://capellahotels.com/en/capella-hanoi/dining), [Press Club](https://www.hanoi-pressclub.com/). Từng ảnh có liên kết nguồn riêng trong manifest.

## Dữ liệu và áp dụng

- Catalog phát hành: backend/src/main/resources/catalog/ và [20 payload hiện tại](../photo-fill-20261107/apply-payload/). Ảnh JPEG mới ở backend/src/main/resources/catalog/photos/; Unsplash giữ URL gốc.
- Ảnh NC và catalog ghép chỉ ở .logs/photo-multisource-20261107/, được gitignore, ngoài tài nguyên đóng gói. Bản thử bind bắt buộc 127.0.0.1, giữ database wander_e2e và khóa khôi phục hiện có. Xem [phạm vi](SCOPE.md) và [runtime đã xác minh](runtime-applied.json).
- [Thống kê](coverage.json), [CSV theo cơ sở](photo-coverage.csv), [hàng chờ ${summary.localPreview.withoutPhotos} cơ sở thiếu ảnh](missing-photo-queue.json). Đây chưa phải catalog đầy đủ ảnh.
- Công cụ apply: tools/catalog/apply-photo-fill-20261107.mjs, curate-unsplash-venues-20261107.mjs và local-preview-photos-20261107.mjs. Không chạy lại apply-completion-20261107.mjs vì đó là snapshot trước đợt ảnh.

## Kiểm tra

31 kiểm tra backend catalog/domain/API, checkstyle và bootJar đã qua; frontend typecheck, lint, 436 kiểm tra và build đã qua. Lần kiểm tra cuối xác nhận metadata ảnh cho toàn bộ 704 địa điểm, **${live.uniqueImageUrlsVerified} URL ảnh cơ sở** trả JPEG hợp lệ (ảnh cục bộ khớp SHA-256), không có ảnh NC trong catalog phát hành, và **${live.browser[0].venuesChecked} cơ sở trên mỗi màn hình 390px/1440px** hiển thị ảnh/ghi công không tràn khung hay lỗi JavaScript. Luồng chọn cơ sở, lưu và tải lại chuyến đi đã qua trên cả hai kích thước màn hình.

Bằng chứng: [live-verification.json](live-verification.json), .logs/photo-multisource-20261107/live-browser/, trip-browser/result.json, backend-verification.log, backend-style-build.log, frontend-tests.log và frontend-build.log. Kết quả build đầu có một lỗi checkstyle hằng chuỗi đã sửa; lần checkstyle/build sau đã qua.
`);
console.log(JSON.stringify({...summary,live:undefined}));
