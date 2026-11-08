import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/research/photo-fill-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const pages=[...new Map(fs.readdirSync(dir+'/category-responses').flatMap(f=>read(dir+'/category-responses/'+f).query?.pages||[]).filter(p=>p.imageinfo).map(p=>[p.pageid,p])).values()];
const venues=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).flatMap(f=>{const d=read('backend/src/main/resources/catalog/'+f);return d.places.map(p=>({...p,dest:d.id}));});
const picks=[['venue-nha-trang-havana',[98815159]],['rs-ho-chi-minh-new-world-saigon-hotel-ce319bda',[56334151,56335089]]];
const out=read(dir+'/commons-selected-titles.json'),plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const [id,ids]of picks){const p=venues.find(p=>p.id===id);if(!p)throw new Error(id);out[id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,candidates:ids.map(pageId=>{const page=pages.find(p=>p.pageid===pageId);if(!page)throw new Error('Missing cache '+pageId);const info=page.imageinfo[0],sourceUrl=info.descriptionurl;return {id:crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0,18),provider:'commons-explicit-title',title:page.title,description:plain(info.extmetadata.ImageDescription?.value),url:info.url,originalUrl:info.url,sourceUrl,author:plain(info.extmetadata.Artist?.value),license:plain(info.extmetadata.LicenseShortName?.value),width:info.width,height:info.height,identityTokens:['explicit-title'],matchedTokens:['explicit-title'],checkedAt:'2026-11-07',status:'PENDING_REVIEW'};})};}
const categoryMatches=read(dir+'/commons-categories.json'),anan=categoryMatches['rs-ho-chi-minh-anan-saigon-cce45aff'];
if(anan)out[anan.id]={...anan,candidates:anan.candidates.filter(c=>!c.title.includes('(cropped)')).map(c=>({...c,provider:'commons-explicit-title'}))};
save(dir+'/commons-selected-titles.json',out);console.log(JSON.stringify({priorityVenues:Object.keys(out).length}));
