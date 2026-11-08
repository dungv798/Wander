import fs from 'node:fs';
import path from 'node:path';
import {out,cache,read,save,norm,plain,digest} from './complete-research-20261107.mjs';
const file=out+'/photo-candidates.json',stage=cache+'/photos';fs.mkdirSync(stage,{recursive:true});
const data=fs.existsSync(file)?read(file):{};
const cities={ 'ha-noi':'Hanoi','ho-chi-minh':'Ho Chi Minh City','da-nang':'Da Nang','hoi-an':'Hoi An','hue':'Hue','da-lat':'Dalat','nha-trang':'Nha Trang','phu-yen':'Phu Yen','quy-nhon':'Quy Nhon','ha-giang':'Ha Giang','cao-bang':'Cao Bang','sa-pa':'Sapa','ta-xua':'Ta Xua','vinh-hy':'Vinh Hy','phong-nha':'Phong Nha','ninh-binh':'Ninh Binh','ha-long':'Ha Long','can-tho':'Can Tho','buon-ma-thuot':'Buon Ma Thuot','phu-quoc':'Phu Quoc'};
const stop=/\b(collection|mgallery|hotel|restaurant|resort|coffee|cafe|saigon|hanoi|danang|hue|street|and|the|beach|managed|accor|leisure|luxury|grand|city|by|hoi|an|vietnam|noi|ho|chi|minh|ha)\b/g;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const records=read(out+'/working.json');
const dishNames={'Bún ốc':'Bún ốc','Bún cá':'Bún cá','Bánh tôm Hồ Tây':'Bánh tôm','Bánh gối':'Bánh gối','Bánh đúc nóng':'Bánh đúc','Chè thập cẩm Hà Nội':'Chè','Bò lá lốt':'Bò lá lốt','Bò kho':'Bò kho','Bánh canh cua':'Bánh canh cua','Ốc Sài Gòn':'Ốc','Bánh xèo miền Nam':'Bánh xèo','Nem lụi Huế':'Nem lụi','Cơm âm phủ':'Cơm âm phủ','Cơm gà Hội An':'Cơm gà Hội An','Bánh xèo Hội An':'Bánh xèo','Mì Quảng Hội An':'Mì Quảng','Bún chả cá Đà Nẵng':'Bún chả cá','Bánh xèo Đà Nẵng':'Bánh xèo','Bánh mì xíu mại Đà Lạt':'Bánh mì xíu mại','Phở bò Đà Lạt':'Phở','Bánh căn Đà Lạt':'Bánh căn','Bún sứa Nha Trang':'Bún sứa','Bánh căn Nha Trang':'Bánh căn','Bánh canh chả cá Nha Trang':'Bánh canh chả cá','Bánh tam giác mạch':'Bánh tam giác mạch','Xôi ngũ sắc Hà Giang':'Xôi ngũ sắc','Bánh cuốn Hà Giang':'Bánh cuốn','Phở chua Cao Bằng':'Phở chua','Lẩu cá hồi Sa Pa':'Lẩu cá hồi','Cơm lam Tà Xùa':'Cơm lam','Xôi ngũ sắc Tà Xùa':'Xôi ngũ sắc','Bánh căn Vĩnh Hy':'Bánh căn','Bánh canh chả cá Vĩnh Hy':'Bánh canh chả cá','Bún mọc Kim Sơn':'Bún mọc','Bánh xèo miền Tây':'Bánh xèo','Bánh cống Cần Thơ':'Bánh cống','Bún đỏ Buôn Ma Thuột':'Bún đỏ','Gỏi cá trích Phú Quốc':'Gỏi cá trích'};
const jobs=records.filter(r=>!data[r.id]).sort((a,b)=>(a.kind==='dish'?0:a.kind==='lodging'?1:2)-(b.kind==='dish'?0:b.kind==='lodging'?1:2));
if(['review-snapshot','review-flickr-snapshot'].includes(process.argv[2])){
 const downloads=fs.existsSync(out+'/photo-downloads.json')?read(out+'/photo-downloads.json'):{};let n=0;
 for(const e of Object.values(data))for(const p of e.candidates.slice(0,2)){
  if(process.argv[2]==='review-flickr-snapshot'&&!p.sourceUrl?.includes('flickr.com/'))continue;
  if(e.kind!=='dish'&&p.identityMatches.length<Math.min(2,p.identityTokens.length))continue;
  const key=digest(p.sourceUrl).slice(0,16),file=stage+'/'+key+'.jpg';
  if(!fs.existsSync(file))try{await sleep(800);const response=await fetch(p.url,{headers:{'User-Agent':'WanderResearch/1.1 (licensed photo review)'},signal:AbortSignal.timeout(22000)});if(response.status===429){save(out+'/photo-downloads.json',downloads);console.log('Photo server rate limit; stopping.');process.exit(0);}if(!response.ok)throw new Error('HTTP '+response.status);const b=Buffer.from(await response.arrayBuffer());if(b[0]!==255||b[1]!==216)throw new Error('not JPEG');fs.writeFileSync(file,b);}catch(error){downloads[key]={...p,error:error.message,recordId:e.id,recordName:e.name};continue;}
  downloads[key]={...p,localFile:file,recordId:e.id,recordName:e.name,kind:e.kind};n++;if(n%20===0){save(out+'/photo-downloads.json',downloads);console.log(JSON.stringify({images:n}));}
 }save(out+'/photo-downloads.json',downloads);console.log(JSON.stringify({images:n,unique:Object.keys(downloads).length}));
}
if(['openverse','flickr','hotel-flickr'].includes(process.argv[2])){
 const hotel=process.argv[2]==='hotel-flickr',flickr=process.argv[2]!=='openverse';
 const ready=new Set(read(out+'/profiles.json').records.filter(r=>r.completion.ready).map(r=>r.id));
 const openverseJobs=hotel?records.filter(r=>r.kind==='lodging'&&ready.has(r.id)&&!data[r.id]?.hotelQuery).slice(0,Number(process.argv[3]||80)):flickr?records.filter(r=>r.kind!=='dish'&&(!data[r.id]?.candidates.length||!data[r.id]?.provider)).slice(0,Number(process.argv[3]||150)):jobs.slice(0,Number(process.argv[3]||620));
 let n=0;
 for(const r of openverseJobs){
  const base=r.kind==='dish'?(dishNames[r.name]||r.name):(r.venueName||r.name).replace(/ ·.*$| \(.*\)$/g,'');
  try{await sleep(1500);const response=await fetch('https://api.openverse.org/v1/images/?'+new URLSearchParams({q:hotel?'"'+base+'" Vietnam':base,page_size:'10',license_type:'commercial',source:flickr?'flickr':'wikimedia'}),{headers:{'User-Agent':'WanderResearch/1.1 (licensed subject review)'},signal:AbortSignal.timeout(22000)});if(response.status===429){console.log('Openverse rate limit; stopping.');break;}if(!response.ok)throw new Error('Openverse HTTP '+response.status);const body=await response.json();
   const candidates=[];for(const ph of body.results||[]){if(!['by','by-sa','cc0','pdm'].includes(ph.license)||Math.min(ph.width||0,ph.height||0)<600||!ph.url?.match(/\.jpe?g$/i))continue;const identity=norm(base).replace(stop,' ').split(' ').filter(t=>t.length>2),text=norm(ph.title);candidates.push({title:ph.title,url:ph.url,originalUrl:ph.url,sourceUrl:ph.foreign_landing_url,author:plain(ph.creator).slice(0,100)||'Wikimedia Commons',license:ph.license==='pdm'?'Public domain':ph.license==='cc0'?'CC0':'CC '+ph.license.toUpperCase()+' '+ph.license_version,width:ph.width,height:ph.height,description:ph.title,identityMatches:identity.filter(t=>text.includes(t)),identityTokens:identity,review:'PENDING',licenseEvidence:ph.license_url,openverseId:ph.id});}
   data[r.id]={id:r.id,name:r.name,dest:r.dest,kind:r.kind,query:base,hotelQuery:hotel,provider:flickr?'Openverse/Flickr':'Openverse/Wikimedia',checkedAt:'2026-11-07',candidates};
  }catch(e){data[r.id]={id:r.id,name:r.name,dest:r.dest,kind:r.kind,error:e.message,candidates:[]};}n++;save(file,data);if(n%20===0)console.log(JSON.stringify({n,withCandidates:Object.values(data).filter(d=>d.candidates.length).length}));
 }console.log(JSON.stringify({total:Object.keys(data).length,withCandidates:Object.values(data).filter(d=>d.candidates.length).length}));
}
if(process.argv[2]==='search'){
 const limit=Number(process.argv[3]||jobs.length);let count=0;
 for(const r of jobs.slice(0,limit)){
  const base=r.kind==='dish'?(dishNames[r.name]||r.name):(r.venueName||r.name).replace(/ ·.*$| \(.*\)$/g,'').replace(/ - (?:MGallery|Handwritten).*$/i,'');
  const terms=r.kind==='dish'?base:r.name.startsWith('rs-')?base:base;
  const query=`"${terms}" ${r.kind==='dish'?'':cities[r.dest]||r.locality||'Vietnam'} filetype:bitmap`;
  try{
   await sleep(1200);
   const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'8',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'900',iiextmetadatafilter:'LicenseShortName|Artist|ImageDescription|Credit'});
   const response=await fetch(url,{headers:{'User-Agent':'WanderResearch/1.1 (image attribution and subject review)'},signal:AbortSignal.timeout(24000)});
   if(response.status===429){console.log('Rate limited: stopping; cached results are retained.');break;}
   if(!response.ok)throw new Error('Commons HTTP '+response.status);const body=await response.json();
   const candidates=[];
   for(const p of body.query?.pages||[]){const ph=p.imageinfo?.[0];if(!ph)continue;const license=plain(ph.extmetadata?.LicenseShortName?.value||'');if(!/^(CC BY(-SA)? \d(\.\d)?(?: de)?|CC0|Public domain)$/.test(license)||Math.min(ph.width,ph.height)<600||!ph.url?.match(/\.jpe?g$/i))continue;
    const identity=norm(base).replace(stop,' ').split(' ').filter(t=>t.length>2);const description=plain(ph.extmetadata?.ImageDescription?.value||'');const text=norm(p.title+' '+description);const hits=identity.filter(t=>text.includes(t));
    candidates.push({title:p.title,url:ph.thumburl||ph.url,originalUrl:ph.url,sourceUrl:ph.descriptionurl,author:plain(ph.extmetadata?.Artist?.value||ph.extmetadata?.Credit?.value).slice(0,100)||'Wikimedia Commons',license,width:ph.width,height:ph.height,description,identityMatches:hits,identityTokens:identity,review:'PENDING'});
   }
   data[r.id]={id:r.id,name:r.name,dest:r.dest,kind:r.kind,query,checkedAt:'2026-11-07',candidates};
  }catch(e){data[r.id]={id:r.id,name:r.name,dest:r.dest,kind:r.kind,query,error:e.message,candidates:[]};}
  count++;save(file,data);if(count%15===0)console.log(JSON.stringify({checked:count,remaining:jobs.length-count,withCandidates:Object.values(data).filter(d=>d.candidates.length).length}));
 }
 console.log(JSON.stringify({checked:Object.keys(data).length,withCandidates:Object.values(data).filter(d=>d.candidates.length).length,photos:Object.values(data).reduce((n,d)=>n+d.candidates.length,0)}));
}
if(process.argv[2]==='download'){
 let n=0;for(const entry of Object.values(data))for(const p of entry.candidates){
  if(entry.kind!=='dish'&&p.identityMatches.length<Math.min(2,p.identityTokens.length))continue;
  const target=stage+'/'+digest(p.sourceUrl).slice(0,16)+'.jpg';
  if(!fs.existsSync(target))try{await sleep(700);const response=await fetch(p.url,{headers:{'User-Agent':'WanderResearch/1.1 (licensed image review)'},signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error('HTTP '+response.status);const b=Buffer.from(await response.arrayBuffer());if(b[0]!==255||b[1]!==216)throw new Error('not JPEG');fs.writeFileSync(target,b);}catch(e){p.downloadError=e.message;continue;}
  p.localFile=target;n++;
 }save(file,data);console.log(JSON.stringify({downloaded:n}));
}
if(process.argv[2]==='sheets'||process.argv[2]==='snapshot-sheets'){
 const {chromium}=await import('playwright-core');const {pathToFileURL}=await import('node:url');
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const photos=process.argv[2]==='snapshot-sheets'?Object.values(read(out+'/photo-downloads.json')).filter(p=>p.localFile).map(p=>({...p,id:p.recordId,name:p.recordName})):Object.values(data).flatMap(d=>d.candidates.filter(p=>p.localFile).map(p=>({...p,id:d.id,name:d.name})));
 const browser=await chromium.launch({channel:'chrome',headless:true});try{const page=await browser.newPage({viewport:{width:1400,height:1000}});
 for(let i=0;i<photos.length;i+=16){const group=photos.slice(i,i+16),file=stage+'/sheet-'+(i/16+1);fs.writeFileSync(file+'.html','<meta charset=utf-8><style>body{background:#edf2ef;font:11px system-ui}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{background:white;padding:6px;margin:0}img{width:100%;height:185px;object-fit:contain}figcaption{height:70px;overflow:hidden}</style><div class=grid>'+group.map((p,k)=>'<figure><img src="'+pathToFileURL(path.resolve(p.localFile)).href+'"><figcaption><b>'+(i+k+1)+' '+esc(p.name)+'</b><br>'+esc(p.title)+'<br>'+esc(p.license)+'</figcaption></figure>').join('')+'</div>');await page.goto(pathToFileURL(path.resolve(file+'.html')).href);await page.screenshot({path:file+'.png',fullPage:true});}
 }finally{await browser.close();}save(stage+'/sheet-index.json',photos.map((p,i)=>({index:i+1,...p})));console.log(JSON.stringify({photos:photos.length,sheets:Math.ceil(photos.length/16),path:stage}));
}
