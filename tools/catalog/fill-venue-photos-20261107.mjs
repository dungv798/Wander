import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const out='docs/research/photo-fill-20261107',cache='.logs/photo-fill-20261107';
for(const d of[out,cache,cache+'/images'])fs.mkdirSync(d,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const cats=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));
if(!fs.existsSync(out+'/baseline.json'))save(out+'/baseline.json',cats);
const places=cats.flatMap(d=>d.places.filter(p=>p.venue&&!p.photos.length).map(p=>({...p,dest:d.id,destName:d.name})));
const aliases={
 'Hôtel des Arts Saigon - MGallery Collection':'Hotel des Arts Saigon',"Hotel de l'Opera Hanoi - MGallery Collection":"Hotel de l'Opera Hanoi",'Hotel de la Coupole Sapa - MGallery Collection':'Hotel de la Coupole',
 'Sofitel Saigon Plaza':'Sofitel Saigon Plaza','Legacy Yen Tu Resort & Retreat - MGallery Collection':'Legacy Yen Tu',
 'La Veranda Resort Phu Quoc - MGallery Collection':'La Veranda','JW Marriott Phu Quoc Emerald Bay Resort & Spa':'JW Marriott Phu Quoc',
 'InterContinental Danang Sun Peninsula Resort':'InterContinental Danang','JW Marriott Hotel Hanoi':'JW Marriott Hanoi',
 'Namia River Retreat - Wellness Inclusive Resort':'Namia River Retreat','Mia Saigon – Luxury Boutique Hotel':'Mia Saigon',
 'Premier Village Phu Quoc Resort - Managed by Accor':'Premier Village Phu Quoc','Salinda Resort Phu Quoc Island':'Salinda',
 'AZURE BEACH LOUNGE · Pullman Danang Beach Resort':'Azure Beach Lounge','Bún Chả Hương Liên':'Huong Lien',
};
const city={ 'ha-noi':'Hanoi','ho-chi-minh':'Saigon','da-nang':'Danang','hoi-an':'Hoi An','hue':'Hue','da-lat':'Dalat','nha-trang':'Nha Trang','quy-nhon':'Quy Nhon','sa-pa':'Sapa','ha-long':'Ha Long','phu-quoc':'Phu Quoc','ninh-binh':'Ninh Binh','phong-nha':'Phong Nha','can-tho':'Can Tho','phu-yen':'Phu Yen','ha-giang':'Ha Giang','cao-bang':'Cao Bang','vinh-hy':'Vinh Hy','ta-xua':'Ta Xua','buon-ma-thuot':'Buon Ma Thuot'};
const command=process.argv[2],isCommons=command?.startsWith('commons');
const file=out+(command==='commons-slow'?'/commons-wave2.json':command==='download'&&process.argv.includes('--selected-only')?'/commons-selected-titles.json':['download','sheets'].includes(command)&&fs.existsSync(out+'/combined.json')?'/combined.json':'/candidates.json');
const data=fs.existsSync(file)?read(file):command==='commons-slow'&&fs.existsSync(out+'/candidates.json')?read(out+'/candidates.json'):{};
const titleFor=p=>aliases[p.name]||p.name.replace(/ ·.*$/,'').replace(/ \(.*\)$/,'').replace(/\s*[-–]\s*(?:MGallery|Handwritten|Managed by).*$/i,'').replace(/\s*\b(?:Resort and Spa|Resort & Spa|Collection|Vietnam)\s*$/i,'');
const order=places.toSorted((a,b)=>(a.venue.kind==='lodging'?0:1)-(b.venue.kind==='lodging'?0:1));
if(command==='merge'){
 const merged={};for(const filename of ['candidates.json','commons-wave2.json','commons-batches.json','flickr-candidates.json','flickr-alias-candidates.json','commons-selected-titles.json','commons-categories.json']){if(!fs.existsSync(out+'/'+filename))continue;for(const p of Object.values(read(out+'/'+filename))){const old=merged[p.id];merged[p.id]={...old,...p,candidates:[...new Map([...(old?.candidates||[]),...p.candidates].map(c=>[c.id,c])).values()]};}}
 save(out+'/combined.json',merged);console.log(JSON.stringify({venues:Object.keys(merged).length,withCandidates:Object.values(merged).filter(p=>p.candidates.length).length,candidates:Object.values(merged).reduce((n,p)=>n+p.candidates.length,0)}));
}
if(isCommons||command==='openverse'){
 let checked=0;
 for(const p of order.filter(p=>!data[p.id]?.[isCommons?'commons':'openverse']).slice(0,Number(process.argv[3]||500))){
  const base=titleFor(p),query='"'+base.replaceAll('"','')+'"'+(isCommons?' filetype:bitmap':' '+city[p.dest]);
  const key=isCommons?'commons':'openverse';data[p.id]||={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,candidates:[]};
  try{
   await sleep(command==='commons-slow'?5000:isCommons?1000:1500);
   const url=isCommons?'https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'1280',iiextmetadatafilter:'LicenseShortName|Artist|ImageDescription|DateTimeOriginal|AttributionRequired'}):'https://api.openverse.org/v1/images/?'+new URLSearchParams({q:query,page_size:'12',license_type:'commercial'});
   let response=await fetch(url,{headers:{'User-Agent':'WanderPhotoReview/1.2 (named business photo research; cached, single worker)'},signal:AbortSignal.timeout(22000)});
   if(command==='commons-slow'&&response.status===429){const retry=Number(response.headers.get('retry-after'))||15;if(retry<=30){console.log('Commons Retry-After '+retry+'s; waiting before one retry.');await sleep((retry+2)*1000);response=await fetch(url,{headers:{'User-Agent':'WanderPhotoReview/1.2 (cached, single worker)'},signal:AbortSignal.timeout(22000)});}}
   if(response.status===429){save(out+'/'+key+'-rate-limit.json',{at:new Date().toISOString(),retryAfter:response.headers.get('retry-after'),query});console.log(key+' rate limit; cached work retained.');break;}if(!response.ok)throw new Error('HTTP '+response.status);
   const body=await response.json(),candidates=[];
   if(isCommons){fs.mkdirSync(out+'/commons-responses',{recursive:true});save(out+'/commons-responses/'+p.id+'.json',body);}
   for(const item of isCommons?body.query?.pages||[]:body.results||[]){
    const info=isCommons?item.imageinfo?.[0]:item;if(!info)continue;
    const title=item.title,license=isCommons?plain(info.extmetadata?.LicenseShortName?.value):item.license==='pdm'?'Public domain':item.license==='cc0'?'CC0':'CC '+item.license.toUpperCase()+' '+item.license_version;
    if(!/^(CC BY(?:-SA)? [\d.]+(?: de)?|CC0|Public domain)$/.test(license)||Math.min(info.width||0,info.height||0)<350||Math.max(info.width||0,info.height||0)<640||!/\.jpe?g(?:\?|$)/i.test(info.url)||/\b(?:bill|menu|logo|poster|receipt|flyer|brochure|signatures|map of)\b/i.test(title))continue;
    const sourceUrl=isCommons?info.descriptionurl:item.foreign_landing_url;
    const description=isCommons?plain(info.extmetadata?.ImageDescription?.value):item.title;
    const tokens=norm(base).split(' ').filter(t=>t.length>2&&!/^(hotel|resort|restaurant|saigon|hanoi|danang|spa|the|and|vietnam|collection)$/.test(t));
    const text=norm(title+' '+description);
    const match=tokens.filter(t=>text.includes(t));
    candidates.push({id:hash(sourceUrl).slice(0,18),provider:command,title,description,url:info.thumburl||info.url,originalUrl:info.url,sourceUrl,author:plain(isCommons?info.extmetadata?.Artist?.value:item.creator),license,licenseUrl:command==='openverse'?item.license_url:null,width:info.width,height:info.height,matchedTokens:match,identityTokens:tokens,checkedAt:'2026-11-07',status:'PENDING_REVIEW'});
   }
   data[p.id][key]={query,status:response.status,checkedAt:new Date().toISOString(),candidates:candidates.length};
   data[p.id].candidates=[...new Map([...data[p.id].candidates,...candidates].map(x=>[x.id,x])).values()];
  }catch(e){data[p.id][key]={query,error:e.message};}
  checked++;save(file,data);if(checked%20===0)console.log(JSON.stringify({provider:command,checked,venuesWithCandidates:Object.values(data).filter(p=>p.candidates.length).length}));
 }
 console.log(JSON.stringify({venues:Object.keys(data).length,candidates:Object.values(data).reduce((n,p)=>n+p.candidates.length,0)}));
}
if(command==='download'){
 const downloadFile=out+'/downloads.json',downloads=fs.existsSync(downloadFile)?read(downloadFile):{};let done=0;
 const blocked=new Set(),limitsFile=out+'/image-host-limits.json',limits=fs.existsSync(limitsFile)?read(limitsFile):{};
 const reviewLimit=process.argv.includes('--review-all')?25:3;
 const jobs=Object.values(data).flatMap(p=>{const strong=p.candidates.filter(c=>c.identityTokens.length&&c.matchedTokens.length>=Math.min(2,c.identityTokens.length)).toSorted((a,b)=>Number(b.provider==='commons-explicit-title')-Number(a.provider==='commons-explicit-title'));const licensedSearch=p.candidates.filter(c=>c.provider==='flickr-public-search'&&!strong.some(s=>s.id===c.id)).slice(0,1);return [...strong.slice(0,reviewLimit),...licensedSearch].map(c=>({...c,placeId:p.id,name:p.name,dest:p.dest,address:p.address}));});
 for(const p of jobs){
  if(downloads[p.id]?.localFile)continue;
  const target=cache+'/images/'+p.id+'.jpg';
  try{
   let imageUrl=p.url;
   // Dùng URL preview được chính trang ảnh Commons công bố; không đoán lại đường dẫn thumbnail từ API.
   if(new URL(p.sourceUrl).hostname==='commons.wikimedia.org'){
    const pageFile=cache+'/wiki-page-'+p.id+'.html';let html;
    if(fs.existsSync(pageFile))html=fs.readFileSync(pageFile,'utf8');else{
     if(blocked.has('commons.wikimedia.org'))continue;
     await sleep(1000);const source=await fetch(p.sourceUrl,{headers:{'User-Agent':'WanderPhotoReview/1.2 (public photo source and license review)'},signal:AbortSignal.timeout(20000)});
     if(source.status===429){blocked.add('commons.wikimedia.org');console.log('Commons pages rate limited; pausing this host.');continue;}if(!source.ok)throw new Error('Source page HTTP '+source.status);html=await source.text();fs.writeFileSync(pageFile,html);
    }
    const preview=html.match(/property=["']og:image["'][^>]*content=["']([^"']+)/)?.[1]?.replaceAll('&amp;','&');
    if(preview&&['thumb.wikimedia.org','upload.wikimedia.org'].includes(new URL(preview).hostname))imageUrl=preview;
   }
   const host=new URL(imageUrl).hostname;if(blocked.has(host)||limits[host]&&Date.now()<Date.parse(limits[host].at)+limits[host].retryAfterSeconds*1000)continue;
   await sleep(1400);const response=await fetch(imageUrl,{headers:{'User-Agent':'WanderPhotoReview/1.2 (licensed named business image curation)'},signal:AbortSignal.timeout(24000)});if(response.status===429){blocked.add(host);limits[host]={at:new Date().toISOString(),retryAfterSeconds:Number(response.headers.get('retry-after'))||120};save(limitsFile,limits);console.log('Image host paused after rate limit: '+host);continue;}if(!response.ok)throw new Error('HTTP '+response.status);const bytes=Buffer.from(await response.arrayBuffer());if(bytes[0]!==255||bytes[1]!==216)throw new Error('Not JPEG');fs.writeFileSync(target,bytes);downloads[p.id]={...p,publicPreviewUrl:imageUrl,localFile:target,bytes:bytes.length};done++;
  }
  catch(e){downloads[p.id]={...p,error:e.message};}
  save(downloadFile,downloads);if(done&&done%20===0)console.log(JSON.stringify({downloaded:done}));
 }console.log(JSON.stringify({downloaded:Object.values(downloads).filter(p=>p.localFile).length,total:jobs.length}));
}
if(command==='sheets'||command==='selected-sheets'){
 const {chromium}=await import('playwright-core'),browser=await chromium.launch({channel:'chrome',headless:true});
 const excludeFile=process.argv[3],excluded=new Set(excludeFile?read(excludeFile).map(p=>p.id):[]);
 const selected=command==='selected-sheets'?Object.values(read(out+'/commons-selected-titles.json')).flatMap(p=>p.candidates.map(c=>({...c,placeId:p.id,name:p.name,dest:p.dest,address:p.address}))):null,downloads=Object.values(read(out+'/downloads.json'));
 const photos=(selected?selected.map(p=>({...downloads.find(d=>d.id===p.id),...p})):downloads).filter(p=>p.localFile&&!excluded.has(p.id)),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 try{const page=await browser.newPage({viewport:{width:1440,height:1100}});for(let i=0;i<photos.length;i+=16){const prefix=cache+'/sheet-'+(i/16+1),items=photos.slice(i,i+16);fs.writeFileSync(prefix+'.html','<meta charset=utf-8><style>body{font:11px system-ui;background:#edf2ef}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{background:white;padding:7px;margin:0}img{width:100%;height:185px;object-fit:contain}figcaption{height:92px;overflow:hidden}</style><div class=grid>'+items.map((p,k)=>'<figure><img src="'+pathToFileURL(path.resolve(p.localFile)).href+'"><figcaption><b>'+(i+k+1)+' '+esc(p.name)+'</b><br>'+esc(p.title)+'<br>'+esc(p.description.slice(0,190))+'<br>'+esc(p.license)+'</figcaption></figure>').join('')+'</div>');await page.goto(pathToFileURL(path.resolve(prefix+'.html')).href);await page.screenshot({path:prefix+'.png',fullPage:true});}}finally{await browser.close();}
 save(out+'/sheet-index.json',photos.map((p,i)=>({index:i+1,...p})));console.log(JSON.stringify({images:photos.length,sheets:Math.ceil(photos.length/16)}));
}
