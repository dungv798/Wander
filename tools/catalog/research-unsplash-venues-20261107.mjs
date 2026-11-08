// Khóa API chỉ dùng trong header; ảnh được hotlink theo hướng dẫn Unsplash.
import fs from 'node:fs';
const folder='docs/research/photo-fill-20261107',file=folder+'/unsplash-venues.json';
const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
const line=fs.readFileSync('.env.local','utf8').split(/\r?\n/).find(l=>l.startsWith('UNSPLASH_ACCESS_KEY='));
const key=process.env.UNSPLASH_ACCESS_KEY||line?.slice('UNSPLASH_ACCESS_KEY='.length).trim();if(!key)throw new Error('Unsplash key missing');
const queries=['Capella Hanoi','Hotel de la Coupole Sapa','JW Marriott Phu Quoc','Six Senses Ninh Van Bay','Mia Resort Nha Trang','An Lam Ninh Van Bay','Namia River Retreat','Zannier Bai San Ho','New World Phu Quoc','Intercontinental Hanoi Westlake','Banyan Tree Lang Co','Salinda Phu Quoc','JW Marriott Hanoi','The Reverie Saigon','Mai House Saigon','Novotel Nha Trang','Pan Pacific Hanoi','Caravelle Saigon','New World Saigon','Phong Nha Farmstay','Mango Bay Phu Quoc','Victoria Hoi An'];
let remaining=50;
for(const query of queries.filter(q=>!data[q])){
 if(remaining<=8)break;
 await new Promise(r=>setTimeout(r,1300));
 try{const response=await fetch('https://api.unsplash.com/search/photos?'+new URLSearchParams({query,per_page:'20',content_filter:'high'}),{headers:{Authorization:'Client-ID '+key,'Accept-Version':'v1'},signal:AbortSignal.timeout(20000)});remaining=Number(response.headers.get('x-ratelimit-remaining')??remaining);if([403,429].includes(response.status)){console.log('Unsplash quota reached; stopping.');break;}if(!response.ok)throw new Error('HTTP '+response.status);const body=await response.json();
  data[query]={query,checkedAt:new Date().toISOString(),total:body.total,photos:body.results.map(p=>({id:p.id,description:p.description,alt:p.alt_description,width:p.width,height:p.height,createdAt:p.created_at,author:p.user.name,authorUrl:p.user.links.html,sourceUrl:p.links.html,url:p.urls.regular,raw:p.urls.raw,downloadLocation:p.links.download_location,location:p.location,tags:p.tags?.map(t=>t.title)}))};
 }catch(e){data[query]={query,error:e.message};}
 fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({query,total:data[query].total,remaining}));
}
