import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/research/photo-fill-20261107',cache=dir+'/category-responses';fs.mkdirSync(cache,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const venues=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).flatMap(f=>{const d=read('backend/src/main/resources/catalog/'+f);return d.places.filter(p=>p.venue&&!p.photos.length).map(p=>({...p,dest:d.id}));});
const cities=['Hanoi','Ho Chi Minh City','Da Nang','Hoi An','Hue','Nha Trang','Da Lat','Phu Quoc','Can Tho','Sa Pa'];
const queue=['Hotels','Restaurants'].flatMap(t=>cities.map(c=>({title:`Category:${t} in ${c}`,depth:0})));
const visited=new Set(),pages=new Map();let network=0;
for(let i=0;i<queue.length&&visited.size<70;i++){
 const {title,depth}=queue[i];if(visited.has(title))continue;visited.add(title);const file=cache+'/'+hash(title).slice(0,18)+'.json';let body;
 if(fs.existsSync(file))body=read(file);else{
  await new Promise(r=>setTimeout(r,3500));const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'categorymembers',gcmtitle:title,gcmlimit:'200',gcmtype:'file|subcat',prop:'imageinfo',iiprop:'url|size|extmetadata'});
  let res=await fetch(url,{headers:{'User-Agent':'WanderPhotoReview/1.3 (cached category discovery)'},signal:AbortSignal.timeout(25000)});if(res.status===429){const wait=Number(res.headers.get('retry-after'))||15;await new Promise(r=>setTimeout(r,(wait+2)*1000));res=await fetch(url,{signal:AbortSignal.timeout(25000)});}if(!res.ok){console.log('Paused metadata search HTTP '+res.status);break;}
  body=await res.json();save(file,body);network++;
 }
 for(const p of body.query?.pages||[]){if(p.ns===14&&depth<1&&!/demolish|former|historic|closed/i.test(p.title))queue.push({title:p.title,depth:depth+1});else if(p.imageinfo?.[0])pages.set(p.pageid,p);}
 if(i%10===0)console.log(JSON.stringify({categories:visited.size,images:pages.size}));
}
save(dir+'/category-pages.json',[...pages.values()]);const out={};
for(const p of venues){const base=p.name.split(' · ')[0].replace(/\s*\(.*\)/,'').replace(/\s*[-–].*Collection$/,'');const name=norm(base),compact=name.replaceAll(' ','');if(compact.length<6)continue;
 const candidates=[];for(const page of pages.values()){
  const info=page.imageinfo[0],description=plain(info.extmetadata?.ImageDescription?.value),text=norm(page.title+' '+description);if(!text.replaceAll(' ','').includes(compact))continue;
  const license=plain(info.extmetadata?.LicenseShortName?.value);if(!/^(CC BY(?:-SA)? [\d.]+|CC0|Public domain)$/.test(license)||!/\.jpe?g(?:\?|$)/i.test(info.url)||Math.min(info.width,info.height)<350)continue;
  candidates.push({id:hash(info.descriptionurl).slice(0,18),provider:'commons-category',title:page.title,description,url:info.url,originalUrl:info.url,sourceUrl:info.descriptionurl,author:plain(info.extmetadata.Artist?.value),license,width:info.width,height:info.height,identityTokens:[compact],matchedTokens:[compact],checkedAt:'2026-11-07',status:'PENDING_REVIEW'});
 }if(candidates.length)out[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,candidates:candidates.slice(0,5)};
}
save(dir+'/commons-categories.json',out);console.log(JSON.stringify({categories:visited.size,network,images:pages.size,matchedVenues:Object.keys(out).length}));
