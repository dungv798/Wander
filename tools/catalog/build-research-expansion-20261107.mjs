import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import foods from './research-local-foods-20261107.mjs';

const root='docs/research/expansion-20261107',dir='backend/src/main/resources/catalog';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const save=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const norm=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/&(?:amp|nbsp);/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
const plain=s=>String(s??'').replace(/<[^>]*>/g,' ').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const cats=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>read(path.join(dir,f)));
// Chuẩn hóa mã của chính đợt research này nếu dữ liệu nháp từng cắt tên ngay tại dấu nối.
for(const d of cats){for(const p of d.places)if(p.id.startsWith('rs-'))p.id=p.id.replace(/-+/g,'-');for(const g of d.guide)for(const i of g.items)if(i.placeId?.startsWith('rs-'))i.placeId=i.placeId.replace(/-+/g,'-');}
const byDest=new Map(cats.map(d=>[d.id,d]));
const baselineFile=root+'/catalog-before.json';
const originalByDest=new Map((fs.existsSync(baselineFile)?read(baselineFile):cats).map(d=>[d.id,d]));
const radii={'ha-noi':35,'ho-chi-minh':30,'da-nang':45,'hoi-an':30,'hue':80,'da-lat':30,'nha-trang':65,'phu-yen':110,'quy-nhon':60,'ha-giang':130,'cao-bang':100,'sa-pa':35,'ta-xua':30,'vinh-hy':45,'phong-nha':50,'ninh-binh':60,'ha-long':80,'can-tho':40,'buon-ma-thuot':70,'phu-quoc':55};
function km(a,b){const rad=n=>n*Math.PI/180;const h=Math.sin(rad(a.lat-b.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(a.lon-b.lon)/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
function destination(name,locality,address,location){
 const t=norm([name,locality,address].join(' '));let dest;
 const rules=[['phu-quoc',/phu quoc/],['hoi-an',/hoi an|hoiana|nam hai/],['phu-yen',/phu yen|tuy hoa|xuan canh|bai san ho|song cau/],['hue',/lang co|\bhue\b/],['nha-trang',/nha trang|cam ranh|ninh van/],['da-lat',/da lat|dalat/],['quy-nhon',/quy nhon|quy nhon/],['ha-long',/ha long|halong|yen tu|quan lan/],['sa-pa',/sapa|sa pa/],['ninh-binh',/ninh binh/],['can-tho',/can tho/],['vinh-hy',/vinh hy|amanoi/],['ha-noi',/hanoi|ha noi|hoan kiem/],['ho-chi-minh',/ho chi minh|saigon|sai gon|district [137]/],['da-nang',/da nang|danang/]];
 dest=rules.find(([,r])=>r.test(t))?.[0];
 if(dest&&location&&km(location,byDest.get(dest).references[0])>radii[dest])return null;
 return dest||null;
}
function https(u){try{const url=new URL(u);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}}
const records=[],held=[],duplicates=[];
function add(r){
 r.sourceUrls=[...new Set((r.sourceUrls||[r.sourceUrl]).filter(https))];
 if(!r.name||!r.sourceUrls.length){held.push({...r,reason:'MISSING_IDENTITY_OR_SOURCE'});return;}
 r.id='rs-'+(r.dest||'vietnam')+'-'+norm(r.name).replaceAll(' ','-').slice(0,24).replace(/-+$/,'')+'-'+hash(r.sourceUrl+'|'+r.name).slice(0,8);
 r.checkedAt='2026-11-07';r.verification={identity:r.sourceType==='OFFICIAL_OPERATOR'?'OPERATOR_LISTED':r.sourceType==='MICHELIN'?'EDITORIAL_DIRECTORY_LISTED':'PUBLISHED_TRAVEL_GUIDE',operatingStatus:'NOT_CONFIRMED',prices:'NOT_COLLECTED',hours:'NOT_COLLECTED',photos:'NOT_LICENSED',...(r.verification||{})};
 records.push(r);
}

const maps=new Map(read(root+'/michelin-map-evidence.json').map(c=>[c.key,c]));
const cuisines={'Vietnamese':'Món Việt','Vietnamese Contemporary':'Món Việt đương đại','Street Food':'Món ăn đường phố','Noodles':'Món bún, phở và mì','Vegetarian':'Ẩm thực chay','Cantonese':'Ẩm thực Quảng Đông','French':'Ẩm thực Pháp','French Contemporary':'Ẩm thực Pháp đương đại','European Contemporary':'Ẩm thực Âu đương đại','Innovative':'Ẩm thực sáng tạo','International':'Ẩm thực quốc tế','Seafood':'Hải sản','Fish and Seafood':'Cá và hải sản','Steakhouse':'Bít tết','Japanese':'Ẩm thực Nhật','Japanese Contemporary':'Ẩm thực Nhật đương đại','Indian':'Ẩm thực Ấn Độ','Italian':'Ẩm thực Ý','Italian Contemporary':'Ẩm thực Ý đương đại','Mediterranean Cuisine':'Ẩm thực Địa Trung Hải','Latin American':'Ẩm thực Mỹ Latin','Teppanyaki':'Món nướng teppanyaki','Asian Contemporary':'Ẩm thực Á đương đại','Contemporary':'Ẩm thực đương đại','European':'Ẩm thực Âu','Korean Contemporary':'Ẩm thực Hàn đương đại','British Contemporary':'Ẩm thực Anh đương đại','Fusion':'Ẩm thực kết hợp','Small eats':'Món ăn nhẹ','Rice Dishes':'Món cơm'};
for(const j of read(root+'/michelin-details-index.json')){
 const raw=fs.readFileSync(root+'/sources/'+j.key+'.txt','utf8'),lines=raw.replace(/^L\d+: ?/gm,'').split('\n').map(l=>l.trim());
 const i=lines.findIndex(l=>/^# [^#]/.test(l));
 const address=lines.slice(i+1).find(l=>l&&!l.startsWith('【'));
 if(i<0||!address?.includes('Vietnam')||!j.sourceUrl?.includes('guide.michelin.com/en/')){held.push({...j,reason:'DETAIL_PAGE_UNAVAILABLE'});continue;}
 const m=maps.get(j.key),location=m?.lat?{lat:m.lat,lon:m.lon,provenance:'MICHELIN_MAP_EMBED'}:null;
 const dest=destination(j.name,j.locality,address,location),cuisine=cuisines[j.cuisine]||j.cuisine;
 const beforeNearby=lines.slice(0,lines.findIndex(l=>l==='## Nearby Restaurants')).join(' ');
 if(/permanently closed|temporarily closed|opening in 2027/i.test(beforeNearby)){held.push({...j,reason:'CLOSED_OR_FUTURE'});continue;}
 add({name:j.name,kind:j.kind,dest,locality:j.locality,address,location,website:null,sourceUrl:j.sourceUrl,sourceFile:'sources/'+j.key+'.txt',sourceType:'MICHELIN',cuisine:cuisine||null,summary:j.kind==='restaurant'?`${cuisine||'Nhà hàng'} tại ${j.locality}.`:`Chỗ ở trong danh mục Michelin tại ${j.locality}.`,qualityTier:'EDITORIAL_SOURCE',verification:{position:location?'SOURCE_COORDINATES':'NOT_LOCATED'}});
}

for(const h of read(root+'/accor-hotels.json')){
 const file=root+'/sources/accor-'+h['@id']+'.txt';const raw=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 if(/opening|coming soon|2027/i.test(h.name)){held.push({name:h.name,sourceUrl:h.url,reason:'FUTURE_OPENING'});continue;}
 const location=h.geo?{lat:+h.geo.latitude,lon:+h.geo.longitude,provenance:'OFFICIAL_OPERATOR_GEO'}:null;
 const address=plain([h.address?.streetAddress,h.address?.addressLocality,'Vietnam'].filter(Boolean).join(', '));
 const dest=destination(h.name,h.address?.addressLocality,address,location);
 add({name:h.name,kind:'lodging',dest,locality:h.address?.addressLocality,address,location,website:h.url,sourceUrl:h.url,sourceUrls:[h.url,'https://all.accor.com/a/en/destination/country/hotels-vietnam-pvn.html'],sourceFile:raw?'sources/accor-'+h['@id']+'.txt':'sources/accor.txt',sourceType:'OFFICIAL_OPERATOR',summary:`Chỗ ở thuộc hệ thống Accor tại ${h.address?.addressLocality}.`,qualityTier:'PRIMARY_SOURCE',verification:{position:'OPERATOR_COORDINATES'}});
 const cardPattern=/<h3[^>]*id="catering-(\d+)-title"[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[^>]*id="catering-|<\/section>|$)/g;
 for(const m of raw.matchAll(cardPattern)){
  const name=plain(m[2]),description=plain(m[3].match(/<p class="card__description">([\s\S]*?)<\/p>/)?.[1]||'');
  if(!name||/^restaurant$|^breakfast$|^bar$|^lobby bar$|^pool bar$/i.test(name)){held.push({name,hotel:h.name,reason:'GENERIC_FACILITY'});continue;}
  const isBar=/\b(bar|lounge|cocktail)\b/i.test(name)&&!(/restaurant|grill/i.test(name));
  add({name:name+' · '+h.name,venueName:name,parentHotel:h.name,kind:isBar?'bar':'restaurant',dest,locality:h.address?.addressLocality,address,location:location?{...location,provenance:'PARENT_HOTEL_ENTRANCE'}:null,website:h.url+'#section-facilities',sourceUrl:h.url,sourceFile:'sources/accor-'+h['@id']+'.txt',sourceType:'OFFICIAL_OPERATOR',summary:`${isBar?'Quầy bar':'Nhà hàng'} ${name} trong ${h.name}.`,qualityTier:'PRIMARY_SOURCE',verification:{position:'SHARED_HOTEL_ENTRANCE',access:'CONFIRM_NON_GUEST_ACCESS'}});
 }
}

const websiteChecks=read(root+'/website-checks.json');
const wv=read(root+'/wikivoyage-candidates.json');
const banned=/^(snake restaurants|banana fritters stall|street food|night market|central market|local market|restaurants|food stalls|beer street|cafe|restaurant|homestay|hotel)$/i;
for(const w of wv){
 const check=websiteChecks[w.website];const tokens=norm(w.name).split(' ').filter(t=>t.length>3&&!/^(hotel|restaurant|coffee|cafe|vietnam|saigon|hanoi|resort|guesthouse|hostel|house|beach)$/.test(t));
 const page=norm((check?.title||'')+' '+(check?.text||'').slice(0,16000));
 const matches=tokens.filter(t=>page.includes(t));
 const identityMatch=!!check&&check.status===200&&tokens.length>0&&matches.length>=Math.min(2,tokens.length)&&!/(domain for sale|buy this domain|parked domain|account suspended|site suspended|^coming soon$|^access denied$)/i.test((check.title||'')+' '+(check.text||''));
 const recent=/^202[4-6]-/.test(w.sourceUpdated||'');
 const knownMismatch=['Dalat Hotel','The Hill Station Signature','The Hill Station Deli','Mekong Lodge','Memento Resort','Blue River Hotel'];
 if(knownMismatch.includes(w.name)){held.push({name:w.name,dest:w.dest,sourceUrl:w.sourceUrl,reason:'MANUAL_REVIEW_GENERIC_RELOCATED_OR_WRONG_BUSINESS'});continue;}
 const hasCoordinates=w.lat&&w.lon&&w.lat>8&&w.lat<24&&w.lon>102&&w.lon<110;
 const addressValid=!!w.address&&w.address.length>=5;
 if(banned.test(w.name)||(!identityMatch&&!recent)||!addressValid){held.push({dest:w.dest,name:w.name,sourceUrl:w.sourceUrl,reason:banned.test(w.name)?'GENERIC_IDENTITY':!addressValid?'MISSING_STREET_ADDRESS':'NO_RECENT_OR_INDEPENDENT_EVIDENCE'});continue;}
 if(hasCoordinates&&km(w,byDest.get(w.dest).references[0])>radii[w.dest]){held.push({name:w.name,reason:'OUTSIDE_DESTINATION'});continue;}
 const type=w.kind==='cafe'&&/\b(bar|pub|club|nightclub)\b/i.test(w.name)?'bar':w.kind;
 add({name:w.name,kind:type,dest:w.dest,locality:byDest.get(w.dest).name,address:w.address,location:hasCoordinates?{lat:w.lat,lon:w.lon,provenance:'WIKIVOYAGE_LISTING_NOT_INDEPENDENTLY_GEOCODED'}:null,website:identityMatch&&https(check.finalUrl)?check.finalUrl:null,sourceUrl:w.sourceUrl,sourceUrls:[w.sourceUrl,...(identityMatch?[check.finalUrl]:[])],sourceFile:'sources/'+w.sourceFile,sourceType:'WIKIVOYAGE',sourceUpdated:w.sourceUpdated,summary:`${type==='lodging'?'Chỗ ở':type==='restaurant'?'Quán ăn':type==='bar'?'Quầy bar':'Quán uống'} tại ${w.address}, ${byDest.get(w.dest).name}.`,qualityTier:identityMatch?'WEBSITE_IDENTITY_MATCH':'RECENT_GUIDE_LISTING',verification:{website:identityMatch?'HTTP_200_AND_NAME_TOKENS_MATCH':'NOT_CONFIRMED',websiteCheck:check?{status:check.status||null,title:check.title||null,matchedTokens:matches,checkedAt:check.checkedAt}:null,position:hasCoordinates?'GUIDE_ONLY':'NOT_LOCATED'}});
}
for(const f of foods)add({...f,location:null,address:null,website:null,sourceType:/vietnam.travel|gov.vn|tuyengiaocaobang|baodaklak/.test(f.sourceUrl)?'TOURISM_OR_LOCAL_PUBLICATION':'TRAVEL_PUBLICATION',qualityTier:'REGIONAL_DISH_SOURCE',verification:{position:'NOT_A_VENUE'}});

// Gộp nguồn theo tên, địa chỉ và tọa độ; không gộp hai chi nhánh chỉ vì cùng thương hiệu.
const unique=[];
function same(a,b){
 if(a.kind==='dish'||b.kind==='dish')return a.kind===b.kind&&a.dest===b.dest&&norm(a.name)===norm(b.name);
 if(a.dest!==b.dest||a.kind!==b.kind)return false;
 const x=norm(a.venueName||a.name),y=norm(b.venueName||b.name);
 const near=a.location&&b.location&&km(a.location,b.location)<0.15;
 const names=x===y||(Math.min(x.length,y.length)>9&&(x.includes(y)||y.includes(x)));
 if(a.kind==='lodging'&&x===y&&x.length>8&&a.dest&&(!a.location||!b.location||km(a.location,b.location)<1))return true;
 const tx=new Set(x.split(' ').filter(t=>t.length>1)),ty=new Set(y.split(' ').filter(t=>t.length>1));
 const common=[...tx].filter(t=>ty.has(t));
 const addressA=norm(a.address),addressB=norm(b.address);
 const houseA=addressA.match(/\b\d+[a-z]?\b/)?.[0],houseB=addressB.match(/\b\d+[a-z]?\b/)?.[0];
 const sameHouse=houseA&&houseB&&houseA===houseB;
 if(near&&common.length>=2&&common.length/Math.min(tx.size,ty.size)>=0.65&&sameHouse)return true;
 if(names&&(near||norm(a.address)===norm(b.address)))return true;
 const strip=s=>s.replace(/\b(collection|mgallery|hotel|resort|restaurant|by|the|and|managed|accor|legend|sofitel)\b/g,'').replace(/\s+/g,' ').trim();
 return near&&strip(x).length>8&&strip(x)===strip(y);
}
for(const r of records){const prior=unique.find(p=>same(p,r));if(prior){prior.sourceUrls=[...new Set([...prior.sourceUrls,...r.sourceUrls])];if(r.sourceType==='OFFICIAL_OPERATOR'&&prior.sourceType!=='OFFICIAL_OPERATOR'){const urls=prior.sourceUrls;Object.assign(prior,r,{sourceUrls:urls});}duplicates.push({name:r.name,kept:prior.id,sourceUrl:r.sourceUrl});}else unique.push(r);}
for(const r of unique){
 const sameName=originalByDest.get(r.dest)?.places.find(p=>p.venue&&p.venue.kind===r.kind&&norm(p.name)===norm(r.name));
 const knownExisting={'Phở Gia Truyền (Hoàn Kiếm)':'venue-ha-noi-pho-bat-dan'};
 const alias=knownExisting[r.name];
 const old=sameName||originalByDest.get(r.dest)?.places.find(p=>p.venue&&(p.id===alias||same(r,{...p,kind:p.venue.kind,dest:r.dest,address:p.venue.address,location:{lat:p.lat,lon:p.lon}})));
 r.existingPlaceId=old?.id||null;
 r.importDisposition=r.kind==='dish'?'GUIDE_ONLY':r.existingPlaceId?'ALREADY_IN_CATALOG':!r.dest?'OUTSIDE_CURRENT_DESTINATIONS':r.kind==='bar'?'RESEARCH_ONLY_BAR':r.sourceType==='WIKIVOYAGE'?'RESEARCH_ONLY_NEEDS_POSITION_CHECK':r.location&&r.address&&r.address.length<=240&&r.name.length<=120?'READY_PLACE':'GUIDE_ONLY_NO_COORDINATES';
}
save(root+'/records.json',{schemaVersion:1,researchedAt:'2026-11-07',scope:'Published source research; operating status, availability, prices and hours are not confirmed.',records:unique});
save(root+'/held.json',held);save(root+'/duplicates.json',duplicates);
const summary={records:unique.length,byKind:Object.fromEntries([...new Set(unique.map(r=>r.kind))].map(k=>[k,unique.filter(r=>r.kind===k).length])),byTier:Object.fromEntries([...new Set(unique.map(r=>r.qualityTier))].map(k=>[k,unique.filter(r=>r.qualityTier===k).length])),byDisposition:Object.fromEntries([...new Set(unique.map(r=>r.importDisposition))].map(k=>[k,unique.filter(r=>r.importDisposition===k).length])),byDestination:Object.fromEntries(cats.map(d=>[d.id,unique.filter(r=>r.dest===d.id).length])),held:held.length,merged:duplicates.length};
save(root+'/summary.json',summary);console.log(JSON.stringify(summary,null,2));

if(process.argv.includes('--apply')){
 const before=root+'/catalog-before.json';if(!fs.existsSync(before))save(before,cats);
 const baseline=read(before);let places=0,guides=0;const additions=[];
 for(const r of unique){const d=byDest.get(r.dest);if(!d||r.existingPlaceId)continue;
  if(r.importDisposition==='READY_PLACE'&&!d.places.some(p=>p.id===r.id)){
   const isLodging=r.kind==='lodging',positionNote=r.location.provenance==='PARENT_HOTEL_ENTRANCE'?'Ghim tại lối vào khách sạn; hỏi lễ tân vị trí nhà hàng.':'Vị trí theo nguồn hồ sơ; xác nhận cửa vào trước khi đi.';
   d.places.push({id:r.id,name:r.name,category:isLodging?'luu':'am',area:d.name,hook:r.summary,summary:r.summary+' '+(isLodging?'So sánh hạng phòng và điều kiện đặt theo ngày đi.':'Xem thực đơn và khẩu phần trước khi chọn.'),lat:r.location.lat,lon:r.location.lon,bestMonths:[],bestLabel:'Xác nhận với cơ sở',duration:isLodging?'Bạn chọn ngày nhận phòng':'Tùy bữa ăn bạn chọn',difficulty:'Không áp dụng',highlights:[isLodging?'Chỗ ở tham khảo':r.cuisine||'Địa chỉ ăn uống'],verdict:'worth',verdictReason:'Có hồ sơ nguồn và địa chỉ để bạn đối chiếu trước khi chọn.',bestSlots:[],slotReason:'Xác nhận giờ phục vụ trực tiếp với cơ sở.',tips:[positionNote,...r.sourceUrls.map(u=>'Nguồn: '+u),r.parentHotel?'Xác nhận nhà hàng có đón khách không lưu trú và có cần đặt bàn.':isLodging?'Giá và phòng trống phụ thuộc ngày nhận phòng.':'Giá và thực đơn có thể thay đổi.'],photos:[],wikipediaTitle:null,venue:{kind:r.kind,address:r.address,website:r.website||'',sourceUrl:r.sourceUrl,checkedAt:'2026-11-07'}});places++;additions.push({id:r.id,dest:r.dest,kind:r.kind});
  }
  // Chỉ đưa món có nguồn và quán đủ vị trí vào cẩm nang; hồ sơ còn thiếu giữ trong research.
  if(!['READY_PLACE','GUIDE_ONLY'].includes(r.importDisposition))continue;
  const sectionId=r.kind==='dish'?'am-thuc-research-20261107':r.kind==='lodging'?'cho-o-research-20261107':'quan-an-research-20261107';
  const oldTitles=d.guide.flatMap(g=>g.items.map(i=>norm(i.title)));
  const normalized=norm(r.name).replace(new RegExp(' '+norm(d.name)+'$'),'');
  if(r.kind==='dish'&&oldTitles.some(t=>t===norm(r.name)||t===normalized))continue;
  let g=d.guide.find(g=>g.id===sectionId);if(!g){g={id:sectionId,layout:r.kind==='dish'?'CARDS':'PLACES',category:r.kind==='lodging'?'luu':'am',icon:r.kind==='lodging'?'bed':'tools-kitchen-2',title:r.kind==='dish'?'Thêm món địa phương':r.kind==='lodging'?'Chỗ ở để cân nhắc':'Quán ăn để cân nhắc',summary:'Tham khảo nguồn và xác nhận thông tin theo ngày bạn đi.',items:[]};d.guide.push(g);}
  if(g.items.some(i=>i.title===r.name))continue;
  g.items.push({icon:r.kind==='lodging'?'bed':'tools-kitchen-2',title:r.name,text:r.summary,placeId:r.kind==='dish'?null:r.id});guides++;
 }
 // Validate the entire pending batch before any catalog write.
 for(const old of baseline){const now=byDest.get(old.id);assert.deepEqual(now.places.slice(0,old.places.length),old.places);assert.deepEqual(now.moments,old.moments);assert.deepEqual(now.coverPhoto,old.coverPhoto);for(const g of old.guide){const n=now.guide.find(x=>x.id===g.id);assert.deepEqual({...n,items:n.items.slice(0,g.items.length)},g);}}
 const ids=new Set();for(const d of cats){for(const p of d.places){assert(!ids.has(p.id),'duplicate id '+p.id);ids.add(p.id);assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id),'invalid slug '+p.id);assert(p.id.length<=60);assert(p.name.length<=120);assert(p.lat>=8&&p.lat<=24&&p.lon>=102&&p.lon<=110);if(p.venue){assert(https(p.venue.sourceUrl));assert(p.venue.address.length<=240);}}const placeIds=new Set(d.places.map(p=>p.id));for(const g of d.guide)for(const i of g.items)assert(!i.placeId||placeIds.has(i.placeId));}
 for(const d of cats)save(path.join(dir,d.id+'.json'),d);
 const completeAdditions=cats.flatMap(d=>d.places.filter(p=>p.id.startsWith('rs-')).map(p=>({id:p.id,dest:d.id,kind:p.venue.kind})));
 const completeGuides=cats.flatMap(d=>d.guide.filter(g=>g.id.endsWith('research-20261107')).flatMap(g=>g.items));
 save(root+'/applied.json',{checkedAt:'2026-11-07',places:completeAdditions.length,guides:completeGuides.length,dishGuideItems:completeGuides.filter(i=>!i.placeId).length,additions:completeAdditions,preservation:'PASS'});console.log(JSON.stringify({addedThisRun:places,guideItemsThisRun:guides,totalAdded:completeAdditions.length,preservation:'PASS'}));
}
