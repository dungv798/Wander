/** Thu thập nguồn và vị trí riêng, không tự nhận hit đầu hoặc tự nhập dữ liệu chưa đối chiếu. */
import fs from 'node:fs';
import path from 'node:path';
import {venueSeeds} from './venue-seeds-20261107.mjs';
const root=path.resolve(import.meta.dirname,'../..'),file=path.join(root,'docs/research/venue-candidates-20261107.json'),log=path.join(root,'.logs/venue-sources-20261107');fs.mkdirSync(log,{recursive:true});
const report=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const strip=html=>html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
for(const seed of venueSeeds){const id=`venue-${seed.dest}-${seed.slug}`;if(report[id])continue;
const record={...seed,id,checkedAt:'2026-11-07',approved:false,photos:[]};
try{const r=await fetch(seed.url,{headers:{'User-Agent':'WanderCatalog/0.1 (contact: https://github.com/dungv798/Wander)'},signal:AbortSignal.timeout(18000)});record.httpStatus=r.status;record.finalUrl=r.url;if(r.ok){const html=await r.text();record.title=strip(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]??'');fs.writeFileSync(path.join(log,id+'.txt'),strip(html));record.sourceBytes=html.length;record.mapLinks=[...html.matchAll(/(?:https?:[^"'<>\s]+(?:maps|mapbox)[^"'<>\s]*|["'](?:latitude|longitude)["']\s*:\s*["']?-?\d+[.]\d+)/g)].map(m=>m[0]).slice(0,12);}}catch(e){record.sourceError=e.message;}
try{const query=seed.name.replace(/ ·.*$/,'')+' '+JSON.parse(fs.readFileSync(path.join(root,'backend/src/main/resources/catalog',seed.dest+'.json'),'utf8')).name;
const params=new URLSearchParams({q:query,countrycodes:'vn',format:'jsonv2',limit:'4'}),r=await fetch('https://nominatim.openstreetmap.org/search?'+params,{headers:{'User-Agent':'WanderCatalog/0.1 (contact: https://github.com/dungv798/Wander)'},signal:AbortSignal.timeout(18000)});if(!r.ok)throw new Error('HTTP '+r.status);record.hits=await r.json();}catch(e){record.geocodeError=e.message;}
report[id]=record;fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({id,status:record.httpStatus,title:record.title,hits:record.hits?.map(h=>({id:h.osm_id,type:h.type,lat:h.lat,lon:h.lon,name:h.display_name}))}));await new Promise(r=>setTimeout(r,1250));}
