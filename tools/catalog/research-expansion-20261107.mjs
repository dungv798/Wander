import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const out = 'docs/research/expansion-20261107';
fs.mkdirSync(path.join(out, 'sources'), {recursive:true});
const targets = {
  wikivoyage: 'https://en.wikivoyage.org/w/api.php?action=parse&page=Hoi_An&prop=wikitext&format=json',
  accor: 'https://all.accor.com/a/en/destination/country/hotels-vietnam-pvn.html',
  vinpearl: 'https://vinpearl.com/en/hotels',
  muongthanh: 'https://muongthanh.com/khach-san',
  tourism: 'https://vietnam.travel/things-to-do/21-must-try-vietnamese-dishes',
  michelin: 'https://guide.michelin.com/en/vn/restaurants/page/2',
};

async function fetchSource(key, url) {
  const filename = key.replace(/[^\w-]/g,'_') + '.txt';
  const target = path.join(out, 'sources', filename);
  if (fs.existsSync(target)) return fs.readFileSync(target, 'utf8');
  const response = await fetch(url, {headers:{'User-Agent':'WanderResearch/1.0 (public travel catalog research)'},signal:AbortSignal.timeout(30000)});
  const body = await response.text();
  const meta = {url, fetchedAt:new Date().toISOString(),status:response.status,bytes:Buffer.byteLength(body),sha256:crypto.createHash('sha256').update(body).digest('hex'),file:filename};
  fs.writeFileSync(path.join(out,'sources',key+'.meta.json'),JSON.stringify(meta,null,2)+'\n');
  if(response.ok && body.length>100) fs.writeFileSync(target,body);
  console.log(JSON.stringify(meta));
  return body;
}

if(process.argv[2]==='probe') {
  const results = await Promise.allSettled(Object.entries(targets).map(([key,url])=>fetchSource(key,url)));
  results.forEach((r,i)=>{if(r.status==='rejected')console.log(JSON.stringify({key:Object.keys(targets)[i],error:r.reason.message}));});
}

