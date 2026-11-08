import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const dir='docs/research/photo-fill-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const index=read(dir+'/sheet-index.json'),base=read(dir+'/baseline.json');
const reviewedFile=dir+'/reviewed-selections.json';
if(!fs.existsSync(reviewedFile))save(reviewedFile,read(dir+'/approved.json').map(p=>({id:p.id,placeId:p.placeId,sourceUrl:p.sourceUrl,note:'Đã xem ảnh và duyệt ở lượt đầu.'})));
const downloads=read(dir+'/downloads.json');
const photos=read(reviewedFile).map(selection=>{const p=downloads[selection.id];assert(p,selection.id);assert.equal(p.sourceUrl,selection.sourceUrl);return {...p,placeId:selection.placeId,reviewNote:selection.note,caption:selection.caption||'',imageRole:selection.imageRole||'VENUE'};});
const proofFile=dir+'/primary-license-proof.json';let proof=fs.existsSync(proofFile)?read(proofFile):{};
const wiki=photos.filter(p=>p.sourceUrl.includes('commons.wikimedia.org')&&!proof[p.sourceUrl]);
if(wiki.length){
 const byId=wiki.filter(p=>new URL(p.sourceUrl).searchParams.has('curid')),byName=wiki.filter(p=>!byId.includes(p));
 for(const items of [byId,byName])if(items.length){
  const ids=items===byId,params={action:'query',format:'json',formatversion:'2',prop:'imageinfo',iiprop:'url|extmetadata'};
  params[ids?'pageids':'titles']=items.map(p=>ids?new URL(p.sourceUrl).searchParams.get('curid'):decodeURIComponent(new URL(p.sourceUrl).pathname.split('/wiki/')[1])).join('|');
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams(params),{headers:{'User-Agent':'WanderPhotoReview/1.2 (primary-license check for selected photos)'},signal:AbortSignal.timeout(22000)});assert(response.ok,'License proof HTTP '+response.status);const body=await response.json();
  for(const p of items){const page=body.query?.pages.find(x=>ids?String(x.pageid)===new URL(p.sourceUrl).searchParams.get('curid'):decodeURIComponent(new URL(p.sourceUrl).pathname.split('/wiki/')[1]).replaceAll('_',' ')===x.title);assert(page?.imageinfo?.[0],p.title);proof[p.sourceUrl]={checkedAt:new Date().toISOString(),sourceUrl:p.sourceUrl,page};}
  save(proofFile,proof);
 }
}
for(const p of photos.filter(p=>p.sourceUrl.includes('flickr.com')&&!proof[p.sourceUrl])){
 const r=await fetch(p.sourceUrl,{signal:AbortSignal.timeout(20000)});assert(r.ok);const html=await r.text(),m=html.match(/"license"\s*:\s*"(https:[^"\s]+)"/);assert(m,p.sourceUrl);proof[p.sourceUrl]={checkedAt:new Date().toISOString(),sourceUrl:p.sourceUrl,licenseUrl:m[1],pageSha256:hash(html),description:html.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1]||''};save(proofFile,proof);
}
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const cats=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(file=>({file,data:read('backend/src/main/resources/catalog/'+file)}));
const approved=[];
for(const p of photos){
 const meta=proof[p.sourceUrl];assert(meta,'Missing proof');
 if(meta.page){const actual=plain(meta.page.imageinfo[0].extmetadata.LicenseShortName.value);assert.equal(actual,p.license,p.title+' license changed');}
 else{const expected=p.license==='CC0'?'https://creativecommons.org/publicdomain/zero/1.0/':p.license==='Public domain'?'https://creativecommons.org/publicdomain/mark/1.0/':'https://creativecommons.org/licenses/'+(p.license.includes('BY-SA')?'by-sa':'by')+'/'+p.license.split(' ').at(-1)+'/';assert.equal(meta.licenseUrl,expected,p.title+' license changed');}
 assert(p.author&&p.localFile);const file='venue-fill-'+p.id+'.jpg',photo={file,author:p.author,license:p.license,sourceUrl:p.sourceUrl,...(p.caption?{caption:p.caption}:{})};assert(!p.caption||p.caption.length<=240);
 const target=cats.flatMap(d=>d.data.places).find(x=>x.id===p.placeId);assert(target,p.placeId);
 const existingPhoto=target.photos.find(x=>x.sourceUrl===photo.sourceUrl);
 if(!existingPhoto&&target.photos.length<8){target.photos.push(photo);}
 else if(existingPhoto?.file===file&&p.caption)existingPhoto.caption=p.caption;
 approved.push({...p,photo,subjectDecision:'VISUALLY_REVIEWED_NAMED_PROPERTY',reviewedAt:'2026-11-07'});
}
// Nếu đã có ảnh đúng outlet, đưa ảnh đó lên đầu và bỏ ảnh khách sạn từng bổ sung trong đợt này.
// Ảnh có trước đợt bổ sung vẫn giữ nguyên thứ tự và nội dung.
for(const placeId of new Set(approved.map(p=>p.placeId))){
 const target=cats.flatMap(d=>d.data.places).find(p=>p.id===placeId),before=base.flatMap(d=>d.places).find(p=>p.id===placeId);
 if(before.photos.length===0)target.photos=target.photos.filter(p=>!p.caption?.startsWith('Ảnh khách sạn'));
}
// Ảnh toàn cảnh khách sạn chỉ dùng làm ngữ cảnh cho nhà hàng được chính operator liệt kê trong cùng khách sạn.
// Chú thích luôn hiển thị trên thẻ và chi tiết; không gán thành ảnh chụp phòng ăn.
const profiles=read('docs/research/completion-20261107/profiles.json').records;
const aliases=new Map(read('docs/research/completion-20261107/apply-audit.json').aliases);
const canonical=r=>r.existingPlaceId||aliases.get(r.id)||r.id;
const allPlaces=new Map(cats.flatMap(d=>d.data.places.map(p=>[p.id,p]))),contexts=[];
for(const r of profiles.filter(r=>r.parentHotel&&r.completion.ready)){
 const child=allPlaces.get(canonical(r));if(!child)continue;
 const existingContext=child.photos.find(p=>p.caption?.startsWith('Ảnh khách sạn'));
 if(child.photos.length&&!existingContext)continue;
 const parentRecord=profiles.find(p=>p.kind==='lodging'&&p.sourceType==='OFFICIAL_OPERATOR'&&p.sourceUrl===r.sourceUrl&&p.name===r.parentHotel);
 const parent=parentRecord&&allPlaces.get(canonical(parentRecord));if(!parent?.photos.length)continue;
 const photo=existingContext||{...parent.photos[0],caption:'Ảnh khách sạn'+(parent.photos[0].caption?' · '+parent.photos[0].caption:'')};assert(photo.caption.length<=240);
 if(!existingContext)child.photos.push(photo);contexts.push({placeId:child.id,parentPlaceId:parent.id,parentHotel:parent.name,operatorSource:r.sourceUrl,imageRole:'PROPERTY_CONTEXT',photo});
}
// Bảo toàn mọi trường thông tin và ảnh cũ; chỉ bổ sung ảnh đã duyệt vào đúng ID.
const extraContextFile='docs/research/photo-multisource-20261107/reviewed-contexts.json';
if(fs.existsSync(extraContextFile))for(const item of read(extraContextFile)){
 const child=allPlaces.get(item.placeId),parent=allPlaces.get(item.parentPlaceId);assert(child&&parent&&item.evidence&&item.operatorSource.startsWith('https://'));
 if(!parent.photos.length)continue;
 const existingContext=child.photos.find(p=>p.caption?.startsWith('Ảnh khách sạn'));
 if(child.photos.length&&!existingContext)continue;
 const photo=existingContext||{...parent.photos[0],caption:'Ảnh khách sạn'+(parent.photos[0].caption?' · '+parent.photos[0].caption:'')};
 if(!existingContext)child.photos.push(photo);
 contexts.push({...item,parentHotel:parent.name,imageRole:'PROPERTY_CONTEXT',photo});
}
for(const {data:d}of cats){const old=base.find(x=>x.id===d.id);assert(old);assert.deepEqual({...d,places:[]},{...old,places:[]});for(const p of d.places){const before=old.places.find(x=>x.id===p.id);assert.deepEqual({...p,photos:[]},{...before,photos:[]});assert.deepEqual(p.photos.slice(0,before.photos.length),before.photos);for(const ph of p.photos)assert(ph.author&&ph.license&&ph.sourceUrl.startsWith('https://'));}}
if(process.argv.includes('--apply')){
 for(const p of approved)fs.copyFileSync(p.localFile,'backend/src/main/resources/catalog/photos/'+p.photo.file);
 for(const {file,data}of cats)save('backend/src/main/resources/catalog/'+file,data);
}
save(dir+'/approved.json',approved);save(dir+'/property-context-photos.json',contexts);const before=base.flatMap(d=>d.places).filter(p=>p.venue),after=cats.flatMap(d=>d.data.places).filter(p=>p.venue);
save(dir+'/apply-audit.json',{checkedAt:new Date().toISOString(),applied:process.argv.includes('--apply'),photos:approved.length,uniqueImages:new Set(approved.map(p=>p.id)).size,venues:new Set(approved.map(p=>p.placeId)).size,propertyContexts:contexts.length,venueCards:after.length,withPhotosBefore:before.filter(p=>p.photos.length).length,withPhotosAfter:after.filter(p=>p.photos.length).length,withoutPhotosAfter:after.filter(p=>!p.photos.length).length,catalogPlaces:cats.reduce((n,d)=>n+d.data.places.length,0),preservedAllOtherFields:true});
console.log(JSON.stringify(read(dir+'/apply-audit.json')));
