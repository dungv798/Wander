// Explicit file titles found on primary Commons pages; candidate status still requires visual review.
import fs from 'node:fs';
import crypto from 'node:crypto';
const root='docs/research/photo-fill-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const places=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).flatMap(f=>{const d=read('backend/src/main/resources/catalog/'+f);return d.places.map(p=>({...p,dest:d.id}));});
const titles=[
 ['rs-sa-pa-hotel-de-la-coupole-sapa-f25e058c','File:Hotel de la Coupole architecture Sa Pa Viet Nam.jpg'],
 ['rs-ha-noi-movenpick-hotel-hanoi-ce-9279c58b','File:Khách sạn Movenpick, Hà Nội 001.JPG'],
];
const response=await fetch('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'1280',titles:titles.map(x=>x[1]).join('|')}),{headers:{'User-Agent':'WanderPhotoReview/1.2 (explicit named file metadata)'},signal:AbortSignal.timeout(25000)});
if(!response.ok)throw new Error('Commons metadata HTTP '+response.status);
const body=await response.json();fs.writeFileSync(root+'/selected-titles-response.json',JSON.stringify(body,null,2)+'\n');
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(+v)).replace(/\s+/g,' ').trim(),out={};
for(const [id,title]of titles){const p=places.find(p=>p.id===id);if(!p)throw new Error('Unknown venue '+id);const page=body.query.pages.find(p=>p.title===title),info=page?.imageinfo?.[0];if(!info)throw new Error('Missing file '+title);
 const sourceUrl=info.descriptionurl,c={id:crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0,18),provider:'commons-explicit-title',title,description:plain(info.extmetadata.ImageDescription?.value),url:info.thumburl||info.url,originalUrl:info.url,sourceUrl,author:plain(info.extmetadata.Artist?.value),license:plain(info.extmetadata.LicenseShortName?.value),width:info.width,height:info.height,identityTokens:['explicit-file'],matchedTokens:['explicit-file'],checkedAt:'2026-11-07',status:'PENDING_REVIEW'};
 out[id]={id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,candidates:[c]};}
fs.writeFileSync(root+'/commons-selected-titles.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({venues:Object.keys(out).length}));
