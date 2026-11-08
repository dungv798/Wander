import fs from 'node:fs';
import {out,read,save,norm,plain} from './complete-research-20261107.mjs';
import {editorial} from './completion-copy-20261107.mjs';
import {hotelEditorial} from './completion-hotel-copy-20261107.mjs';
for (const [name,copy] of hotelEditorial) editorial.set(name,copy);

const list=read(out+'/resolved.json');
const siteFacts=read(out+'/site-facts.json');
const hotels=[
 [/suites?/i,'Có hạng suite'],[/villas?/i,'Có lựa chọn villa'],
 [/old quarter|historic cent(?:er|re)/i,'Trong khu phố lịch sử'],
 [/opera|theat(?:er|re)/i,'Thiết kế hoặc vị trí gắn với nhà hát'],
 [/artwork|art collection|contemporary art/i,'Không gian có tác phẩm nghệ thuật'],
 [/indoor pool/i,'Bể bơi trong nhà'],
 [/rooftop/i,'Có khu trên tầng mái'],
 [/restaurant|dining options|dining room/i,'Có nhà hàng hoặc không gian ăn uống'],
 [/cocktail bar|bar and|bar area/i,'Có quầy bar'],
 [/shared area|communal area|shared lounge/i,'Khu sinh hoạt chung'],
 [/dorm|dormitory/i,'Có giường phòng tập thể'],
 [/family room|family suite|families|family-friendly/i,'Có thông tin lưu trú cho gia đình'],
 [/cave.{0,25}tour|tours.{0,25}cave/i,'Có thông tin tour hang động'],
 [/cloud viewing/i,'Hướng nhìn mây vùng cao'],
 [/full.length glass|large windows|floor.to.ceiling/i,'Cửa kính lớn'],
 [/mosquito net/i,'Có màn ngủ theo mô tả nguồn'],
 [/hot showers?|hot water/i,'Có nước nóng theo mô tả nguồn'],
 [/private (?:plunge )?pools?/i,'Có hạng phòng hoặc villa với bể bơi riêng'],
 [/rice (?:paddies|fields|terraces)|terraced rice/i,'Không gian gắn với ruộng bậc thang'],
 [/beachfront|beach.front|private beach|on .{0,30}beach/i,'Vị trí gần hoặc sát bãi biển'],
 [/river(?:side|front| view)|on the .{0,20}river|views? of the .{0,20}river/i,'Không gian ven sông'],
 [/ocean.view|sea.view|ocean-facing|overlook.{0,30}(?:sea|ocean)/i,'Có lựa chọn nhìn ra biển'],
 [/mountain.view|mountain skyline|overlook.{0,30}mountain/i,'Có lựa chọn nhìn núi'],
 [/spa|wellness/i,'Spa hoặc dịch vụ thư giãn'],
 [/fitness (?:centre|center)|gym|fitness room/i,'Phòng tập'],
 [/kids.? club|children.?s club/i,'Khu sinh hoạt dành cho trẻ em'],
 [/swimming pool|outdoor pool|pool areas|rooftop pool/i,'Bể bơi'],
 [/kitchenette|fully.equipped kitchen|full kitchen/i,'Có hạng lưu trú với bếp riêng'],
 [/private balcony|balconies|balcony|terraces?/i,'Có khu ban công hoặc sân hiên'],
 [/tropical garden|lush garden|leafy garden|landscaped garden|gardens? surround/i,'Khuôn viên sân vườn'],
 [/rooftop bar|roof.top bar/i,'Quầy bar trên mái'],
 [/french colonial|colonial.style|colonial building/i,'Kiến trúc mang nét thuộc địa'],
 [/traditional craftsmanship|local craft|indigenous design|Hmong brocade/i,'Chi tiết thiết kế từ văn hóa địa phương'],
 [/cooking class/i,'Có chương trình trải nghiệm nấu ăn'],
 [/bicycle|cycling/i,'Có thông tin trải nghiệm bằng xe đạp'],
 [/tennis/i,'Sân tennis'],
 [/yoga|meditation/i,'Có chương trình yoga hoặc thiền'],
 [/air.condition|air conditioning/i,'Điều hòa'],
 [/wi.fi|wifi|wireless/i,'Wi-Fi'],
 [/breakfast/i,'Có phục vụ bữa sáng'],
];
const food=[
 [/salmon hot pot|hot pot with salmon/i,'Lẩu cá hồi'],
 [/burger/i,'Burger'],[/salads?/i,'Các món gỏi hoặc salad'],[/smoothies/i,'Sinh tố'],
 [/mountain goat|goat dishes/i,'Các món dê núi'],[/crispy rice|com chay/i,'Cơm cháy'],[/hill chicken/i,'Gà đồi'],
 [/local pork/i,'Món thịt heo địa phương'],[/wild vegetables/i,'Các món rau vùng cao'],
 [/local dishes|local food|local cuisine/i,'Các món địa phương'],
 [/all.day dining|throughout the day/i,'Phục vụ theo nhiều khung bữa trong ngày'],
 [/buffet/i,'Có lựa chọn buffet'],
 [/breakfast/i,'Có phục vụ bữa sáng'],
 [/french|gallic/i,'Ẩm thực Pháp'],[/italian/i,'Ẩm thực Ý'],[/vietnamese/i,'Món Việt'],[/japanese/i,'Ẩm thực Nhật'],[/cantonese/i,'Ẩm thực Quảng Đông'],[/chinese/i,'Ẩm thực Hoa'],[/indian/i,'Ẩm thực Ấn'],[/mediterranean/i,'Hương vị Địa Trung Hải'],[/european/i,'Ẩm thực Âu'],[/international/i,'Thực đơn quốc tế'],
 [/seafood|fresh fish/i,'Các món cá và hải sản'],[/steak|grill.*beef/i,'Bít tết và món nướng'],[/vegetarian|plant.based|vegan/i,'Có thông tin về lựa chọn từ thực vật'],
 [/open kitchen|show kitchen/i,'Bếp mở'],[/wood.fired|charcoal|chargrill/i,'Món nướng than hoặc củi'],[/terrace|al.fresco|outdoor seating/i,'Có khu ngồi ngoài trời'],[/panoramic|skyline|city view/i,'Không gian nhìn ra thành phố'],[/river view|view.{0,30}river/i,'Không gian nhìn sông'],[/ocean view|sea view|beachfront/i,'Không gian gần biển'],[/rooftop/i,'Vị trí trên tầng cao hoặc sân mái'],[/private dining|private room/i,'Có phòng ăn riêng'],[/cocktails?/i,'Cocktail'],[/wine list|wine pairing|wine selection/i,'Có lựa chọn rượu dùng cùng bữa'],[/coffee|espresso/i,'Cà phê'],[/pastr(?:y|ies)|bakery/i,'Bánh và món ăn nhẹ'],[/live music|jazz/i,'Có thông tin về chương trình âm nhạc'],
];
const weekday=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const day=['T2','T3','T4','T5','T6','T7','CN'];
function hoursText(hours){if(!hours)return '';const groups=[];for(let i=0;i<7;i++){const h=hours[weekday[i]];if(!h)continue;const value=h.map(x=>/^closed$/i.test(x)?'Nghỉ':x.replaceAll('-','–')).join(', ');const previous=groups.at(-1);if(previous&&previous.value===value&&previous.end===i-1)previous.end=i;else groups.push({start:i,end:i,value});}return groups.map(g=>(g.start===0&&g.end===6?'Hằng ngày':g.start===g.end?day[g.start]:day[g.start]+'–'+day[g.end])+' '+g.value).join('; ');}
const translatedAmenities={ 'Swimming pool':'Bể bơi','Car park':'Bãi đỗ xe','Fitness center':'Phòng tập','Restaurant':'Nhà hàng','Breakfast':'Bữa sáng','Wi-Fi':'Wi-Fi','Air conditioning':'Điều hòa','Shuttle':'Xe đưa đón','Bar':'Quầy bar','Room service':'Dịch vụ tại phòng','Meeting rooms':'Phòng họp','Wheelchair accessible':'Có thông tin hỗ trợ tiếp cận bằng xe lăn'};
const categories=['lodging','restaurant','cafe','bar'];
const results=[];
for(const r of list){
 if(r.kind==='dish'){results.push({...r,completion:{content:'READY_GUIDE_ITEM',position:'NOT_A_VENUE',photos:'OPTIONAL_DISH_ILLUSTRATION'},guideItem:{icon:'tools-kitchen-2',title:r.name,text:r.summary,placeId:null}});continue;}
 let source=r.evidence.description||'';
 const ownerSite=siteFacts[r.website||r.evidence.listingWebsite];
 if(!r.parentHotel&&ownerSite?.status===200&&ownerSite.file){
  const own=norm(r.name).split(' ').filter(t=>t.length>3&&!['hotel','resort','saigon','hanoi','restaurant','coffee','cafe','boutique'].includes(t));
  if(own.length&&own.every(t=>norm(ownerSite.title).includes(t))){const html=fs.readFileSync(ownerSite.file,'utf8');const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||html;const text=plain(main.replace(/<nav\b[\s\S]*?<\/nav>/gi,'').replace(/<header\b[\s\S]*?<\/header>/gi,'').replace(/<footer\b[\s\S]*?<\/footer>/gi,''));source+=' '+text.slice(0,18000);}
 }
 const rules=r.kind==='lodging'?hotels:food;
 let specific=editorial.get(r.dest+'|'+r.name)||editorial.get(r.name);
 const features=[...new Set(rules.filter(([rx])=>rx.test(source)).map(([,label])=>label))];
 const amenities=r.parentHotel?[]:(r.facts.amenities||[]).map(a=>translatedAmenities[a]).filter(Boolean);
 if(!specific){
  const highlights=[...new Set([...features,...amenities])].slice(0,5);
  const locality=r.address||r.locality;
  const hook=r.kind==='lodging'?`${r.name}: ${features[0]?.toLowerCase()||'chỗ ở để cân nhắc'} tại ${r.locality}.`:`${r.venueName||r.name}${r.parentHotel?' trong '+r.parentHotel:''}.`;
  let summary=hook;
  if(features.length)summary+=' Hồ sơ nguồn giới thiệu '+features.slice(0,4).map(s=>s.toLowerCase()).join('; ')+'.';
  else if(amenities.length)summary+=' Cơ sở công bố '+amenities.slice(0,4).map(s=>s.toLowerCase()).join(', ')+'.';
  else summary+=' Địa chỉ: '+locality+'.';
  specific={hook,summary,highlights,tips:r.kind==='lodging'?['Đối chiếu hạng phòng, sức chứa và điều kiện hủy theo ngày nhận phòng.','Hỏi dịch vụ nào đã gồm trong giá và khoản nào tính riêng.']:r.parentHotel?['Hỏi lễ tân vị trí nhà hàng và việc đón khách không lưu trú.','Xác nhận thực đơn gọi món, buffet hoặc theo bộ cho khung giờ bạn chọn.']:r.kind==='cafe'||r.kind==='bar'?['Xem thực đơn đồ uống và hỏi điều kiện đặt chỗ nếu đi nhóm.']:['Đối chiếu thực đơn và khẩu phần trước khi chọn món.']};
 }
 let serviceHours=hoursText(r.facts.openingHours);
 if(r.kind==='lodging'&&(r.facts.checkinTime||r.facts.checkoutTime))serviceHours=[r.facts.checkinTime?'Nhận phòng '+r.facts.checkinTime.slice(0,5):null,r.facts.checkoutTime?'Trả phòng '+r.facts.checkoutTime.slice(0,5):null].filter(Boolean).join('; ');
 const tier=r.facts.priceIndicator?.length;
 const priceNote=tier?'Phân khúc Michelin: '+({1:'bình dân',2:'chi tiêu vừa phải',3:'dịp đặc biệt',4:'phân khúc cao'}[tier]||'tham khảo')+'; xem giá trên thực đơn.':'';
 const phone=r.facts.phone?String(r.facts.phone).trim().slice(0,60):'';
 let website=r.website||'';if(/^http:\/\//.test(website))website=website.replace(/^http:/,'https:');try{const u=new URL(website);if(u.protocol!=='https:'||u.username||u.password)website='';else{u.searchParams.delete('utm_source');website=u.href;}}catch{website='';}
 const notes=[...specific.tips];
 if(r.positionDecision==='RECENT_PUBLISHED_GUIDE_POINT')notes.push('Ghim theo mục cẩm nang cập nhật '+r.sourceUpdated+'; xác nhận cửa vào với cơ sở trước khi đi.');
 if(/temporarily relocated/i.test(source)&&!notes.some(n=>n.includes('tạm phục vụ')))notes.unshift('Nguồn ghi có thay đổi địa điểm phục vụ tạm thời; xác nhận nơi đón khi đặt chỗ.');
 if(r.parentHotel)notes.push('Ghim tại lối vào khách sạn; vị trí phòng ăn hoặc tầng phục vụ cần hỏi tại cơ sở.');
 if(serviceHours)notes.push('Lịch phục vụ theo nguồn đối chiếu ngày 07/11/2026; xác nhận lại vào ngày lễ hoặc khi đặt chỗ.');
 if(phone)notes.push('Số liên hệ theo hồ sơ nguồn: '+phone+'.');
 if(r.facts.email)notes.push('Email liên hệ theo nguồn: '+r.facts.email+'.');
 const readyPosition=r.positionDecision&&!r.positionDecision.startsWith('HOLD');
 const profile={id:r.id,name:r.name,category:r.kind==='lodging'?'luu':'am',area:r.locality||r.dest||r.targetDestination||'Việt Nam',hook:specific.hook.slice(0,240),summary:specific.summary,lat:r.location?.lat??null,lon:r.location?.lon??null,bestMonths:[],bestLabel:'Theo lịch phục vụ của cơ sở',duration:r.kind==='lodging'?'Chọn ngày nhận và trả phòng':r.kind==='cafe'||r.kind==='bar'?'Tùy buổi nghỉ bạn chọn':'Tùy bữa ăn bạn chọn',difficulty:'Không áp dụng',highlights:specific.highlights,verdict:'worth',verdictReason:specific.highlights.length?'Phù hợp nếu bạn muốn '+specific.highlights.slice(0,2).map(s=>s.toLowerCase()).join(' và ')+'.':'Có địa chỉ và nguồn để đối chiếu với nhu cầu chuyến đi.',bestSlots:[],slotReason:serviceHours?'Chọn khung ghé phù hợp lịch phục vụ công bố.':'Xác nhận lịch phục vụ với cơ sở trước khi chọn giờ ghé.',tips:[...notes,...r.sourceUrls.map(u=>'Nguồn: '+u)],photos:[],wikipediaTitle:null,venue:{kind:r.kind,address:r.address,website,sourceUrl:r.sourceUrl,checkedAt:'2026-11-07',phone,serviceHours,priceNote}};
 const contentReady=profile.summary.length>=70&&profile.highlights.length>=2&&profile.tips.length>=2;
 const problems=[];if(!r.dest)problems.push('DESTINATION_NOT_IN_CATALOG');if(!readyPosition)problems.push('POSITION_NEEDS_REVIEW');if(!contentReady)problems.push('CONTENT_NEEDS_REVIEW');if(!r.address)problems.push('MISSING_ADDRESS');if(!categories.includes(r.kind))problems.push('UNKNOWN_KIND');
 results.push({...r,place:profile,completion:{content:contentReady?'READY':'REVIEW',position:r.positionDecision,photos:'PENDING_LICENSED_PHOTO_REVIEW',ready:!problems.length,problems}});
}
save(out+'/profiles.json',{version:1,checkedAt:'2026-11-07',records:results});
console.log(JSON.stringify({total:results.length,ready:results.filter(r=>r.completion.ready).length,contentReady:results.filter(r=>r.completion.content==='READY').length,withPhone:results.filter(r=>r.place?.venue.phone).length,withHours:results.filter(r=>r.place?.venue.serviceHours).length,withPriceTier:results.filter(r=>r.place?.venue.priceNote).length,contentNeedsReview:results.filter(r=>r.place&&r.completion.content!=='READY').map(r=>({name:r.name,kind:r.kind,description:r.evidence.description}))},null,2));
