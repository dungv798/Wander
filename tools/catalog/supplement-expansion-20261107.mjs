/** Tọa độ OSM đã đọc đúng loại/vùng; tìm ảnh riêng trước khi chốt thêm POI. */
import fs from 'node:fs';
import path from 'node:path';
import {getJson,usableImages,getBytes} from './build-catalog.mjs';
import {expansionSeeds} from './expansion-seeds-20261107.mjs';
const root=path.resolve(import.meta.dirname,'../..'),file=path.join(root,'docs/research/expansion-supplement-20261107.json'),geo=JSON.parse(fs.readFileSync('docs/research/geocode-supplement-20261107.json','utf8'));
const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const selected=[['phong-nha','hang-toi',5063396623,'"Dark Cave" "Vietnam"'],['phong-nha','nuoc-mooc',4387487189,'"Nuoc Mooc"'],['nha-trang','thap-ba-ponagar',146780347,'"Po Nagar"'],['nha-trang','hon-chong',792392852,'"Hon Chong" "Nha Trang"'],['can-tho','truc-lam-phuong-nam',4709395094,'"Truc Lam Phuong Nam"'],['phu-quoc','suoi-tranh',357411250,'"Suoi Tranh"']];
for(const [dest,slug,osmId,search] of selected){const id=dest+'-'+slug;if(report[id])continue;const entry=expansionSeeds[dest].find(e=>e[0]===slug),hit=geo[id].hits.find(h=>h.osm_id===osmId);if(!hit)throw new Error('Missing reviewed OSM '+id);
const page=await getJson('https://commons.wikimedia.org/w/api.php',{action:'query',generator:'search',gsrsearch:search+' filetype:bitmap',gsrnamespace:'6',gsrlimit:'8'});
const photos=(await usableImages(Object.values(page.query?.pages??{}).map(p=>p.title))).slice(0,3),candidates=[];
for(const [i,photo] of photos.entries()){const name=`supp-${id}-${i+1}.jpg`;fs.writeFileSync(path.join(root,'.logs/expansion-20261107',name),await getBytes(photo.url));candidates.push({...photo,file:name});}
report[id]={dest,id,name:entry[1],category:entry[2],hook:entry[3],lat:Number(hit.lat),lon:Number(hit.lon),sourceUrl:`https://www.openstreetmap.org/${hit.osm_type}/${hit.osm_id}`,osmType:hit.type,position:'OSM_UNVERIFIED_REFERENCE',wikipediaTitle:null,candidates,approved:[]};fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(id+': '+photos.length);}
