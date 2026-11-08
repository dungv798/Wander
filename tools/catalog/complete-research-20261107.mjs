import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const input='docs/research/expansion-20261107';
const out='docs/research/completion-20261107';
const cache='.logs/completion-20261107';
for(const p of [out,cache,cache+'/sites'])fs.mkdirSync(p,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const save=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
const norm=s=>String(s??'').normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const plain=s=>String(s??'').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const records=read(input+'/records.json').records;
const catalogs=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));
if(!fs.existsSync(out+'/baseline.json'))save(out+'/baseline.json',{records,catalogs});

function schemaItems(raw){const all=[];const walk=o=>{if(!o||typeof o!=='object')return;if(o['@type'])all.push(o);Object.values(o).forEach(v=>Array.isArray(v)?v.forEach(walk):typeof v==='object'?walk(v):null);};for(const m of raw.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{walk(JSON.parse(m[1]));}catch{}return all;}
function geography(r){
 const locality=norm(r.locality),address=norm(r.address),name=norm(r.name);
 const rules=[['phu-quoc',/phu quoc/],['phu-yen',/phu yen|tuy hoa|xuan canh|song cau/],['hoi-an',/hoi an|duy xuyen/],['da-nang',/da nang|danang/],['hue',/\bhue\b|lang co/],['nha-trang',/nha trang|cam ranh|ninh van/],['da-lat',/da lat|dalat/],['quy-nhon',/quy nhon/],['ha-noi',/hanoi|ha noi|hoan kiem/],['ho-chi-minh',/ho chi minh|saigon|sai gon|district [1237]/],['ha-long',/ha long|halong|quang ninh|yen tu|quan lan/],['sa-pa',/sapa|sa pa/],['can-tho',/can tho/],['ninh-binh',/ninh binh/],['vinh-hy',/vinh hy/]];
 // Địa điểm xa không được ghép vào trung tâm sau thay đổi tên tỉnh/thành.
 const outside=[['ho-tram',/ho tram/],['vung-tau',/vung tau/],['phan-thiet',/phan thiet|mui ne|ham thuan nam|tien thanh/],['mu-cang-chai',/mu cang chai|pu nhu/],['hai-phong',/hai phong/],['con-dao',/con dao/],['my-tho',/my tho|thoi son/],['ha-tinh',/ha tinh|thinh loc/],['tay-ninh',/tay ninh/],['dong-hoi',/dong hoi/]];
 const external=outside.find(([,rx])=>rx.test(locality)||rx.test(name));if(external)return {dest:null,targetDestination:external[0]};
 if(/hoiana|nam hai/.test(name))return {dest:'hoi-an',targetDestination:'hoi-an'};
 const adminAddress=address.split(',').slice(-3).join(',');
 const local=rules.find(([,rx])=>rx.test(locality))||rules.find(([,rx])=>rx.test(adminAddress));
 return {dest:local?.[0]||r.dest,targetDestination:local?.[0]||r.dest};
}

if(process.argv[2]==='extract'){
 const wv=read(input+'/wikivoyage-candidates.json'),hotels=read(input+'/accor-hotels.json');
 const result=[];
 for(const r of records){
  const raw=r.sourceFile?fs.readFileSync(input+'/'+r.sourceFile,'utf8'):'';
  const base={...r,...geography(r),evidence:{},facts:{},completed:false};
  if(r.sourceType==='MICHELIN'){
   const lines=raw.replace(/^L\d+: ?/gm,'').split('\n');const stop=lines.findIndex(l=>/^## (?:Nearby|Guest Score|Rooms & Rates)/.test(l));
   const main=lines.slice(0,stop>0?stop:lines.length);
   base.evidence.description=main.filter(l=>l.length>140&&!/Copyright|Michelin processes|https:|^.*Source:|Use the app/.test(l)).join('\n');
   const map=main.map(l=>l.match(/【(\d+)†(?:Visit Website|Website)(?:†([^】]+))?】/)).find(Boolean);
   if(map)base.evidence.websiteLink={id:+map[1],domain:map[2]||null};
   base.evidence.ref=raw.match(/turn\d+view\d+/)?.[0];
   base.facts.phone=main.join(' ').match(/\+84[\d\s().-]{7,23}/)?.[0]?.trim()||null;
   const hours={};const weekdays=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
   for(let i=0;i<main.length;i++)if(weekdays.includes(main[i])){const times=[];for(let k=i+1;k<Math.min(i+8,main.length);k++){if(weekdays.includes(main[k]))break;if(/\d{1,2}:\d{2}[-–]\d{1,2}:\d{2}|^closed$/i.test(main[k]))times.push(main[k]);}if(times.length)hours[main[i]]=times;}
   if(Object.keys(hours).length)base.facts.openingHours=hours;
   base.facts.priceIndicator=main.slice(0,100).find(l=>/^₫{1,4}$/.test(l))||null;
  }else if(r.sourceType==='OFFICIAL_OPERATOR'){
   const data=schemaItems(raw),hotel=data.find(o=>o['@type']==='Hotel')||hotels.find(h=>r.sourceUrl===h.url);
   base.evidence.description=hotel?.description?plain(hotel.description):'';
   base.facts.phone=hotel?.telephone||null;base.facts.email=hotel?.email||null;
   base.facts.amenities=(hotel?.amenityFeature||[]).map(v=>typeof v==='string'?v:v.name).filter(Boolean);
   if(r.parentHotel){for(const m of raw.matchAll(/<h3[^>]*id="catering-\d+-title"[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3[^>]*id="catering-|<\/section>|$)/g))if(norm(plain(m[1]))===norm(r.venueName))base.evidence.description=plain(m[2].match(/<p class="card__description">([\s\S]*?)<\/p>/)?.[1]||'');}
   if(hotel?.geo)base.evidence.operatorLocation={lat:+hotel.geo.latitude,lon:+hotel.geo.longitude};
  }else if(r.sourceType==='WIKIVOYAGE'){
   const candidate=wv.find(w=>w.dest===r.dest&&norm(w.name)===norm(r.name));
   base.evidence.description=candidate?.description||'';base.evidence.listingWebsite=candidate?.website||null;
  }
  result.push(base);
 }
 save(out+'/working.json',result);
 console.log(JSON.stringify({total:result.length,reassigned:result.filter((r,i)=>r.dest!==records[i].dest).map(r=>({name:r.name,dest:r.dest})),withDescription:result.filter(r=>r.evidence.description).length,withPhone:result.filter(r=>r.facts.phone).length,withHours:result.filter(r=>r.facts.openingHours).length}));
}

if(process.argv[2]==='evidence'){
 const list=read(out+'/working.json').filter(r=>r.kind!=='dish');
 const start=Number(process.argv[3]||0),count=Number(process.argv[4]||20);
 console.log(JSON.stringify(list.slice(start,start+count).map((r,i)=>({n:start+i,id:r.id,name:r.name,dest:r.dest,kind:r.kind,description:r.evidence.description,phone:r.facts.phone,hours:r.facts.openingHours,amenities:r.facts.amenities})),null,2));
}

if(process.argv[2]==='sites'){
 const list=read(fs.existsSync(out+'/resolved.json')?out+'/resolved.json':out+'/working.json');const sites=fs.existsSync(out+'/site-facts.json')?read(out+'/site-facts.json'):{};
 const queue=[...new Set(list.map(r=>r.website||r.evidence.listingWebsite).filter(Boolean))].filter(u=>!sites[u]);
 let done=0;
 const work=async()=>{while(queue.length){const source=queue.shift();try{const url=new URL(source);url.protocol='https:';if(!url.hostname.includes('.')||/^(localhost|127\.|10\.|192\.168\.)/.test(url.hostname))throw new Error('non-public host');const response=await fetch(url,{headers:{'User-Agent':'WanderResearch/1.1 (public travel catalog enrichment)'},signal:AbortSignal.timeout(16000)});const html=await response.text();const file=cache+'/sites/'+digest(source).slice(0,16)+'.html';fs.writeFileSync(file,html);const schemas=schemaItems(html);sites[source]={source,url:response.url,status:response.status,checkedAt:new Date().toISOString(),file,title:plain(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),schemas:schemas.filter(s=>/hotel|restaurant|lodging|bar|cafe|localbusiness/i.test(JSON.stringify(s['@type']))),mapLinks:[...html.matchAll(/https?:[^\s"'<>]*(?:google[^\s"'<>]*maps|maps[^\s"'<>]*)[^\s"'<>]*/gi)].map(m=>m[0]).slice(0,30)};}catch(e){sites[source]={source,error:e.message,checkedAt:new Date().toISOString()};}done++;save(out+'/site-facts.json',sites);if(done%20===0)console.log(JSON.stringify({done,remaining:queue.length}));}};
 await Promise.all(Array.from({length:5},work));console.log(JSON.stringify({total:Object.keys(sites).length,ok:Object.values(sites).filter(s=>s.status===200).length}));
}

if(process.argv[2]==='geocode'||process.argv[2]==='geocode-short'){
 const short=process.argv[2]==='geocode-short';
 const list=read(out+'/resolved.json'),file=out+(short?'/geocode-short-candidates.json':'/geocode-candidates.json'),data=fs.existsSync(file)?read(file):{};let n=0;
 // Tra cứu nhỏ một lần, một máy/một luồng, có cache, chậm hơn 1 request/giây; không tích hợp dịch vụ vào app.
 for(const r of list.filter(r=>r.kind!=='dish'&&r.positionDecision?.startsWith('HOLD')&&!data[r.id])){
  const query=(r.venueName||r.name).replace(/ ·.*$| - (?:Wellness|MGallery).*$/gi,'')+(short?'':' '+(r.locality||'')+' Vietnam');
  await new Promise(x=>setTimeout(x,1400));
  try{const response=await fetch('https://nominatim.openstreetmap.org/search?'+new URLSearchParams({q:query,countrycodes:'vn',format:'jsonv2',limit:'4',addressdetails:'1',extratags:'1',namedetails:'1'}),{headers:{'User-Agent':'WanderCatalog/1.1 (one-time public venue research; contact binkuteqn289@gmail.com)'},signal:AbortSignal.timeout(22000)});if(response.status===429){console.log('Nominatim rate limit; stop and keep cached results.');break;}if(!response.ok)throw new Error('HTTP '+response.status);data[r.id]={id:r.id,name:r.name,dest:r.dest,query,checkedAt:new Date().toISOString(),source:'OpenStreetMap contributors',license:'ODbL',hits:await response.json()};}catch(e){data[r.id]={id:r.id,name:r.name,query,error:e.message,hits:[]};}
  n++;save(file,data);if(n%15===0)console.log(JSON.stringify({done:n,hits:Object.values(data).filter(d=>d.hits?.length).length}));
 }
 console.log(JSON.stringify({total:Object.keys(data).length,withHits:Object.values(data).filter(d=>d.hits?.length).length}));
}

export {input,out,cache,read,save,norm,plain,digest,schemaItems,geography};

function km(a,b){const rad=n=>n*Math.PI/180,h=Math.sin(rad(a.lat-b.lat)/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(a.lon-b.lon)/2)**2;return 6371*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));}
const nameTokens=s=>norm(s).replace(/\b(the|hotel|resort|spa|hostel|guesthouse|guest|house|restaurant|cafe|coffee|saigon|sai gon|hanoi|ha noi|danang|da nang|hoi an|sapa|sa pa|phu quoc|nha trang|collection|mgallery|luxury|grand|and|by|leisure|vietnam|beach|khu|khach san|nha hang)\b/g,' ').split(/\s+/).filter(t=>t.length>2);
function similarity(a,b){const x=nameTokens(a),y=nameTokens(b);if(!x.length||!y.length)return 0;return x.filter(t=>y.includes(t)).length/Math.max(x.length,y.length);}

if(process.argv[2]==='resolve'){
 const list=read(out+'/working.json'),sites=read(out+'/site-facts.json'),osms=fs.existsSync(out+'/osm-positions.json')?read(out+'/osm-positions.json'):{};
 const audits=[];let found=0;
 for(const r of list){
  if(r.kind==='dish')continue;
  const url=r.website||r.evidence.listingWebsite,site=sites[url];
  if(site?.status===200){
   const matched=site.schemas?.filter(s=>similarity(s.name||'',r.name)>=0.75)||[];
   const specific=matched.find(s=>norm(s.name)===norm(r.name))||matched[0];
   if(specific){r.evidence.schema=specific;r.facts.phone=specific.telephone||r.facts.phone||null;r.facts.email=specific.email||r.facts.email||null;
    if(specific.checkinTime)r.facts.checkinTime=specific.checkinTime;if(specific.checkoutTime)r.facts.checkoutTime=specific.checkoutTime;
    if(specific.description&&!r.evidence.description)r.evidence.description=plain(specific.description);
    if(specific.geo){const c={lat:+specific.geo.latitude,lon:+specific.geo.longitude};if(Number.isFinite(c.lat)&&Number.isFinite(c.lon)&&c.lat>8&&c.lat<24&&c.lon>102&&c.lon<110)r.evidence.siteLocation=c;}
   }
  }
  const elements=osms[r.dest]?.elements||[];
  const hits=elements.map(e=>{const t=e.tags||{},name=t['name:en']||t.name||'';const location={lat:e.lat||e.center?.lat,lon:e.lon||e.center?.lon};if(!location.lat)return null;if(r.kind==='lodging'&&!t.tourism&&t.building!=='hotel')return null;const score=Math.max(similarity(r.name,name),similarity(r.name,t.name||''));if(score<0.8)return null;const own=nameTokens(r.name),other=nameTokens(name);if(own.length===1&&own[0].length<5&&norm(name)!==norm(r.name))return null;if(own.length>3&&own.filter(t=>other.includes(t)).length<2)return null;return{osm:e.type+'/'+e.id,name,location,tags:t,score,distance:r.location?km(r.location,location):null};}).filter(Boolean).sort((a,b)=>b.score-a.score||(a.distance??0)-(b.distance??0));
  const candidate=hits[0],ambiguous=candidate&&hits.slice(1).some(h=>h.score>=candidate.score&&km(h.location,candidate.location)>0.35);
  let decision='HOLD';
  if(r.sourceType==='OFFICIAL_OPERATOR'&&r.location)decision='OPERATOR_COORDINATES';
  else if(r.sourceType==='MICHELIN'&&r.location)decision='MICHELIN_COORDINATES';
  else if(candidate&&!ambiguous&&(!r.location||km(r.location,candidate.location)<0.6)){
   // Nhiều nguồn cùng xác định cơ sở; tuyệt đối không thay bằng mốc trung tâm thành phố.
   if(r.evidence.siteLocation&&km(r.evidence.siteLocation,candidate.location)>0.8)decision='HOLD_SITE_OSM_CONFLICT';
   else{r.location={...candidate.location,provenance:'NAMED_OSM_MATCH_WITH_PUBLISHED_ADDRESS'};r.sourceUrls=[...new Set([...r.sourceUrls,'https://www.openstreetmap.org/'+candidate.osm])];r.osm=candidate.osm;r.website=r.website||candidate.tags.website||candidate.tags['contact:website']||null;r.facts.phone=r.facts.phone||candidate.tags.phone||candidate.tags['contact:phone']||null;decision='NAMED_OSM_MATCH';found++;}
  }else if(r.location&&r.evidence.siteLocation&&km(r.location,r.evidence.siteLocation)<0.2){decision='GUIDE_AND_OPERATOR_COORDINATES';r.location={...r.evidence.siteLocation,provenance:'GUIDE_AND_OPERATOR_COORDINATES'};}
  r.positionDecision=decision;
  if(candidate||decision==='HOLD')audits.push({id:r.id,name:r.name,dest:r.dest,decision,candidates:hits.slice(0,3).map(({tags,...h})=>({...h,address:[tags['addr:housenumber'],tags['addr:street'],tags['addr:city']].filter(Boolean).join(', '),website:tags.website||tags['contact:website']}))});
 }
 save(out+'/resolved.json',list);save(out+'/position-review.json',audits);console.log(JSON.stringify({namedOsmMatches:found,decisions:Object.fromEntries([...new Set(list.map(r=>r.positionDecision).filter(Boolean))].map(k=>[k,list.filter(r=>r.positionDecision===k).length])),held:list.filter(r=>r.kind!=='dish'&&r.positionDecision?.startsWith('HOLD')).map(r=>({name:r.name,dest:r.dest,site:!!r.evidence.siteLocation}))},null,2));
}

if(process.argv[2]==='site-coordinates'){
 const sites=read(out+'/site-facts.json'),list=read(out+'/resolved.json'),result=[];
 for(const [url,site]of Object.entries(sites)){if(site.status!==200||!site.file)continue;const raw=fs.readFileSync(site.file,'utf8').replaceAll('&amp;','&').replaceAll('\\u0026','&');const candidates=[];
  const add=(lat,lon,kind)=>{lat=Number(lat);lon=Number(lon);if(lat>8&&lat<24&&lon>102&&lon<110&&!candidates.some(c=>Math.abs(c.lat-lat)<0.00001&&Math.abs(c.lon-lon)<0.00001))candidates.push({lat,lon,kind});};
  for(const m of raw.matchAll(/["'](?:latitude|lat)["']\s*:\s*["']?(-?\d+\.\d+)["']?[\s\S]{0,170}?["'](?:longitude|lng|lon)["']\s*:\s*["']?(-?\d+\.\d+)/gi))add(m[1],m[2],'JSON_COORDINATES');
  for(const m of raw.matchAll(/(?:[?&](?:q|query|ll|center)=|\/maps\/[^"'<>]{0,100}?@)(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/gi))add(m[1],m[2],'MAP_LINK_COORDINATES');
  for(const m of raw.matchAll(/data-lat(?:itude)?=["'](-?\d+\.\d+)["'][^>]{0,120}data-l(?:ongitude|ng|on)=["'](-?\d+\.\d+)/gi))add(m[1],m[2],'MAP_DATA_ATTRIBUTES');
  if(candidates.length)result.push({url,title:site.title,records:list.filter(r=>(r.website||r.evidence.listingWebsite)===url).map(r=>({id:r.id,name:r.name,previous:r.location,address:r.address,decision:r.positionDecision})),candidates});
 }
 save(out+'/site-position-candidates.json',result);console.log(JSON.stringify(result.filter(r=>r.records.some(x=>x.decision?.startsWith('HOLD'))),null,2));
}

if(process.argv[2]==='osm'){
 const file=out+'/osm-positions.json';const data=fs.existsSync(file)?read(file):{};
 const wanted=new Set(read(out+'/working.json').filter(r=>!r.location&&r.dest&&r.kind!=='dish').map(r=>r.dest));
 for(const d of catalogs.filter(d=>wanted.has(d.id)&&!data[d.id])){
  const ref=d.references[0],query=`[out:json][timeout:45];(nwr["tourism"~"^(hotel|guest_house|hostel|resort|motel)$"]["name"](around:25000,${ref.lat},${ref.lon});nwr["amenity"~"^(cafe|bar|pub)$"]["name"](around:12000,${ref.lat},${ref.lon}););out center tags 2500;`;
  try{const response=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':'WanderResearch/1.1 (one-time catalog position verification)'},body:'data='+encodeURIComponent(query),signal:AbortSignal.timeout(65000)});if(!response.ok)throw new Error('HTTP '+response.status);const body=await response.json();data[d.id]={dest:d.id,checkedAt:new Date().toISOString(),source:'OpenStreetMap contributors',license:'ODbL',elements:body.elements||[]};console.log(JSON.stringify({dest:d.id,n:body.elements?.length}));save(file,data);}catch(e){console.log(JSON.stringify({dest:d.id,error:e.message}));}await new Promise(r=>setTimeout(r,1500));
 }
}
