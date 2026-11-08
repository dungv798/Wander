import fs from 'node:fs';
import {out,read,save,norm} from './complete-research-20261107.mjs';

const list=read(out+'/resolved.json');
const full=read(out+'/geocode-candidates.json'),short=read(out+'/geocode-short-candidates.json');
// Đã đọc từng kết quả, đối chiếu loại đối tượng, tên, đường/khu vực; không chọn mặc định hit đầu.
const selected=[
 ['Zannier Bai San Ho','node/6646112369','Bãi San Hô, Xuân Cảnh/Sông Cầu; đúng khách sạn, không phải điểm trung tâm Tuy Hòa.'],
 ['Six Senses Con Dao','node/13520146104','Chọn đối tượng hotel; loại node bus_stop cùng tên.'],
 ['Namia River Retreat - Wellness Inclusive Resort','way/286443031','Tên đầy đủ, số 232 Trần Nhân Tông, Hội An.'],
 ['New World Phu Quoc Resort','way/1290225377','Chọn resort; loại artwork cùng tên.'],
 ['Mia Resort Nha Trang','way/231784647','Tên MIA Resort, khu Bãi Dông/Cù Hin, đúng vùng Cam Lâm.'],
 ['Azerai La Residence, Hue','way/240266283','Khớp số 5 Lê Lợi và tên La Résidence.'],
 ['Meliá Vinpearl Phu Quoc','way/1279616740','Đúng đối tượng hotel ở Gành Dầu.'],
 ['Meliá Vinpearl Quang Binh','node/11353487631','Đúng khách sạn đường Quách Xuân Kỳ, Đồng Hới.'],
 ['Premier Village Phu Quoc','way/689499246','Chọn beach_resort ở Ông Đội; loại khu thương mại Primavera.'],
 ['La Siesta Premium Saigon','node/11771157069','Khớp tên và đường Lý Tự Trọng tại Bến Thành.'],
 ['Legacy Yen Tu - MGallery','way/793463360','Đúng khách sạn khu Yên Tử.'],
 ['dragonCELLO','node/6354097485','Khớp tên nhà hàng và đường Vệ Hồ; gần tọa độ cẩm nang và liên kết bản đồ website.'],
 ['Press Club','relation/21802492','Đúng tòa nhà Press Club, 59A Lý Thái Tổ; nhà hàng ở tầng trong tòa nhà.'],
 ['Hanoi Club Hotel','way/231049358','Đúng tên, số 76 phố Yên Phụ.'],
 ['The Deck Saigon','node/4751056521','Đúng nhà hàng số 38 Nguyễn Ư Dĩ, Thảo Điền.'],
 ['Diep Anh','node/4221617096','Đúng nhà khách 241/31 Phạm Ngũ Lão.'],
 ['Sanouva Hotel','node/6315686489','Khớp tên và đoạn 175–177 Lý Tự Trọng.'],
 ['Dai A Hotel','node/7095281754','Đúng khách sạn trên đường Yên Bái, gần điểm cẩm nang.'],
 ['Victoria Hoi An Beach Resort and Spa','way/514065082','Đúng tên khu nghỉ và đường Âu Cơ, khu Cửa Đại.'],
 ['IndiaGate','node/10819215405','Đúng nhà hàng Ấn trên đường Bùi Thị Xuân, Đà Lạt.'],
 ['Dalat Edensee Lake Resort & Spa','way/473736708','Đúng khu nghỉ ở hồ Tuyền Lâm; chọn đối tượng resort.'],
 ['Hoàng Yến Hotel','way/741436348','Khớp khách sạn trên An Dương Vương tại Quy Nhơn; loại khách sạn cùng tên tỉnh khác.'],
 ['Khách sạn Sài Gòn – Quy Nhơn','node/1527934304','Tên khách sạn khớp, tại khu giao Nguyễn Huệ và đường 31 Tháng 3; gần ghim cẩm nang.'],
 ['Seagull Hotel','way/741785272','Seagull là Khách sạn Hải Âu trên An Dương Vương, Quy Nhơn.'],
 ['Phong Nha Farmstay','node/1914591738','Chọn đúng Phong Nha Farmstay ở Cự Nẫm/Bố Trạch; loại Eco Mountain Farmstay khác cơ sở.'],
 ['Chay Lap','way/711587546','Đúng Chày Lập Farmstay, không phải các quán cơm chay từ kết quả tên ngắn.'],
 ['Thang Long Restaurant','node/3889399634','Tên đầy đủ và tọa độ trùng website/cẩm nang Ninh Bình; loại nhà hàng Thang Long ở Huế.'],
];
const changes=[];
for(const [name,osm,reason]of selected){for(const r of list.filter(r=>r.name===name)){
 const candidates=[...(full[r.id]?.hits||[]),...(short[r.id]?.hits||[])];const h=candidates.find(h=>h.osm_type+'/'+h.osm_id===osm);if(!h)continue;
 r.location={lat:+h.lat,lon:+h.lon,provenance:'MANUALLY_REVIEWED_NAMED_OSM_WITH_SOURCE_ADDRESS'};r.positionDecision='MANUALLY_REVIEWED_POSITION';r.positionReview={osm,reason,checkedAt:'2026-11-07'};r.sourceUrls=[...new Set([...r.sourceUrls,'https://www.openstreetmap.org/'+osm])];
 if(!r.website&&h.extratags?.website)r.website=h.extratags.website;
 changes.push({id:r.id,name,osm,reason});
}}
const sites=read(out+'/site-position-candidates.json');
for(const r of list){
 if(r.positionDecision?.startsWith('HOLD')&&r.sourceType==='WIKIVOYAGE'&&r.location){
  const match=sites.find(s=>s.records.some(x=>x.id===r.id));
  const same=match?.candidates.find(c=>Math.abs(c.lat-r.location.lat)<0.0004&&Math.abs(c.lon-r.location.lon)<0.0004);
  if(same){r.location={lat:same.lat,lon:same.lon,provenance:'GUIDE_AND_OPERATOR_MAP_AGREE'};r.positionDecision='GUIDE_AND_OPERATOR_MAP_AGREE';r.positionReview={reason:'Tọa độ cẩm nang và bản đồ website cùng cơ sở khớp nhau.',checkedAt:'2026-11-07'};changes.push({name:r.name,decision:r.positionDecision});}
 }
}
// Những kết quả dưới đây đã cho thấy xung đột, sai loại hoặc tạm đóng; không đưa vào apply.
const rejected={
 'Phương Mai Hotel':'Nguồn cẩm nang ghi tạm đóng tháng 10/2026.',
 'Hông Thùy':'Kết quả bản đồ là làng Hồng Thủy, không phải quán ở Hàn Thuyên.',
 'Melia Vinpearl Cam Ranh':'Hai kết quả tìm kiếm là trạm xe buýt, chưa có tọa độ cơ sở phù hợp.',
 'aNhill Boutique':'Kết quả tìm kiếm gắn loại hill; cần thêm nguồn cơ sở trước khi chốt điểm.',
 'Canary Hotel':'Địa chỉ cũ 37 Nguyễn Công Trứ không khớp hai khách sạn Boutique tìm được.',
 "Mr. Peace backpacker's house":'Tên khớp nhưng địa chỉ Nhà Chung khác hồ sơ Hai Bà Trưng; chưa xác nhận chuyển cơ sở.',
 'Hoa Cuong Hotel':'Nguồn ghi Đồng Văn nhưng kết quả là cơ sở Mèo Vạc.',
 'Little View Homestay':'Kết quả Nguyễn Văn Trỗi khác địa chỉ Cầu Mây; giữ chờ đối chiếu.',
 'My Khe Beach Hotel 1 and 2':'Một hồ sơ gộp hai cơ sở, chưa có địa chỉ/ghim riêng cho từng khách sạn.',
};
for(const r of list)if(rejected[r.name]){r.positionDecision='HOLD_SOURCE_CONFLICT';r.positionReview={reason:rejected[r.name],checkedAt:'2026-11-07'};}
// Mục cẩm nang gần đây có ghim gắn trực tiếp với cơ sở là nguồn vị trí được công bố,
// giữ rõ cấp căn cứ này; không đổi nhãn thành tọa độ của website hay kiểm tra thực địa.
for(const r of list)if(r.sourceType==='WIKIVOYAGE'&&r.location&&r.positionDecision==='HOLD'&&/^202[4-6]-/.test(r.sourceUpdated||'')){
 r.positionDecision='RECENT_PUBLISHED_GUIDE_POINT';r.location.provenance='WIKIVOYAGE_NAMED_POINT';
 r.positionReview={reason:'Điểm có tên và địa chỉ trong mục cẩm nang cập nhật '+r.sourceUpdated+'; chưa kiểm tra thực địa.',checkedAt:'2026-11-07'};
 changes.push({id:r.id,name:r.name,decision:r.positionDecision,source:r.sourceUrl,sourceUpdated:r.sourceUpdated});
}
save(out+'/reviewed-positions.json',{checkedAt:'2026-11-07',accepted:changes,rejected});save(out+'/resolved.json',list);
console.log(JSON.stringify({accepted:changes.length,rejected:Object.keys(rejected).length,positionsReady:list.filter(r=>r.kind!=='dish'&&!r.positionDecision?.startsWith('HOLD')).length}));
