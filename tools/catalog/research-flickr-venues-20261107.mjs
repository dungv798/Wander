import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/research/photo-fill-20261107',cache='.logs/photo-fill-20261107/flickr';fs.mkdirSync(cache,{recursive:true});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,d)=>fs.writeFileSync(f,JSON.stringify(d,null,2)+'\n');
export function objects(html,model='photo-lite-models'){
 const result=[];
 for(const m of html.matchAll(new RegExp('"_flickrModelRegistry":"'+model+'"','g'))){
  const start=html.lastIndexOf('{"data":',m.index);if(start<0)continue;let depth=0,quoted=false,escape=false;
  for(let i=start;i<html.length;i++){const c=html[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;}else if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0){try{const d=JSON.parse(html.slice(start,i+1)).data;if(d._flickrModelRegistry===model)result.push(d);}catch{}break;}}
 }return result;
}
if(process.argv[2]==='probe'){
 const rows=objects(fs.readFileSync('.logs/photo-fill-20261107/flickr-search-probe.html','utf8'));
 console.log(JSON.stringify({count:rows.length,sample:rows.slice(0,2).map(p=>({keys:Object.keys(p),id:p.id,title:p.title,description:p.description,geo:p.geo,latitude:p.latitude,longitude:p.longitude,license:p.license,tags:p.tags}))},null,2));
}
if(['search','aliases'].includes(process.argv[2])){
 const isAlias=process.argv[2]==='aliases';
 const file=dir+(isAlias?'/flickr-alias-candidates.json':'/flickr-candidates.json'),data=fs.existsSync(file)?read(file):{};
 const aliases={'JW Marriott Phu Quoc Emerald Bay Resort & Spa':'JW Marriott Phu Quoc','Hôtel des Arts Saigon - MGallery Collection':'Hotel des Arts Saigon',"Hotel de l'Opera Hanoi - MGallery Collection":"Hotel de l'Opera Hanoi",'Hotel de la Coupole Sapa - MGallery Collection':'Hotel de la Coupole Sapa','Azerai La Residence, Hue':'La Residence Hue','An Lam Retreats Ninh Van Bay':'An Lam Ninh Van Bay','JW Marriott Hotel Hanoi':'Marriott Hanoi','Legacy Yen Tu Resort & Retreat - MGallery Collection':'Legacy Yen Tu','Premier Village Phu Quoc Resort - Managed by Accor':'Premier Village Phu Quoc','Mia Saigon – Luxury Boutique Hotel':'Mia Saigon','Mövenpick Hotel Hanoi Centre':'Movenpick Hanoi','Mövenpick Resort Cam Ranh':'Movenpick Cam Ranh','La Veranda Resort Phu Quoc - MGallery Collection':'La Veranda Phu Quoc','Hotel Nikko Saigon':'Nikko Saigon','La Siesta Premium Saigon':'La Siesta Saigon','Bạch Suites Saigon':'Bach Suites Saigon','Mai House Saigon Hotel':'Mai House Saigon','Banyan Tree Lang Co Vietnam':'Banyan Tree Lang Co','New World Phu Quoc Resort':'New World Phu Quoc','Pullman Phu Quoc Beach Resort':'Pullman Phu Quoc','InterContinental Danang Sun Peninsula Resort':'Intercontinental Danang','Novotel Danang Premier Han River':'Novotel Danang','The Reverie Saigon':'Reverie Saigon','Salinda Resort Phu Quoc Island':'Salinda Phu Quoc','Lotte Hotel Hanoi':'Lotte Center Hanoi','HAIAN Beach Hotel & Spa':'Haian Danang','XLIII Specialty Coffee · 43 Factory':'43 Factory Da Nang','Làng cà phê Trung Nguyên':'Trung Nguyen Coffee Village','Tam Coc Garden':'Tam Coc Garden Ninh Binh','The Myst Dong Khoi':'The Myst Saigon'};
 const cats=read(dir+'/baseline.json'),places=cats.flatMap(d=>d.places.filter(p=>p.venue&&!p.photos.length).map(p=>({...p,dest:d.id})));
 const cities={'ha-noi':'Hanoi','ho-chi-minh':'Saigon','da-nang':'Danang','phu-quoc':'Phu Quoc','hoi-an':'Hoi An','hue':'Hue','nha-trang':'Nha Trang'};
 const jobs=places.toSorted((a,b)=>(a.venue.kind==='lodging'?0:1)-(b.venue.kind==='lodging'?0:1)).filter(p=>!data[p.id]&&(!isAlias||aliases[p.name]));let count=0;
 for(const p of jobs.slice(0,Number(process.argv[3]||150))){
  const name=(isAlias?aliases[p.name]:null)||p.name.replace(/ ·.*$| \(.*\)$/g,'').replace(/\s*[-–]\s*(?:MGallery|Handwritten|Managed by).*$/i,'').replace(/\s*\b(?:Resort and Spa|Resort & Spa|Collection|Vietnam)\s*$/i,''),query=name;
  try{
   await new Promise(r=>setTimeout(r,1800));const url='https://www.flickr.com/search/?'+new URLSearchParams({text:query,license:'4,5,9,10'}),response=await fetch(url,{headers:{'User-Agent':'WanderPhotoReview/1.2 (licensed business-photo curation)'},signal:AbortSignal.timeout(20000)});
   if([403,429].includes(response.status)){console.log('Flickr unavailable/rate limited: stopping.');break;}if(!response.ok)throw new Error('HTTP '+response.status);
   const html=await response.text(),sourceFile=cache+'/'+p.id+'.html';fs.writeFileSync(sourceFile,html);
   const candidates=[];
   for(const ph of objects(html)){
    if(![4,5,9,10].includes(ph.license))continue;
    const sizes=Object.values(ph.sizes?.data||{}).map(v=>v.data).filter(s=>s&&Math.min(s.width,s.height)>=350&&Math.max(s.width,s.height)>=640).sort((a,b)=>Math.abs(Math.max(a.width,a.height)-1200)-Math.abs(Math.max(b.width,b.height)-1200));
    const size=sizes[0];if(!size)continue;const sourceUrl='https://www.flickr.com/photos/'+ph.ownerNsid+'/'+ph.id;
    const tokens=norm(name).split(' ').filter(t=>t.length>2&&!/^(hotel|resort|restaurant|collection|the|and|spa|saigon|hanoi|danang|vietnam)$/.test(t));
    const text=norm(ph.title+' '+(ph.description||'')+' '+JSON.stringify(ph.tags||''));
    candidates.push({id:hash(sourceUrl).slice(0,18),provider:'flickr-public-search',title:ph.title,description:plain(ph.description||''),url:(size.url||size.displayUrl).replace(/^\/\//,'https://'),originalUrl:(size.url||size.displayUrl).replace(/^\/\//,'https://'),sourceUrl,author:ph.realname||ph.username,license:ph.license===4?'CC BY 2.0':ph.license===5?'CC BY-SA 2.0':ph.license===9?'CC0':'Public domain',licenseCode:ph.license,width:size.width,height:size.height,geo:ph.geo||null,latitude:ph.latitude,longitude:ph.longitude,matchedTokens:tokens.filter(t=>text.includes(t)),identityTokens:tokens,checkedAt:'2026-11-07',status:'PENDING_REVIEW',sourceFile});
   }
   data[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,flickr:{query,url,status:response.status,checkedAt:new Date().toISOString()},candidates:candidates.slice(0,16)};
  }catch(e){data[p.id]={id:p.id,name:p.name,dest:p.dest,error:e.message,candidates:[]};}
  save(file,data);count++;if(count%15===0)console.log(JSON.stringify({checked:count,venuesWithCandidates:Object.values(data).filter(p=>p.candidates.length).length}));
 }
 console.log(JSON.stringify({checked:Object.keys(data).length,venuesWithCandidates:Object.values(data).filter(p=>p.candidates.length).length}));
}
