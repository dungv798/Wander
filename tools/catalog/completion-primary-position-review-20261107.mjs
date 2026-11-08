import fs from 'node:fs';
import assert from 'node:assert/strict';
import {out,read,save} from './complete-research-20261107.mjs';
const rows=read(out+'/resolved.json'),sites=read(out+'/site-facts.json'),audit=[];
const selections=[
 ['Saigon Domaine Luxury Residences','https://www.saigondomaine.com/',10.82295752,106.7307252,'Tọa độ trong thẻ place:latitude/place:longitude và cấu hình bản đồ của website cùng cơ sở.'],
 ['Haven Guesthouse','https://www.havenvietnam.com/',13.6856778,109.2310953,'businessLocationCoordinates của website Haven; tên LocalBusiness và số điện thoại khớp hồ sơ Bãi Xếp.'],
];
for(const[name,url,lat,lon,reason]of selections){
 const site=sites[url];assert.equal(site.status,200);const html=fs.readFileSync(site.file,'utf8');assert(html.includes(String(lat))&&html.includes(String(lon)));
 const r=rows.find(r=>r.name===name);assert(r);r.location={lat,lon,provenance:'OFFICIAL_WEBSITE_BUSINESS_COORDINATES'};r.positionDecision='OPERATOR_WEBSITE_COORDINATES';r.sourceUrls=[...new Set([...r.sourceUrls,url])];r.positionReview={reason,source:url,checkedAt:'2026-11-07'};audit.push({id:r.id,name,lat,lon,...r.positionReview});
}
// Chỉ dùng tọa độ điểm !3d/!4d. Cặp @lat,lon là tâm khung nhìn Google Maps, không phải điểm cơ sở.
const mapFile=out+'/salinda-official-map.json';let map;
if(fs.existsSync(mapFile))map=read(mapFile);else{
 const source='https://maps.app.goo.gl/R9SJitwH7V3x4kpeA';assert(sites['https://salindaresort.com/'].mapLinks.includes(source));
 const response=await fetch(source,{signal:AbortSignal.timeout(20000)});assert(response.ok);
 const url=response.url,m=url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);assert(m&&url.includes('Salinda'));
 map={source,website:'https://salindaresort.com/',resolvedUrl:url,lat:+m[1],lon:+m[2],checkedAt:'2026-11-07',excludedOfficeMap:'https://maps.app.goo.gl/yUTLrEocNkjVmqff7'};save(mapFile,map);
}
assert(map.lat>10&&map.lat<11&&map.lon>103&&map.lon<104);
for(const r of rows.filter(r=>/Salinda/.test(r.name)&&r.dest==='phu-quoc'&&r.kind==='lodging')){
 r.location={lat:map.lat,lon:map.lon,provenance:'OFFICIAL_WEBSITE_NAMED_MAP_PLACE_POINT'};r.positionDecision='OPERATOR_WEBSITE_NAMED_MAP_POINT';r.website=map.website;r.sourceUrls=[...new Set([...r.sourceUrls,map.website,map.source])];r.positionReview={source:map.source,reason:'Điểm Salinda Phú Quốc từ liên kết website; đã loại địa chỉ văn phòng Cao Thắng TP.HCM và tâm viewport.',checkedAt:'2026-11-07'};audit.push({id:r.id,name:r.name,...r.location,...r.positionReview});
}
save(out+'/resolved.json',rows);save(out+'/primary-position-review.json',audit);console.log(JSON.stringify(audit));
