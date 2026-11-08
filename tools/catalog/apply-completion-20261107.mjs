import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {input,out,read,save,norm} from './complete-research-20261107.mjs';
const base=read(out+'/baseline.json').catalogs,original=read(input+'/catalog-before.json');
const priorPayload=new Map(base.map(d=>{const f=out+'/apply-payload/'+d.id+'.json';return[d.id,fs.existsSync(f)?read(f):null];}));
const cats=structuredClone(base),byDest=new Map(cats.map(d=>[d.id,d])),profiles=read(out+'/profiles.json').records;
const byId=new Map(profiles.map(r=>[r.id,r])),canonical=new Map(),events=[];
// Cùng cơ sở được đối chiếu theo tên, địa chỉ và ghim. Giữ ID đã có trong catalog.
const aliases=[
 ['rs-hue-the-reverie-saigon-e29caf8b','rs-ho-chi-minh-the-reverie-saigon-754f6908'],
 ['rs-ho-chi-minh-hotel-des-arts-saigon-mg-9946d34c','rs-ho-chi-minh-hotel-des-arts-saigon-mg-bde385cf'],
 ['rs-sa-pa-hotel-de-la-coupole-mgal-aef2f5fe','rs-sa-pa-hotel-de-la-coupole-sapa-f25e058c'],
 ['rs-phu-quoc-premier-village-phu-quoc-2e46b71d','rs-phu-quoc-premier-village-phu-quoc-0fbd9ec2'],
 ['rs-ha-long-legacy-yen-tu-mgallery-50bc51b1','rs-ha-long-legacy-yen-tu-resort-ret-3f834823'],
 ['rs-ho-chi-minh-sofitel-plaza-saigon-9856f1d5','rs-ho-chi-minh-sofitel-saigon-plaza-eec7b9ad'],
 ['rs-nha-trang-novotel-709d5c55','rs-nha-trang-novotel-nha-trang-a6204e62'],
 ['rs-phu-quoc-salinda-resort-and-spa-7a231132','rs-phu-quoc-salinda-resort-phu-quoc-0e169217'],
];
for(const [from,to]of aliases){assert(byId.has(from)&&byId.has(to),from);assert.equal(byId.get(from).dest,byId.get(to).dest);canonical.set(from,to);}
for(const r of profiles)if(r.existingPlaceId)canonical.set(r.id,r.existingPlaceId);
const target=id=>canonical.get(id)||id;
const applied=[];
const approvedPhotos=fs.existsSync(out+'/approved-photos.json')?read(out+'/approved-photos.json'):[];
const photoFor=id=>approvedPhotos.filter(p=>target(p.recordId)===id).map(p=>p.photo);
const oldIds=new Set(original.flatMap(d=>d.places.map(p=>p.id)));
const grouped=new Map();
for(const r of profiles.filter(r=>r.kind!=='dish'&&r.completion.ready)){
 const id=target(r.id);if(!grouped.has(id))grouped.set(id,[]);grouped.get(id).push(r);
}
for(const [id,group]of grouped){
 const preferred=group.find(r=>r.id===id)||group[0],d=byDest.get(preferred.dest);assert(d);
 const profile=structuredClone(preferred.place);profile.id=id;
 const copy=group.find(r=>r.sourceType==='MICHELIN'&&r.kind==='lodging');
 if(copy)for(const k of ['hook','summary','highlights','verdictReason'])profile[k]=structuredClone(copy.place[k]);
 profile.tips=[...new Set(group.flatMap(r=>r.place.tips))];
 for(const k of ['phone','serviceHours','priceNote','website'])if(!profile.venue[k])profile.venue[k]=group.map(r=>r.place.venue[k]).find(Boolean)||'';
 // Không gán nhầm địa phương tiếng Anh vào tên vùng của thẻ; địa chỉ nguồn vẫn giữ đầy đủ.
 profile.area=d.name;
 const existing=d.places.find(p=>p.id===id);
 const photos=[...(existing?.photos||[]),...photoFor(id)];profile.photos=[...new Map(photos.map(p=>[p.file||p.url,p])).values()].slice(0,8);
 if(oldIds.has(id)){
  assert(existing?.venue);for(const k of ['phone','serviceHours','priceNote'])if(profile.venue[k])existing.venue[k]=profile.venue[k];
  // Ảnh chụp đúng cơ sở đã duyệt có thể bổ sung, không thay ảnh biên tập cũ.
  existing.photos=profile.photos;
  events.push({action:'ENRICH_EXISTING_VENUE',id,dest:d.id,records:group.map(r=>r.id)});
 }else if(existing){Object.assign(existing,profile);events.push({action:'COMPLETE_IMPORTED_VENUE',id,dest:d.id,records:group.map(r=>r.id)});}
 else{d.places.push(profile);events.push({action:'ADD_COMPLETED_VENUE',id,dest:d.id,records:group.map(r=>r.id)});}
 for(const r of group)applied.push({recordId:r.id,placeId:id,dest:d.id,kind:r.kind,action:events.at(-1).action});
}
// Chỉ sửa các khối cẩm nang của đợt research này; các khối biên tập trước đó giữ nguyên.
for(const d of cats){
 d.guide=d.guide.filter(g=>!g.id.endsWith('-research-20261107'));
 const rows=profiles.filter(r=>r.dest===d.id),dishItems=[],lodging=[],food=[];
 const existingTitles=d.guide.flatMap(g=>g.items.map(i=>norm(i.title)));
 const seen=new Set();
 for(const r of rows){
  if(r.kind==='dish'){
   const key=norm(r.name),short=key.replace(new RegExp(' '+norm(d.name)+'$'),'');
   const covered=existingTitles.some(t=>t===key||t===short);
   if(!covered)dishItems.push(r.guideItem);
   applied.push({recordId:r.id,dest:d.id,kind:'dish',action:covered?'EXISTING_DISH_GUIDE':'DISH_GUIDE'});continue;
  }
  if(!r.completion.ready)continue;
  const id=target(r.id);if(seen.has(id)||oldIds.has(id))continue;seen.add(id);
  const p=d.places.find(p=>p.id===id);assert(p);
  (r.kind==='lodging'?lodging:food).push({icon:r.kind==='lodging'?'bed':r.kind==='bar'?'glass-cocktail':r.kind==='cafe'?'coffee':'tools-kitchen-2',title:p.name,text:p.summary,placeId:p.id});
 }
 for(const [name,items,category,title,icon]of [['am-thuc',dishItems,'am','Thêm món địa phương','tools-kitchen-2'],['cho-o',lodging,'luu','Chỗ ở để cân nhắc','bed'],['quan-an',food,'am','Quán ăn và đồ uống','tools-kitchen-2']])if(items.length)d.guide.push({id:name+'-research-20261107',layout:name==='am-thuc'?'CARDS':'PLACES',category,icon,title,summary:name==='am-thuc'?'Món địa phương và cách thưởng thức; xem nguồn trong hồ sơ nghiên cứu.':'Mở thẻ để xem địa chỉ, nguồn, liên hệ và lưu ý trước khi đặt.',items});
}
const ids=new Set(),https=s=>{try{const u=new URL(s);return u.protocol==='https:'&&u.host&&!u.username&&!u.password;}catch{return false;}};
const limits={id:60,name:120,area:80,hook:240,bestLabel:60,duration:40,difficulty:20,verdictReason:240,slotReason:240};
for(const d of cats){
 for(const p of d.places){
  assert(!ids.has(p.id),'Duplicate '+p.id);ids.add(p.id);assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id),p.id);
  for(const [k,max]of Object.entries(limits))assert(typeof p[k]==='string'&&p[k].trim().length>0&&p[k].length<=max,p.id+' '+k+' '+p[k]?.length);
  assert(Number.isFinite(p.lat)&&p.lat>8&&p.lat<24&&Number.isFinite(p.lon)&&p.lon>102&&p.lon<110,p.id+' coordinates');
  if(p.venue){const v=p.venue;assert(['lodging','restaurant','cafe','bar'].includes(v.kind));assert.equal(p.category,v.kind==='lodging'?'luu':'am');assert(v.address?.trim()&&v.address.length<=240,p.id+' address');assert(https(v.sourceUrl)&&(!v.website||https(v.website)),p.id+' URL');for(const [k,max]of [['phone',60],['serviceHours',1000],['priceNote',240]])assert(!v[k]||typeof v[k]==='string'&&v[k].length<=max,p.id+' '+k);}
  assert(p.photos.length<=8);for(const ph of p.photos){assert(ph.author&&ph.license&&https(ph.sourceUrl));if(ph.file)assert(fs.existsSync('backend/src/main/resources/catalog/photos/'+ph.file),ph.file);}
 }
 for(const g of d.guide)for(const i of g.items)assert(!i.placeId||d.places.some(p=>p.id===i.placeId),'Dangling guide link '+i.placeId);
 const old=original.find(x=>x.id===d.id);assert.deepEqual(d.moments,old.moments);assert.deepEqual(d.coverPhoto,old.coverPhoto);
 for(const p of old.places){const now=d.places.find(x=>x.id===p.id);assert(now);const expected=structuredClone(p);if(expected.venue)for(const k of ['phone','serviceHours','priceNote'])if(now.venue[k])expected.venue[k]=now.venue[k];expected.photos=now.photos;assert.deepEqual(now,expected,'Original content '+p.id);}
}
if(process.argv.includes('--apply'))for(const d of base){const live=read(path.join('backend/src/main/resources/catalog',d.id+'.json'));assert(JSON.stringify(live)===JSON.stringify(d)||JSON.stringify(live)===JSON.stringify(priorPayload.get(d.id)),'Catalog changed since review: '+d.id);}
const batch=out+'/apply-payload';fs.mkdirSync(batch,{recursive:true});for(const d of cats)save(batch+'/'+d.id+'.json',d);
const blocked=profiles.filter(r=>r.kind!=='dish'&&!r.completion.ready).map(r=>({id:r.id,name:r.name,dest:r.dest,targetDestination:r.targetDestination,problems:r.completion.problems,position:r.positionDecision,reason:r.positionReview?.reason||null}));
const all=cats.flatMap(d=>d.places),researchPlaces=events.map(e=>all.find(p=>p.id===e.id));
const summary={recordsResearched:profiles.length,eligibleVenueRecords:profiles.filter(r=>r.completion.ready).length,uniqueVenuesCompleted:events.length,actions:Object.fromEntries([...new Set(events.map(e=>e.action))].map(k=>[k,events.filter(e=>e.action===k).length])),merged:aliases.length,dishRecords:100,dishGuideItems:applied.filter(a=>a.action==='DISH_GUIDE').length,dishesAlreadyRepresented:applied.filter(a=>a.action==='EXISTING_DISH_GUIDE').length,blocked:blocked.length,catalogBefore:base.reduce((n,d)=>n+d.places.length,0),catalogAfter:all.length,withPhone:researchPlaces.filter(p=>p.venue.phone).length,withHours:researchPlaces.filter(p=>p.venue.serviceHours).length,withPriceNote:researchPlaces.filter(p=>p.venue.priceNote).length,withPhotos:researchPlaces.filter(p=>p.photos.length).length,byDestination:cats.map(d=>({id:d.id,name:d.name,total:d.places.length,completed:events.filter(e=>e.dest===d.id).length}))};
if(process.argv.includes('--apply')){
 for(const d of cats)save(path.join('backend/src/main/resources/catalog',d.id+'.json'),d);
}
save(out+'/apply-audit.json',{checkedAt:'2026-11-07',appliedToCatalog:process.argv.includes('--apply'),summary,events,recordApplications:applied,aliases,blocked});
console.log(JSON.stringify(summary,null,2));
