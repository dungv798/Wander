import fs from 'node:fs';
import {out,read,save,norm,plain} from './complete-research-20261107.mjs';
const rows=read(out+'/resolved.json'),sites=read(out+'/site-facts.json');
const changes=[];
// Đối chiếu lại trang liên hệ riêng của khách sạn; loại số tổng đài OTA từ trang đặt phòng.
const lodgeContact='https://nhatranglodgehotel.com/en/contact',lodgeCache=out+'/nha-trang-lodge-contact.html';
if(!fs.existsSync(lodgeCache)){const response=await fetch(lodgeContact,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw new Error('Nha Trang Lodge contact HTTP '+response.status);fs.writeFileSync(lodgeCache,await response.text());}
const lodgeText=plain(fs.readFileSync(lodgeCache,'utf8'));if(!lodgeText.includes('0832888665')||!lodgeText.includes('42 Tran Phu'))throw new Error('Contact identity mismatch');
for(const r of rows){
 if(r.kind==='dish')continue;
 if(r.name==='Nha Trang Lodge Hotel'){
  r.website='https://nhatranglodgehotel.com/';r.facts.phone='0832888665';r.facts.email='sales@nhatranglodgehotel.com';r.sourceUrls=[...new Set([...r.sourceUrls.filter(u=>!u.includes('amazingo.vn')),lodgeContact,'https://nhatranglodgehotel.com/en/home'])];
  r.evidence.phoneSource={url:lodgeContact,method:'HOTEL_CONTACT_PAGE_WITH_MATCHING_STREET_ADDRESS'};changes.push({id:r.id,name:r.name,phone:r.facts.phone,website:r.website,source:lodgeContact,reason:'Thay liên hệ tổng đài trang đặt phòng bằng trang liên hệ khách sạn.'});continue;
 }
 const site=sites[r.website||r.evidence.listingWebsite];
 const tokens=norm(r.name).split(' ').filter(t=>t.length>2&&!/^(the|hotel|resort|restaurant|saigon|hanoi|luxury|boutique|and|spa|collection|mgallery)$/.test(t));
 const identity=site?.status===200&&tokens.length>=2&&tokens.every(t=>norm(site.title).includes(t));
 if(identity&&site.file){
  const html=fs.readFileSync(site.file,'utf8');
  const phones=[...new Set([...html.matchAll(/href=["']tel:([^"']+)["']/gi)].map(m=>plain(decodeURIComponent(m[1])).replace(/\s+/g,' ').trim()).filter(p=>/^(?:\+?84|0)[\d ()+.-]{7,30}$/.test(p)))];
  if(!r.facts.phone&&phones.length===1){r.facts.phone=phones[0];r.sourceUrls=[...new Set([...r.sourceUrls,site.url])];r.evidence.phoneSource={url:site.url,method:'SINGLE_TEL_LINK_ON_IDENTITY_MATCHED_OFFICIAL_SITE'};changes.push({id:r.id,name:r.name,phone:phones[0],source:site.url});}
 }
 if(r.name==='Namia River Retreat - Wellness Inclusive Resort'){
  r.address='232 Trần Nhân Tông, Hội An, Việt Nam';
  changes.push({id:r.id,name:r.name,address:r.address,source:'https://www.openstreetmap.org/way/286443031'});
 }
 if(r.venueName==='LA FÉE VERTE'){r.kind='bar';changes.push({id:r.id,name:r.name,kind:'bar',reason:'Trang cơ sở mô tả cocktail, đồ uống và không gian lounge.'});}
}
save(out+'/resolved.json',rows);save(out+'/contact-review.json',changes);console.log(JSON.stringify({updated:changes.length,changes}));
