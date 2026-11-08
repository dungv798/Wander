// Noncommercial images are isolated from the distributable catalog/resources and only served by a loopback preview.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {objects} from './research-flickr-venues-20261107.mjs';
const dir='docs/research/photo-multisource-20261107',cache='.logs/photo-multisource-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const catalogs=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(file=>({file,data:read('backend/src/main/resources/catalog/'+file)})),all=catalogs.flatMap(d=>d.data.places.map(p=>({...p,dest:d.data.id})));
for(const p of[cache+'/preview-images',cache+'/preview-catalog',cache+'/preview-resources/catalog/photos'])fs.mkdirSync(p,{recursive:true});
const command=process.argv[2];
if(command==='shortlist'){
 const state=read(dir+'/flickr-preview.json'),selected=[];
 if(fs.existsSync(dir+'/core-preview.json'))for(const row of Object.values(read(dir+'/core-preview.json'))){const old=state[row.id];state[row.id]={...old,...row,candidates:[...(old?.candidates||[]),...row.candidates]};}
 for(const row of Object.values(state)){
  const p=all.find(p=>p.id===row.id);if(!p||p.photos.some(ph=>!ph.caption?.startsWith('Ảnh khách sạn')))continue;
  const base=norm(p.name.split(' · ')[0].replace(/\s*\(.*\)/,'').replace(/\s*[-–].*(?:mgallery|handwritten|accor).*$/i,''));
  const tokens=base.split(' ').filter(t=>t.length>2&&!/^(hotel|resort|restaurant|collection|the|and|spa|vietnam|luxury|boutique|bay|island|leisure|beach|managed|living|suites|grand)$/.test(t));
  const matches=row.candidates.filter(c=>/^CC BY-NC(?:-SA)? 2\.0$/.test(c.license)&&tokens.length&&tokens.every(t=>norm(c.title+' '+c.description).includes(t))&&!/meeting|conference|ceremony|award|octoberfest|\bparty\b/i.test(c.title||''));
  const chosen=[...new Map([...matches.slice(0,p.venue.kind==='lodging'?6:4),...row.candidates.filter(c=>c.provider==='flickr-core')].map(c=>[c.id,c])).values()];
  for(const c of chosen)selected.push({...c,placeId:p.id,name:p.name,dest:p.dest,sourceFile:c.sourceFile||cache+'/sources/flickr-preview-'+p.id+'.html'});
 }
 save(dir+'/preview-shortlist.json',selected);console.log(JSON.stringify({shortlistedVenues:new Set(selected.map(p=>p.placeId)).size,images:selected.length}));
}
if(command==='download'){
 const selected=read(dir+'/preview-shortlist.json'),file=dir+'/preview-downloads.json',data=fs.existsSync(file)?read(file):{};let count=0;
 for(const p of selected){if(data[p.id]?.localFile)continue;try{await sleep(1000);const res=await fetch(p.url,{signal:AbortSignal.timeout(22000)});if([403,429].includes(res.status)){save(dir+'/preview-image-limit.json',{at:new Date().toISOString(),status:res.status,retryAfter:res.headers.get('retry-after')});console.log('Preview image downloads paused '+res.status);break;}if(!res.ok)throw Error('HTTP '+res.status);const bytes=Buffer.from(await res.arrayBuffer());assert(bytes[0]===255&&bytes[1]===216,'Only JPEG selected');const localFile=cache+'/preview-images/'+p.id+'.jpg';fs.writeFileSync(localFile,bytes);data[p.id]={...p,localFile,bytes:bytes.length,sha256:hash(bytes)};count++;}catch(e){data[p.id]={...p,error:e.message};}save(file,data);if(count&&count%20===0)console.log(JSON.stringify({downloaded:count}));}
 console.log(JSON.stringify({previewImages:Object.values(data).filter(p=>p.localFile).length}));
}
if(command==='sheets'){
 const downloaded=Object.values(read(dir+'/preview-downloads.json')).filter(p=>p.localFile),exclude=process.argv[3]?new Set(read(process.argv[3]).map(p=>p.id)):new Set(),photos=downloaded.filter(p=>!exclude.has(p.id)),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const {createRequire}=await import('node:module'),{chromium}=createRequire(new URL('../../web/package.json',import.meta.url))('playwright-core'),browser=await chromium.launch({channel:'chrome',headless:true});
 try{const page=await browser.newPage({viewport:{width:1440,height:1100}});for(let i=0;i<photos.length;i+=16){const file=cache+'/preview-sheet-'+(i/16+1),group=photos.slice(i,i+16);fs.writeFileSync(file+'.html','<meta charset=utf-8><style>body{font:11px system-ui;background:#eef1f3}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}figure{background:white;margin:0;padding:7px}img{height:185px;width:100%;object-fit:contain}figcaption{height:92px;overflow:hidden}</style><div class=grid>'+group.map((p,k)=>'<figure><img src="'+pathToFileURL(path.resolve(p.localFile)).href+'"><figcaption><b>'+(i+k+1)+' '+esc(p.name)+'</b><br>'+esc(p.title)+'<br>'+esc(p.description.slice(0,220))+'<br>'+esc(p.license)+'</figcaption></figure>').join('')+'</div>');await page.goto(pathToFileURL(path.resolve(file+'.html')).href);await page.screenshot({path:file+'.png',fullPage:true});}}
 finally{await browser.close();}save(dir+'/preview-sheet-index.json',photos.map((p,i)=>({index:i+1,...p})));console.log(JSON.stringify({photos:photos.length,sheets:Math.ceil(photos.length/16)}));
}
if(command==='apply'){
 const approved=read(dir+'/preview-approved.json'),downloads=read(dir+'/preview-downloads.json'),proof={},placePhotos=new Map();
 for(const s of approved){const p=downloads[s.id];assert(p&&p.localFile&&p.sourceUrl===s.sourceUrl&&s.note);assert(/^CC BY-NC(?:-SA)? 2\.0$/.test(p.license));const raw=fs.readFileSync(p.sourceFile,'utf8'),photoId=new URL(p.sourceUrl).pathname.split('/').filter(Boolean).at(-1),ph=objects(raw).find(ph=>String(ph.id)===photoId);assert(ph&&[1,2].includes(ph.license));assert.equal(p.license,ph.license===1?'CC BY-NC-SA 2.0':'CC BY-NC 2.0');assert(p.sourceUrl.includes('/'+ph.ownerNsid+'/'));
  const file='preview-nc-'+p.id+'.jpg',photo={file,author:p.author,license:p.license,sourceUrl:p.sourceUrl,...(s.caption?{caption:s.caption}:{})};assert(!photo.caption||photo.caption.length<=240);fs.copyFileSync(p.localFile,cache+'/preview-resources/catalog/photos/'+file);const target=s.placeId||p.placeId;placePhotos.set(target,[...(placePhotos.get(target)||[]),photo]);proof[p.id]={sourceUrl:p.sourceUrl,sourceFile:p.sourceFile,sourceSha256:hash(raw),licenseCode:ph.license,license:p.license,licenseUrl:'https://creativecommons.org/licenses/'+(ph.license===1?'by-nc-sa':'by-nc')+'/2.0/',imageSha256:p.sha256,review:s.note};
 }
 for(const {data}of catalogs)for(const p of data.places){const added=placePhotos.get(p.id);if(added){p.photos=[...added,...p.photos.filter(ph=>!ph.caption?.startsWith('Ảnh khách sạn'))];}}
 const profiles=read('docs/research/completion-20261107/profiles.json').records,aliases=new Map(read('docs/research/completion-20261107/apply-audit.json').aliases),canonical=r=>r.existingPlaceId||aliases.get(r.id)||r.id,places=new Map(catalogs.flatMap(d=>d.data.places.map(p=>[p.id,p]))),contexts=[];
 for(const r of profiles.filter(r=>r.parentHotel&&r.completion.ready)){const child=places.get(canonical(r));if(!child||child.photos.length)continue;const pr=profiles.find(p=>p.kind==='lodging'&&p.sourceType==='OFFICIAL_OPERATOR'&&p.sourceUrl===r.sourceUrl&&p.name===r.parentHotel),parent=pr&&places.get(canonical(pr));if(!parent?.photos[0]?.license.includes('-NC'))continue;child.photos.push({...parent.photos[0],caption:'Ảnh khách sạn'+(parent.photos[0].caption?' · '+parent.photos[0].caption:'')});contexts.push({placeId:child.id,parentPlaceId:parent.id,operatorSource:r.sourceUrl});}
 for(const {file,data}of catalogs){const publicData=read('backend/src/main/resources/catalog/'+file);assert.deepEqual({...data,places:[]},{...publicData,places:[]});for(const p of data.places){const original=publicData.places.find(x=>x.id===p.id);assert.deepEqual({...p,photos:[]},{...original,photos:[]});for(const photo of p.photos)if(photo.file)assert(fs.existsSync(cache+'/preview-resources/catalog/photos/'+photo.file)||fs.existsSync('backend/src/main/resources/catalog/photos/'+photo.file));}save(cache+'/preview-catalog/'+file,data);}
 const venuePlaces=catalogs.flatMap(d=>d.data.places.filter(p=>p.venue)),publicVenues=all.filter(p=>p.venue);const summary={checkedAt:new Date().toISOString(),usageScope:'LOCAL_NONCOMMERCIAL_PREVIEW_ONLY',requiredBindAddress:'127.0.0.1',catalogPlaces:all.length,venues:venuePlaces.length,publicCatalogWithPhotos:publicVenues.filter(p=>p.photos.length).length,previewWithPhotos:venuePlaces.filter(p=>p.photos.length).length,previewWithoutPhotos:venuePlaces.filter(p=>!p.photos.length).length,approvedNoncommercialImages:approved.length,venuesWithOwnNoncommercialPhotos:placePhotos.size,additionalHotelContexts:contexts.length,allNonPhotoFieldsPreserved:true,privateAssetsOutsidePublishedResources:true};save(dir+'/preview-license-proof.json',proof);save(dir+'/preview-contexts.json',contexts);save(dir+'/preview-coverage.json',summary);console.log(JSON.stringify(summary));
}
