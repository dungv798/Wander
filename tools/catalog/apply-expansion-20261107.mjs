/** Chỉ thêm sau khi đã xem contact sheets; bảo toàn mọi bản ghi và ảnh cũ. */
import fs from 'node:fs';
import path from 'node:path';
import { expansionCopy } from './expansion-copy-20261107.mjs';
const root=path.resolve(import.meta.dirname,'../..'),dir=path.join(root,'backend/src/main/resources/catalog');
const candidatesFile=path.join(root,'docs/research/expansion-candidates-20261107.json'),candidates=JSON.parse(fs.readFileSync(candidatesFile,'utf8'));
const approved={
 'ha-noi-bao-tang-dan-toc':[1],'ha-noi-bao-tang-my-thuat':[2,1],'ha-noi-duong-lam':[1,2],'ha-noi-ba-vi':[2,1],
 'ho-chi-minh-ben-nha-rong':[1],'ho-chi-minh-bao-tang-my-thuat':[2,1],'ho-chi-minh-chua-vinh-nghiem':[1],
 'hue-lang-gia-long':[1,2],'hue-chua-tu-hieu':[2,1],'hue-pha-tam-giang':[1],'hue-dien-hon-chen':[1],
 'da-nang-bao-tang-cham':[1],'ha-long-yen-tu':[1],'sa-pa-hoang-lien':[1,2],'hoi-an-bao-tang-hoi-an':[1],
};
const supplementFile=path.join(root,'docs/research/expansion-supplement-20261107.json');
if(fs.existsSync(supplementFile)){
 Object.assign(candidates,JSON.parse(fs.readFileSync(supplementFile,'utf8')));
 Object.assign(approved,{'nha-trang-thap-ba-ponagar':[2,3],'nha-trang-hon-chong':[3,2],'can-tho-truc-lam-phuong-nam':[1,3],'phu-quoc-suoi-tranh':[2,3]});
}
const result={checkedAt:'2026-11-07',addedPlaces:[],addedMoments:[],addedPhotoRefs:0};
/** Chỉ append; nguồn vị trí và lưu ý thực tế đi cùng thẻ, không bịa giờ/giá/thời lượng. */
function appendPlace(d,c,picks){
 if(d.places.some(p=>p.id===(c.catalogId??c.id)))return;
 const photos=picks.map(n=>c.candidates[n-1]).map(p=>{fs.copyFileSync(path.join(root,'.logs/expansion-20261107',p.file),path.join(dir,'photos',p.file));return{file:p.file,author:p.author,license:p.license,sourceUrl:p.source};});
 d.places.push({id:c.catalogId??c.id,name:c.name,category:c.category,area:d.name,hook:c.hook,summary:c.hook,bestMonths:[],bestLabel:'Xem thời tiết trước chuyến đi',lat:c.lat,lon:c.lon,duration:c.category==='leo'?'Theo tuyến và lịch đoàn':'Chưa có dữ liệu',difficulty:'Chưa xác định',highlights:[],verdict:'worth',verdictReason:'Gợi ý biên tập để bạn cân nhắc theo sở thích.',bestSlots:[],slotReason:'Xác nhận tình trạng tiếp cận và lịch đón khách trước khi đi.',tips:[c.category==='leo'?'Ghim là mốc tham khảo của vùng núi, không phải đầu tuyến. Chốt cung, guide và thời lượng trước khi xếp ngày.':'Tọa độ tham khảo; xác nhận lối vào hoặc điểm hẹn trước chuyến đi.',`Nguồn vị trí: ${c.sourceUrl}`,'Giờ mở cửa, giá và các hoạt động cần được xác nhận với nơi đón khách.'],photos,wikipediaTitle:c.wikipediaTitle});
 result.addedPlaces.push(c.id);result.addedPhotoRefs+=photos.length;
}
for(const [id,picks] of Object.entries(approved)){
 const c=candidates[id];if(!c?.candidates?.length)throw new Error('Missing candidate '+id);
 if(id==='hue-pha-tam-giang')c.catalogId='exp-canh-hue-pha-tam-giang';
 c.approved=picks;c.reviewedAt='2026-11-07';c.status='approved';c.reviewNotes='Viewed full-ratio sheet. Photo depicts named subject; removed duplicate P18/lead, collage and unrelated administrative-area photo. Coordinates are reference points, not trailheads.';
 const file=path.join(dir,c.dest+'.json'),d=JSON.parse(fs.readFileSync(file,'utf8'));appendPlace(d,c,picks);fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
}
candidates['cao-bang-phuc-sen'].reviewNotes='Held: lead image depicts Quảng Uyên settlement rather than a verified blacksmith encounter/Phúc Sen POI.';
fs.writeFileSync(candidatesFile,JSON.stringify(candidates,null,2)+'\n');
const momentFile=path.join(root,'docs/research/moment-candidates-20261107.json'),moments=JSON.parse(fs.readFileSync(momentFile,'utf8'));
for(const p of moments.photos){
 if(p.id===19318292){p.status='rejected';p.reviewNotes='Dark reflected composition; adds little clarity in app cards.';continue;}
 if(!p.width||!p.height)throw new Error('Unreviewed/missing image '+p.id);
 if(p.id===32727685)p.caption='Một góc phơi ngô và nhịp sống Hà Giang';
 if(p.id===25575383)p.caption='Nhìn nhịp sống từ mặt nước Ninh Bình';
 p.status='approved';p.reviewNotes='Viewed full-ratio sheet 07/11; regional activity matches first-party location evidence. Caption adjusted to visible activity; no vendor, opening time, price or live trend claim.';
 const file=path.join(dir,p.dest+'.json'),d=JSON.parse(fs.readFileSync(file,'utf8'));
 if(d.moments.some(m=>m.sourceUrl===p.sourceUrl))continue;
 if(d.moments.length>=24)throw new Error('Moment limit '+p.dest);
 const photo={file:`wave-pexels-${p.id}.jpg`,author:p.author,license:'Giấy phép Pexels',sourceUrl:p.sourceUrl};
 fs.copyFileSync(path.join(root,'.logs/moments-20261107',p.id+'.jpg'),path.join(dir,'photos',photo.file));
 d.moments.push({id:`wave-pexels-${p.id}`,theme:p.theme,caption:p.caption,...photo});result.addedMoments.push(p.id);
 // Only the explicitly identified market entrance is also attached to a precise POI.
 if(p.id===20411011){const market=d.places.find(x=>x.id==='cho-da-lat');if(market&&!market.photos.some(x=>x.sourceUrl===p.sourceUrl)){market.photos.push(photo);result.addedPhotoRefs++;}}
 fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
}
fs.writeFileSync(momentFile,JSON.stringify(moments,null,2)+'\n');
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){
 const file=path.join(dir,name),d=JSON.parse(fs.readFileSync(file,'utf8'));let changed=false;
 for(const place of d.places){const copy=expansionCopy[place.id.replace(/^exp-canh-/,'')];if(!copy)continue;place.summary=copy[0];place.highlights=copy[1];if(!place.tips.includes(copy[2]))place.tips.unshift(copy[2]);changed=true;}
 if(changed)fs.writeFileSync(file,JSON.stringify(d,null,2)+'\n');
}
result.addedPlaces=Object.keys(approved).map(id=>candidates[id].catalogId??id);
result.addedMoments=[];result.addedPhotoRefs=0;
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.json'))){const d=JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));result.addedMoments.push(...d.moments.filter(m=>m.id.startsWith('wave-pexels-')).map(m=>m.id));result.addedPhotoRefs+=d.places.flatMap(p=>p.photos).filter(p=>p.file?.startsWith('wave-')||p.file?.startsWith('supp-')).length;}
fs.writeFileSync(path.join(root,'docs/research/expansion-applied-20261107.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