if(process.argv[2]==='inspect') {
 const a=fs.readFileSync(path.join(out,'sources/accor.txt'),'utf8');
 console.log([...a.matchAll(/<script[^>]*type=.application\/ld\+json.[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1].slice(0,9000)).join('\n'));
 const w=JSON.parse(fs.readFileSync(path.join(out,'sources/wikivoyage.txt'),'utf8')).parse.wikitext['*'];
 console.log(w.slice(w.indexOf('==Eat'),w.indexOf('==Eat')+5000));
 console.log(a.match(/.{0,120}hotelName.{0,250}/g)?.slice(0,3));
 console.log(a.match(/.{0,120}latitude.{0,250}/g)?.slice(0,3));
}

export {out, fetchSource};

if(process.argv[2]==='parse-accor') {
 const text=fs.readFileSync(path.join(out,'sources/accor.txt'),'utf8'),hotels=[];
 for(const m of text.matchAll(/<script[^>]*type=.application\/ld\+json.[^>]*>([\s\S]*?)<\/script>/g))try{
  const walk=o=>{if(!o||typeof o!=='object')return;if(o['@type']==='Hotel')hotels.push(o);else Object.values(o).forEach(v=>Array.isArray(v)?v.forEach(walk):walk(v));};walk(JSON.parse(m[1]));
 }catch{}
 fs.writeFileSync(path.join(out,'accor-hotels.json'),JSON.stringify(hotels,null,2)+'\n');
 console.log(JSON.stringify({total:hotels.length,hotels:hotels.map(h=>({name:h.name,city:h.address?.addressLocality,url:h.url}))}));
}

if(process.argv[2]==='check-websites') {
 const candidates=JSON.parse(fs.readFileSync(path.join(out,'wikivoyage-candidates.json'),'utf8'));
 const doneFile=path.join(out,'website-checks.json');const checks=fs.existsSync(doneFile)?JSON.parse(fs.readFileSync(doneFile,'utf8')):{};
 const urls=[...new Set(candidates.map(c=>c.website).filter(u=>/^https?:\/\//i.test(u)))];
 const queue=urls.filter(u=>!checks[u]);let count=0;
 const workers=Array.from({length:6},async()=>{while(queue.length){const original=queue.shift();try{
  const url=new URL(original);if(!url.hostname.includes('.')||/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname))throw new Error('non-public host');url.protocol='https:';
  const r=await fetch(url,{signal:AbortSignal.timeout(14000),headers:{'User-Agent':'WanderResearch/1.0 (travel catalog fact checking)'}});const raw=(await r.text()).slice(0,1200000);
  const body=plain(raw.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' '));
  checks[original]={url:url.href,finalUrl:r.url,status:r.status,checkedAt:new Date().toISOString(),title:plain(raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),text:body.slice(0,24000),sha256:crypto.createHash('sha256').update(raw).digest('hex')};
 }catch(e){checks[original]={checkedAt:new Date().toISOString(),error:e.message};}
 count++;fs.writeFileSync(doneFile,JSON.stringify(checks,null,2)+'\n');if(count%20===0)console.log(JSON.stringify({checked:count,remaining:queue.length}));}});
 await Promise.all(workers);console.log(JSON.stringify({total:Object.keys(checks).length,success:Object.values(checks).filter(c=>c.status===200).length}));
}

if(process.argv[2]==='collect-accor-details') {
 const hotels=JSON.parse(fs.readFileSync(path.join(out,'accor-hotels.json'),'utf8'));
 for(const hotel of hotels){try{await fetchSource('accor-'+hotel['@id'],hotel.url);}catch(e){console.log(JSON.stringify({name:hotel.name,error:e.message}));}}
}

if(process.argv[2]==='fetch-food-sources') {
 const {default:foods}=await import('./research-local-foods-20261107.mjs');
 for(const url of new Set(foods.map(f=>f.sourceUrl))){if(url.endsWith('.pdf'))continue;try{await fetchSource('food-'+crypto.createHash('sha256').update(url).digest('hex').slice(0,12),url);}catch(e){console.log(JSON.stringify({url,error:e.message}));}}
}

if(process.argv[2]==='audit-food') {
 const {default:foods}=await import('./research-local-foods-20261107.mjs');
 const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 for(const f of foods){const p=path.join(out,'sources','food-'+crypto.createHash('sha256').update(f.sourceUrl).digest('hex').slice(0,12)+'.txt');if(!fs.existsSync(p))continue;const raw=fs.readFileSync(p,'utf8');const body=norm(raw);const tokens=norm(f.name).split(' ').filter(t=>t.length>1);const absent=tokens.filter(t=>!body.includes(t));if(absent.length>=2)console.log(JSON.stringify({name:f.name,absent,source:f.sourceUrl}));}
 const records=JSON.parse(fs.readFileSync(path.join(out,'records.json'),'utf8')).records;
 console.log(JSON.stringify({wv:records.filter(r=>r.sourceType==='WIKIVOYAGE').map(r=>({name:r.name,title:r.verification.websiteCheck?.title,dest:r.dest})),long:records.filter(r=>r.address?.length>240||r.name.length>120).map(r=>r.name)},null,2));
}

const pages = {
 'ha-noi':['Hanoi'], 'ho-chi-minh':['Ho Chi Minh City'], 'da-nang':['Da Nang'], 'hoi-an':['Hoi An'],
 'hue':['Hue'], 'da-lat':['Da Lat'], 'nha-trang':['Nha Trang'], 'phu-yen':['Tuy Hoa'],
 'quy-nhon':['Quy Nhon'], 'ha-giang':['Ha Giang','Dong Van','Meo Vac'], 'cao-bang':['Cao Bang'],
 'sa-pa':['Sa Pa'], 'ta-xua':['Ta Xua'], 'vinh-hy':['Vinh Hy','Phan Rang–Thap Cham'],
 'phong-nha':['Phong Nha-Ke Bang'], 'ninh-binh':['Ninh Binh'], 'ha-long':['Ha Long Bay','Ha Long'],
 'can-tho':['Can Tho'], 'buon-ma-thuot':['Buon Ma Thuot'], 'phu-quoc':['Phu Quoc'],
};
if(process.argv[2]==='collect-wv') {
 for(const [dest,titles] of Object.entries(pages)) {
  for(const title of titles)try{await new Promise(r=>setTimeout(r,1800));await fetchSource('wv-'+dest+'-'+titles.indexOf(title),'https://en.wikivoyage.org/w/api.php?'+new URLSearchParams({action:'parse',page:title,prop:'wikitext|revid',format:'json',redirects:'1'}));}catch(e){console.log(JSON.stringify({dest,title,error:e.message}));}
 }
}

function plain(s='') {return s.replace(/\[\[(?:[^\]|]*\|)?([^\]]+)\]\]/g,'$1').replace(/<[^>]*>/g,' ').replace(/'{2,}/g,'').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function templates(text) {
 const result=[]; let depth=0,start=0;
 for(let i=0;i<text.length-1;i++) {
  if(text.slice(i,i+2)==='{{'){if(depth===0)start=i;depth++;i++;}
  else if(text.slice(i,i+2)==='}}'){depth--;i++;if(depth===0)result.push(text.slice(start+2,i-1));}
 }
 return result;
}
if(process.argv[2]==='parse-wv') {
 const records=[];
 for(const [dest,titles] of Object.entries(pages))for(let n=0;n<titles.length;n++){
  const file=path.join(out,'sources',`wv-${dest}-${n}.txt`);if(!fs.existsSync(file))continue;
  const d=JSON.parse(fs.readFileSync(file,'utf8'));if(!d.parse)continue;
  for(const t of templates(d.parse.wikitext['*'])) {
   const kind=t.split('|')[0].trim().toLowerCase();if(!['eat','drink','sleep'].includes(kind))continue;
   const fields=Object.fromEntries([...t.matchAll(/\|\s*(\w+)\s*=\s*([\s\S]*?)(?=\|\s*\w+\s*=|$)/g)].map(m=>[m[1],plain(m[2])]));
   if(!fields.name)continue;
   records.push({dest,kind:kind==='sleep'?'lodging':kind==='eat'?'restaurant':'cafe',name:fields.name,address:fields.address||null,lat:Number(fields.lat)||null,lon:Number(fields.long)||null,website:fields.url||null,sourceUpdated:fields.lastedit||null,sourceUrl:d.parse.revid?'https://en.wikivoyage.org/w/index.php?title='+encodeURIComponent(d.parse.title)+'&oldid='+d.parse.revid:'https://en.wikivoyage.org/wiki/'+encodeURIComponent(d.parse.title.replaceAll(' ','_')),sourceRevision:d.parse.revid||null,sourceFile:path.basename(file),description:fields.content||'',alt:fields.alt||null});
  }
 }
 fs.writeFileSync(path.join(out,'wikivoyage-candidates.json'),JSON.stringify(records,null,2)+'\n');
 console.log(JSON.stringify({total:records.length,byDest:Object.fromEntries(Object.keys(pages).map(d=>[d,records.filter(r=>r.dest===d).length])),withWebsite:records.filter(r=>r.website).length,withCoordinates:records.filter(r=>r.lat&&r.lon).length,samples:records.slice(0,2)},null,2));
}

if(process.argv[2]==='michelin-jobs') {
 const jobs=[];
 for(const file of fs.readdirSync(path.join(out,'sources')).filter(f=>/^michelin-(web|hotels)-\d.txt$/.test(f))){
  const raw=fs.readFileSync(path.join(out,'sources',file),'utf8');const ref=raw.match(/cite.([\w]+)./u)?.[1]||raw.match(/turn\d+view\d+/)?.[0];
  const lines=raw.replace(/^L\d+: ?/gm,'').split('\n');
  for(let i=0;i<lines.length;i++){
   const m=lines[i].match(/^### 【(\d+)†(.+?)】/);if(!m)continue;
   const following=lines.slice(i+1,i+8).map(l=>l.trim()).filter(Boolean);
   if(!following[0]?.includes(', Vietnam'))continue;
   jobs.push({key:file.replace('.txt','')+'-'+m[1],ref,id:Number(m[1]),name:m[2].trim(),locality:following[0].replace(', Vietnam',''),cuisine:following.find(l=>l.includes(' · '))?.split(' · ')[1]||null,kind:file.includes('hotels')?'lodging':'restaurant'});
  }
 }
 fs.writeFileSync(path.join(out,'michelin-jobs.json'),JSON.stringify(jobs,null,2)+'\n');console.log(JSON.stringify(jobs));
}

if(process.argv[2]==='map-jobs') {
 const jobs=JSON.parse(fs.readFileSync(path.join(out,'michelin-details-index.json'),'utf8')),maps=[];
 for(const j of jobs){if(j.kind!=='restaurant')continue;const raw=fs.readFileSync(path.join(out,'sources',j.key+'.txt'),'utf8');
 const m=raw.match(/【(\d+)†Location of [^】]* on the map†www.google.com】/);if(m)maps.push({key:j.key,ref:j.detailRef,id:Number(m[1])});}
 console.log(JSON.stringify(maps));
}

if(process.argv[2]==='inspect-details') {
 const a=fs.readFileSync(path.join(out,'sources/accor-8838.txt'),'utf8');
 console.log(a.match(/.{0,120}Restaurant.{0,150}/g)?.slice(0,12));
 console.log(a.match(/.{0,80}restaurantName.{0,300}/g)?.slice(0,5));
 console.log(a.match(/.{0,80}EPICE.{0,300}/gi)?.slice(0,8));
 const i=a.indexOf('id="carousel-catering"');console.log(a.slice(i,i+9500));
 const checks=JSON.parse(fs.readFileSync(path.join(out,'website-checks.json'),'utf8'));console.log(JSON.stringify({checks:Object.keys(checks).length,ok:Object.values(checks).filter(c=>c.status===200).length}));
}
