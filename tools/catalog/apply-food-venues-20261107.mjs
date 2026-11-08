/** Chỉ nhập ứng viên đã đối chiếu nguồn và xem ảnh; luôn bảo toàn dữ liệu đầu đợt. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const dir='backend/src/main/resources/catalog',venueFile='docs/research/venue-candidates-20261107.json',dishFile='docs/research/dish-candidates-20261107.json';
const venues=JSON.parse(fs.readFileSync(venueFile,'utf8')),dishes=JSON.parse(fs.readFileSync(dishFile,'utf8'));
const baseline=JSON.parse(fs.readFileSync('.logs/food-venues-stays-before-20261107.json','utf8'));
const catalogs=new Map(baseline.map(x=>[x.data.id,JSON.parse(fs.readFileSync(path.join(dir,x.file),'utf8'))]));
const selections={
 'ha-noi-metropole':21802486,'ho-chi-minh-majestic':193142038,'hue-saigon-morin':239566031,
 'hoi-an-anantara':2271214793,'da-nang-haian-beach':693058159,'da-lat-dalat-palace':407699702,
 'phu-quoc-cassia-cottage':13437202908,'can-tho-victoria':168424431,'cao-bang-muong-thanh':1149062825,
 'ninh-binh-tam-coc-garden':5514399176,'phong-nha-farmstay':1914591738,'sa-pa-paos':12824980787,
 'vinh-hy-vinh-hy-resort':4378204809,
 'nha-trang-havana':650959856,'ha-long-wyndham-legend':1278946629,
 'ha-noi-giang':4311854914,'hoi-an-roastery':4597386290,'da-nang-43-factory':1181332013,'da-lat-la-viet':4601279191,'buon-ma-thuot-lang-ca-phe':2494793015,
 'hoi-an-banh-mi-phuong':4279536690,'phong-nha-pub-cold-beer':4279348989,'ha-noi-pho-bat-dan':5116302421,'da-nang-ba-duong':4541527689,
 'hoi-an-white-rose':6114429391,'hoi-an-madam-khanh':9938321717,
};
const sources={
 'hoi-an-anantara':'https://www.anantara.com/en/hoi-an/contact',
 'da-nang-43-factory':'https://43factory.coffee/location/',
 'da-lat-la-viet':'https://laviet.coffee/en/from-out-place/',
 'hoi-an-banh-mi-phuong':'https://hoianworldheritage.org.vn/en/news/Hoi-An-Travel/explore-the-food-of-hoi-an-751.hwh',
};
const photoPicks={'ha-noi-metropole':[3,2],'ho-chi-minh-majestic':[2,1],'hue-saigon-morin':[1,2],'da-lat-dalat-palace':[3,1],'ha-noi-giang':[1,2]};
const dishPicks={'ha-noi-cha-ca':[1,2],'ha-noi-bun-thang':[1],'ho-chi-minh-banh-trang-tron':[1,3],'ho-chi-minh-bot-chien':[1,2],'ho-chi-minh-goi-cuon':[1],'hue-com-hen':[1],'hue-banh-nam':[1],'hoi-an-banh-vac':[1],'da-nang-banh-trang-thit-heo':[1,2],'buon-ma-thuot-com-lam':[2],'ta-xua-thit-gac-bep':[2,3]};
const result={checkedAt:'2026-11-07',venues:[],dishes:[],guideAdditions:[],photoRefs:0,heldVenues:[]};
/** Ảnh đúng chủ thể, có giấy phép; không ghi đè tệp cùng tên khác nội dung. */
function photosOf(candidates,picks,stage){return picks.map(i=>{const p=candidates[i-1];assert.ok(p,'Ảnh chưa tuyển');const src=path.join(stage,p.file),dest=path.join(dir,'photos',p.file),bytes=fs.readFileSync(src);if(fs.existsSync(dest))assert.ok(bytes.equals(fs.readFileSync(dest)));else fs.writeFileSync(dest,bytes);result.photoRefs++;return{file:p.file,author:p.author,license:p.license,sourceUrl:p.source};});}
/** Một thẻ mới với nhãn chưa biết rõ ràng, không giả giá/giờ/rating hay độ khó cho quán và khách sạn. */
function base(id,name,category,area,hook,lat,lon){return{id,name,category,area,hook,summary:hook,lat,lon,bestMonths:[],bestLabel:'Xác nhận với nơi bạn chọn',duration:category==='luu'?'Bạn chọn ngày nhận phòng':'Tùy bữa ăn và nơi bạn chọn',difficulty:'Không áp dụng',highlights:[],verdict:'worth',verdictReason:'Gợi ý biên tập để bạn cân nhắc theo nhu cầu.',bestSlots:[],slotReason:'Xác nhận giờ phục vụ và khả năng đón khách trước khi đi.',tips:[],photos:[],wikipediaTitle:null};}
for(const [key,osmId]of Object.entries(selections)){
 const v=venues['venue-'+key],d=catalogs.get(v.dest);assert.ok(v&&d,key);
 const hit=[...(v.hits??[]),...(v.shortHits??[]),...(v.boundedHits??[])].find(h=>h.osm_id===osmId);assert.ok(hit,'Không có vị trí đã đối chiếu '+key);
 v.approved=true;v.selectedOsm={type:hit.osm_type,id:hit.osm_id,lat:Number(hit.lat),lon:Number(hit.lon),name:hit.display_name};v.reviewNotes='Đã đọc nguồn chính thức và đối chiếu đúng cơ sở/địa chỉ, không chọn hit đầu tự động.';
 const p=base(v.id,v.name,v.kind==='lodging'?'luu':'am',d.name,v.focus,Number(hit.lat),Number(hit.lon));
 p.venue={kind:v.kind,address:v.address,website:key==='hoi-an-banh-mi-phuong'||v.url.includes('guide.michelin.com')?'':v.url,sourceUrl:sources[key]??v.sourceUrl??v.url,checkedAt:'2026-11-07'};
 p.highlights=v.kind==='lodging'?['Chỗ ở tham khảo','Chọn ngày nhận phòng']:v.kind==='cafe'?['Nghỉ chân','Chọn đồ uống tại quán']:['Địa chỉ cụ thể','Chọn món tại quán'];
 p.summary=v.focus+(v.kind==='lodging'?' So sánh hạng phòng, điều kiện hủy và tổng giá theo ngày trước khi đặt.':v.kind==='cafe'?' Xem lựa chọn đồ uống và chỗ ngồi trước khi ghé.':' Hỏi thành phần, khẩu phần và giá trước khi gọi món.');
 p.tips=[v.kind==='lodging'?'Lưu vào chuyến để cân nhắc chỗ nghỉ; việc lưu không phải là đặt phòng.':'Kiểm tra giờ phục vụ và thực đơn hiện tại trên nguồn của cơ sở.',`Địa chỉ: ${v.address}`,`Nguồn vị trí: https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`];
 if(key==='da-lat-la-viet')p.tips.push('Website cơ sở ghi 200 Nguyễn Công Trứ; điểm OSM hiện ghi 198 cùng đoạn đường. Xác nhận cửa vào khi đến.');
 p.photos=photosOf(v.photoCandidates??[],photoPicks[key]??[],'.logs/venue-photos-20261107');v.approvedPhotos=photoPicks[key]??[];
 if(!d.places.some(old=>old.id===p.id))d.places.push(p);result.venues.push({id:p.id,dest:d.id,kind:v.kind,photos:p.photos.length});
 const sectionId=v.kind==='lodging'?'cho-o-tham-khao-20261107':'quan-xa-tham-khao-20261107';let guide=d.guide.find(g=>g.id===sectionId);
 if(!guide){guide={id:sectionId,layout:'CARDS',category:p.category,icon:v.kind==='lodging'?'bed':'tools-kitchen-2',title:v.kind==='lodging'?'Chỗ ở để cân nhắc':'Quán để ghé',summary:v.kind==='lodging'?'Chọn chỗ nghỉ theo vị trí, ngày đi và ngân sách.':'Từ món muốn thử đến một điểm dừng cụ thể.',items:[]};d.guide.push(guide);}
 if(!guide.items.some(i=>i.placeId===p.id))guide.items.push({icon:v.kind==='lodging'?'bed':v.kind==='cafe'?'coffee':'tools-kitchen-2',title:p.name,text:v.focus,placeId:p.id});
}
for(const c of Object.values(dishes)){
 const d=catalogs.get(c.dest),key=c.id.replace('exp-food-',''),picks=dishPicks[key]??[];c.approved=picks;c.reviewedAt='2026-11-07';c.reviewNotes=picks.length?'Đã xem ảnh đúng món, loại ảnh lặp và ảnh khác món/vùng. Ảnh minh họa món, không đại diện quán.':'Chỉ giữ ý tưởng trong cẩm nang; thiếu ảnh đúng món/vùng, không lấy ảnh không liên quan.';
 let guide=d.guide.find(g=>g.id==='an');if(!guide){guide={id:'an',layout:'CARDS',category:'am',icon:'tools-kitchen-2',title:'Ăn gì',summary:'Chọn một món để bắt đầu chuyến khám phá.',items:[]};d.guide.push(guide);}
 const duplicate=d.places.find(p=>p.name===c.name&&p.category==='am');
 if(!duplicate&&picks.length&&!d.places.some(p=>p.id===c.id)){
 const anchor=d.references[0],p=base(c.id,c.name,'am',`Mốc khu vực ${d.name}`,c.summary,anchor.lat,anchor.lon);p.summary=c.summary+' Đây là ý tưởng thử món; chọn quán trước khi chốt điểm dừng.';p.highlights=['Món muốn thử','Chọn quán sau'];p.tips=['Ghim là mốc khu vực, không phải địa chỉ quán đã xác minh.','Ảnh minh họa món, không đại diện cho một quán cụ thể hoặc phiên bản riêng của vùng.',`Tìm hiểu thêm: ${c.sourceUrl}`];p.photos=photosOf(c.candidates,picks,'.logs/dishes-20261107');p.wikipediaTitle=c.wikipediaTitle;d.places.push(p);result.dishes.push(p.id);
 }
 if(!guide.items.some(i=>i.title===c.name)){const target=duplicate?.id??(d.places.some(p=>p.id===c.id)?c.id:null);guide.items.push({icon:'tools-kitchen-2',title:c.name,text:c.summary,placeId:target});result.guideAdditions.push({dest:d.id,name:c.name,placeId:target});}
}
for(const v of Object.values(venues))if(!v.approved){v.reviewNotes??='Giữ ngoài catalog: chưa đủ nguồn chính thức hoặc chưa đối chiếu vị trí/chi nhánh.';result.heldVenues.push(v.id);}
// Append-only được kiểm trước khi ghi bất kỳ catalog nào, kể cả các mục guide cũ.
for(const {file,data:old}of baseline){const d=catalogs.get(old.id);assert.deepEqual(d.places.slice(0,old.places.length),old.places);assert.deepEqual(d.moments,old.moments);assert.deepEqual(d.coverPhoto,old.coverPhoto);for(const g of old.guide){const now=d.guide.find(i=>i.id===g.id);assert.deepEqual({...now,items:now.items.slice(0,g.items.length)},g);}assert.equal(new Set(d.places.map(p=>p.id)).size,d.places.length);}
for(const d of catalogs.values())fs.writeFileSync(path.join(dir,d.id+'.json'),JSON.stringify(d,null,2)+'\n');
fs.writeFileSync(venueFile,JSON.stringify(venues,null,2)+'\n');fs.writeFileSync(dishFile,JSON.stringify(dishes,null,2)+'\n');fs.writeFileSync('docs/research/food-venues-applied-20261107.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
