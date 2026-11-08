import fs from 'node:fs';
import crypto from 'node:crypto';
import {objects} from './research-flickr-venues-20261107.mjs';
const dir='docs/research/photo-multisource-20261107',cache='.logs/photo-multisource-20261107';
for(const p of[dir,cache,cache+'/sources'])fs.mkdirSync(p,{recursive:true});
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const cats=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));if(!fs.existsSync(dir+'/baseline.json'))save(dir+'/baseline.json',cats);
const places=cats.flatMap(d=>d.places.filter(p=>p.venue&&!p.photos.length).map(p=>({...p,dest:d.id})));
const city={'ha-noi':'Hanoi','ho-chi-minh':'Saigon','da-nang':'Da Nang','da-lat':'Dalat','ha-long':'Halong','hue':'Hue','hoi-an':'Hoi An','nha-trang':'Nha Trang','phu-quoc':'Phu Quoc','phong-nha':'Phong Nha','sa-pa':'Sapa','quy-nhon':'Quy Nhon','cao-bang':'Cao Bang','vinh-hy':'Vinh Hy','can-tho':'Can Tho','ninh-binh':'Ninh Binh','ta-xua':'Ta Xua','phu-yen':'Phu Yen'};
const short=p=>norm(p.name.split(' · ')[0].replace(/\s*\(.*\)/,'').replace(/\s*[-–]\s*(MGallery|Managed by|Handwritten).*$/i,''));
const aliases={
 'venue-da-lat-la-viet':'La Viet Coffee Dalat','venue-da-nang-43-factory':'43 Factory Da Nang','rs-ha-noi-hotel-de-l-opera-hanoi-m-874677e0':'Hotel de l Opera Hanoi','rs-hue-azerai-la-residence-hue-6765d6fa':'La Residence Hue',
 'rs-da-nang-mercure-danang-french-vi-ae25ff8f':'Mercure Bana Hills','rs-ha-long-legacy-yen-tu-resort-ret-3f834823':'Legacy Yen Tu','rs-quy-nhon-seagull-hotel-b7e7336d':'Seagull Quy Nhon',
};
const command=process.argv[2],limit=Number(process.argv[3]||400);
if(['flickr-variants','openverse-variants','flickr-phrases','openverse-phrases','flickr-preview'].includes(command)){
 const isFlickr=command.startsWith('flickr'),preview=command==='flickr-preview',phrases=command.endsWith('phrases')||preview;
 const file=dir+'/'+command+'.json',state=fs.existsSync(file)?read(file):{};let done=0;
 const preferred=/phong-nha|mango-bay|banyan-tree|angsana-lang|tam-coc-garden|zannier|cuc-gach|banh-xeo-46a|bun-cha-dac|pho-10|com-tam-ba|white-rose|madam-khanh|the-deck|la-residence|hanoi-la-gare|la-viet/;
 const jobs=places.filter(p=>!state[p.id]&&(!preview||!p.name.includes(' · '))).toSorted((a,b)=>preview?(Number(preferred.test(b.id))-Number(preferred.test(a.id))||Number(b.venue.kind==='lodging')-Number(a.venue.kind==='lodging')):Number(a.venue.kind==='lodging')-Number(b.venue.kind==='lodging'));
 for(const p of jobs.slice(0,limit)){
  const base=short(p),named=aliases[p.id]||base,phraseAliases={
   'rs-ha-long-novotel-ha-long-bay-adb78c96':'"Novotel" "Halong"',
   'rs-ha-noi-pho-10-ly-quoc-su-hoan-k-43152054':'"Pho 10" "Hanoi"',
   'rs-ha-noi-hotel-de-l-opera-hanoi-m-874677e0':'"Opera" "Hanoi" "Hotel"',
   'venue-da-lat-la-viet':'"La Viet" "Dalat"',
  };
  const query=phrases?(phraseAliases[p.id]||'"'+named+'"'+(named.split(' ').length<3?' "'+(city[p.dest]||'Vietnam')+'"':'')):named+(base.includes(norm(city[p.dest]||''))?'':' '+(city[p.dest]||'Vietnam'));
  try{
   await sleep(isFlickr?1800:1900);
   const url=isFlickr?'https://www.flickr.com/search/?'+new URLSearchParams({text:query,license:preview?'1,2':'4,5,9,10'}):'https://api.openverse.org/v1/images/?'+new URLSearchParams({q:query,page_size:'12',license_type:'commercial'});
   const res=await fetch(url,{headers:{'User-Agent':'WanderPhotoCuration/2.0 (cached named venue search)'},signal:AbortSignal.timeout(25000)});
   if([403,429].includes(res.status)){console.log(command+' paused HTTP '+res.status);save(dir+'/'+command+'-limit.json',{at:new Date().toISOString(),retryAfter:res.headers.get('retry-after')});break;}
   if(!res.ok)throw new Error('HTTP '+res.status);const raw=await res.text();fs.writeFileSync(cache+'/sources/'+command+'-'+p.id+(isFlickr?'.html':'.json'),raw);
   const candidates=[];
   for(const ph of isFlickr?objects(raw):JSON.parse(raw).results||[]){
    let sourceUrl,author,license,url,width,height,description;
    if(isFlickr){
     if(!(preview?[1,2]:[4,5,9,10]).includes(ph.license))continue;
     const sizes=Object.values(ph.sizes?.data||{}).map(v=>v.data).filter(s=>s&&Math.min(s.width,s.height)>=350&&Math.max(s.width,s.height)>=640).sort((a,b)=>Math.abs(Math.max(a.width,a.height)-1200)-Math.abs(Math.max(b.width,b.height)-1200));if(!sizes.length)continue;
     const size=sizes[0];sourceUrl='https://www.flickr.com/photos/'+ph.ownerNsid+'/'+ph.id;author=ph.realname||ph.username;license=({1:'CC BY-NC-SA 2.0',2:'CC BY-NC 2.0',3:'CC BY-NC-ND 2.0',4:'CC BY 2.0',5:'CC BY-SA 2.0',9:'CC0',10:'Public domain'})[ph.license];url=(size.url||size.displayUrl).replace(/^\/\//,'https://');width=size.width;height=size.height;description=plain(ph.description||'');
    }else{
     license=ph.license==='pdm'?'Public domain':ph.license==='cc0'?'CC0':'CC '+ph.license.toUpperCase()+' '+ph.license_version;if(!/^(CC BY(?:-SA)? [\d.]+|CC0|Public domain)$/.test(license))continue;
     sourceUrl=ph.foreign_landing_url;author=ph.creator;url=ph.url;width=ph.width;height=ph.height;description=ph.title;if(Math.min(width||0,height||0)<350)continue;
    }
    const tokens=base.split(' ').filter(t=>t.length>2&&!/^(hotel|resort|restaurant|collection|the|and|spa|saigon|hanoi|danang|vietnam|cafe|coffee)$/.test(t)),text=norm(ph.title+' '+description);
    candidates.push({id:hash(sourceUrl).slice(0,18),provider:command,title:ph.title,description,url,originalUrl:url,sourceUrl,author,license,width,height,matchedTokens:tokens.filter(t=>text.includes(t)),identityTokens:tokens,status:'PENDING_REVIEW',...(preview?{usageScope:'LOCAL_NONCOMMERCIAL_PREVIEW_ONLY',preserveWholeImage:ph.license===3}:{}),checkedAt:'2026-11-07'});
   }
   state[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,query,url,candidates:candidates.slice(0,12)};
  }catch(e){state[p.id]={id:p.id,name:p.name,dest:p.dest,query,error:e.message,candidates:[]};}
  save(file,state);done++;if(done%20===0)console.log(JSON.stringify({provider:command,checked:done,venuesWithCandidates:Object.values(state).filter(p=>p.candidates.length).length}));
 }
 console.log(JSON.stringify({provider:command,checked:Object.keys(state).length,venuesWithCandidates:Object.values(state).filter(p=>p.candidates.length).length}));
}
if(command==='commons-geo'){
 const file=dir+'/commons-geo.json',state=fs.existsSync(file)?read(file):{};let count=0;
 for(const p of places.filter(p=>p.venue.kind==='lodging'&&!state[p.id]).slice(0,limit)){
  await sleep(4000);try{
   const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'geosearch',ggscoord:p.lat+'|'+p.lon,ggsradius:'180',ggsnamespace:'6',ggslimit:'20',prop:'imageinfo',iiprop:'url|size|extmetadata'});
   const res=await fetch(url,{headers:{'User-Agent':'WanderPhotoCuration/2.0 (nearby candidates, never automatic assignment)'},signal:AbortSignal.timeout(22000)});if(res.status===429){save(dir+'/commons-geo-limit.json',{at:new Date().toISOString(),retryAfter:res.headers.get('retry-after')});console.log('Commons geosearch paused HTTP 429');break;}if(!res.ok)throw new Error('HTTP '+res.status);
   const body=await res.json();save(cache+'/sources/geo-'+p.id+'.json',body);const candidates=[];
   for(const page of body.query?.pages||[]){const info=page.imageinfo?.[0];if(!info)continue;const license=plain(info.extmetadata?.LicenseShortName?.value);if(!/^(CC BY(?:-SA)? [\d.]+|CC0|Public domain)$/.test(license)||!/\.jpe?g(?:\?|$)/i.test(info.url)||Math.min(info.width,info.height)<350)continue;const sourceUrl=info.descriptionurl;candidates.push({id:hash(sourceUrl).slice(0,18),provider:'commons-geo',title:page.title,description:plain(info.extmetadata.ImageDescription?.value),url:info.url,originalUrl:info.url,sourceUrl,author:plain(info.extmetadata.Artist?.value),license,width:info.width,height:info.height,status:'PENDING_GEOGRAPHIC_AND_VISUAL_REVIEW',checkedAt:'2026-11-07'});}
   state[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,lat:p.lat,lon:p.lon,candidates};
  }catch(e){state[p.id]={id:p.id,name:p.name,error:e.message,candidates:[]};}save(file,state);if(++count%10===0)console.log(JSON.stringify({provider:command,checked:count,withCandidates:Object.values(state).filter(p=>p.candidates.length).length}));
 }
 console.log(JSON.stringify({provider:command,checked:Object.keys(state).length,withCandidates:Object.values(state).filter(p=>p.candidates.length).length}));
}
