import fs from 'node:fs';
import crypto from 'node:crypto';
const dir='docs/research/photo-fill-20261107';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const plain=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const norm=s=>plain(s).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const hash=s=>crypto.createHash('sha256').update(s).digest('hex'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const previous=read(dir+'/commons-wave2.json');
const catalogs=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).map(f=>read('backend/src/main/resources/catalog/'+f));
const aliases={'Hotel de la Coupole Sapa - MGallery Collection':'Hotel de la Coupole','Hôtel des Arts Saigon - MGallery Collection':'Hotel des Arts Saigon','La Veranda Resort Phu Quoc - MGallery Collection':'La Veranda',"Hotel de l'Opera Hanoi - MGallery Collection":"Hotel de l'Opera Hanoi",'JW Marriott Phu Quoc Emerald Bay Resort & Spa':'JW Marriott Phu Quoc','Premier Village Phu Quoc Resort - Managed by Accor':'Premier Village Phu Quoc','Legacy Yen Tu Resort & Retreat - MGallery Collection':'Legacy Yen Tu'};
const title=p=>aliases[p.name]||p.name.replace(/ ·.*$| \(.*\)$/g,'').replace(/\s*[-–]\s*(?:MGallery|Handwritten|Managed by).*$/i,'').replace(/\s*\b(?:Resort and Spa|Resort & Spa|Collection|Vietnam)\s*$/i,'');
const file=dir+'/commons-batches.json',result=fs.existsSync(file)?read(file):{},batchesFile=dir+'/commons-batch-queries.json',batches=fs.existsSync(batchesFile)?read(batchesFile):{};
const all=catalogs.flatMap(d=>d.places.filter(p=>p.venue&&!p.photos.length&&!previous[p.id]?.commons).map(p=>({...p,dest:d.id,query:title(p)}))).toSorted((a,b)=>(a.venue.kind==='lodging'?0:1)-(b.venue.kind==='lodging'?0:1));
for(let start=0;start<all.length;start+=6){
 const group=all.slice(start,start+6),key=hash('literal-phrases-no-group|'+group.map(p=>p.id).join('|')).slice(0,16);if(batches[key]?.status===200)continue;
 const query=group.map(p=>'"'+p.query.replaceAll('"','')+'"').join(' OR ')+' filetype:bitmap';
 await sleep(5000);
 try{
  const response=await fetch('https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',generator:'search',gsrsearch:query,gsrnamespace:'6',gsrlimit:'50',prop:'imageinfo',iiprop:'url|size|extmetadata',iiurlwidth:'1280',iiextmetadatafilter:'LicenseShortName|Artist|ImageDescription|DateTimeOriginal'}),{headers:{'User-Agent':'WanderPhotoReview/1.2 (cached grouped named-photo lookup)'},signal:AbortSignal.timeout(30000)});
  if(response.status===429){save(dir+'/commons-batch-rate-limit.json',{at:new Date().toISOString(),retryAfter:response.headers.get('retry-after')});console.log('Commons rate limit: stopping with saved batches.');break;}if(!response.ok)throw new Error('HTTP '+response.status);
  const body=await response.json();if(body.error)throw new Error(body.error.code);
  fs.mkdirSync(dir+'/commons-responses',{recursive:true});save(dir+'/commons-responses/'+key+'.json',body);
  for(const p of group){
   const tokens=norm(p.query).split(' ').filter(t=>t.length>2&&!/^(hotel|resort|restaurant|collection|the|and|spa|saigon|hanoi|danang|vietnam)$/.test(t)),candidates=[];
   for(const item of body.query?.pages||[]){const ph=item.imageinfo?.[0];if(!ph)continue;const license=plain(ph.extmetadata?.LicenseShortName?.value);if(!/^(CC BY(?:-SA)? [\d.]+(?: de)?|CC0|Public domain)$/.test(license)||Math.min(ph.width,ph.height)<350||Math.max(ph.width,ph.height)<640||!ph.url.match(/\.jpe?g$/i)||/\b(?:menu|bill|logo|receipt|flyer|brochure|poster|map of)\b/i.test(item.title))continue;
    const description=plain(ph.extmetadata?.ImageDescription?.value),text=norm(item.title+' '+description),matched=tokens.filter(t=>text.includes(t));if(!tokens.length||matched.length<Math.min(2,tokens.length)||matched.length/tokens.length<0.6)continue;
    candidates.push({id:hash(ph.descriptionurl).slice(0,18),provider:'commons-batch',title:item.title,description,url:ph.thumburl||ph.url,originalUrl:ph.url,sourceUrl:ph.descriptionurl,author:plain(ph.extmetadata?.Artist?.value),license,width:ph.width,height:ph.height,takenAt:plain(ph.extmetadata?.DateTimeOriginal?.value),matchedTokens:matched,identityTokens:tokens,checkedAt:'2026-11-07',status:'PENDING_REVIEW'});
   }
   result[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,commons:{query,status:200,checkedAt:new Date().toISOString()},candidates};
  }
  batches[key]={status:200,query,records:group.map(p=>p.id),checkedAt:new Date().toISOString()};save(file,result);save(batchesFile,batches);console.log(JSON.stringify({groups:Object.keys(batches).length,venues:Object.keys(result).length,venuesWithCandidates:Object.values(result).filter(p=>p.candidates.length).length}));
 }catch(e){batches[key]={query,error:e.message};save(batchesFile,batches);console.log(e.message);}
}
