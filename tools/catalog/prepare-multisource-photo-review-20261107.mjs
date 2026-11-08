import fs from 'node:fs';
import crypto from 'node:crypto';
import {objects} from './research-flickr-venues-20261107.mjs';
const dir='docs/research/photo-multisource-20261107',old='docs/research/photo-fill-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8')),save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
const norm=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const all=fs.readdirSync('backend/src/main/resources/catalog').filter(f=>f.endsWith('.json')).flatMap(f=>{const d=read('backend/src/main/resources/catalog/'+f);return d.places.map(p=>({...p,dest:d.id}));});
const selected={};
function add(p,cs){if(!p||!cs.length)return;const old=selected[p.id];selected[p.id]={id:p.id,name:p.name,dest:p.dest,address:p.venue.address,kind:p.venue.kind,candidates:[...(old?.candidates||[]),...cs].map(c=>({...c,provider:'commons-explicit-title',discoveryProvider:c.discoveryProvider||c.provider,identityTokens:['manually-shortlisted'],matchedTokens:['manually-shortlisted']}))};}
// Exact phrase matches remain pending visual/address checks; no automatic approval.
for(const file of ['flickr-phrases.json','openverse-phrases.json'])if(fs.existsSync(dir+'/'+file))for(const p of Object.values(read(dir+'/'+file))){
 if(!p.candidates?.length||p.name.includes(' · '))continue;
 const base=norm(p.name.split(' · ')[0].replace(/\(.*\)/,'')).replace(/\b(?:hotel|restaurant|resort|and|spa|collection|vietnam)\b/g,'').trim(),compact=base.replaceAll(' ','');
 if(['theeast','thetemptation','indianaroma','indiagate'].includes(compact))continue;
 const exact=p.candidates.filter(c=>norm(c.title+' '+c.description).replaceAll(' ','').includes(compact)&&compact.length>=6&&!/TAHITI|NONI|BIQUYET|TNI\.COM/i.test(c.title+' '+c.description));
 add(all.find(x=>x.id===p.id),exact.slice(0,3));
}
const geo=read(dir+'/commons-geo.json');
for(const [id,count]of [['rs-da-nang-grand-mercure-danang-d40cae2d',1],['rs-da-nang-mercure-danang-french-vi-ae25ff8f',6]]){const p=geo[id];if(p)add(all.find(p=>p.id===id),p.candidates.slice(0,count));}
const base=read(old+'/commons-categories.json')['rs-ho-chi-minh-man-moi-an-khanh-d50c1379'];if(base)add(all.find(p=>p.id==='rs-ho-chi-minh-hum-garden-2cee3180'),base.candidates);
const probes=[['probe-CucGachQuan.html','rs-ho-chi-minh-cuc-gach-quan-'],['probe-Pho10Hanoi.html','rs-ha-noi-pho-10-ly-quoc-su-hoan-k-43152054'],['probe-NovotelHalong.html','rs-ha-long-novotel-ha-long-bay-adb78c96']];
for(const [file,id]of probes){const f='.logs/photo-multisource-20261107/sources/'+file;if(!fs.existsSync(f))continue;const p=all.find(p=>p.id===id||p.id.startsWith(id));const cs=objects(fs.readFileSync(f,'utf8')).slice(0,16).filter(p=>[4,5,9,10].includes(p.license)).flatMap(ph=>{const sizes=Object.values(ph.sizes?.data||{}).map(v=>v.data).filter(v=>v&&Math.min(v.width,v.height)>=350).sort((a,b)=>Math.abs(Math.max(a.width,a.height)-1200)-Math.abs(Math.max(b.width,b.height)-1200));if(!sizes.length)return[];const s=sizes[0],sourceUrl='https://www.flickr.com/photos/'+ph.ownerNsid+'/'+ph.id;return[{id:crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0,18),provider:'flickr-quoted-probe',title:ph.title,description:ph.description||'',url:(s.url||s.displayUrl).replace(/^\/\//,'https://'),originalUrl:(s.url||s.displayUrl).replace(/^\/\//,'https://'),sourceUrl,author:ph.realname||ph.username,license:ph.license===4?'CC BY 2.0':ph.license===5?'CC BY-SA 2.0':ph.license===9?'CC0':'Public domain',width:s.width,height:s.height,status:'PENDING_REVIEW',checkedAt:'2026-11-07'}];});add(p,cs);}
if(fs.existsSync(dir+'/core-free.json'))for(const row of Object.values(read(dir+'/core-free.json')))add(all.find(p=>p.id===row.id),row.candidates);
// Keep the existing downloader/proof tooling, while research inputs stay separate from the earlier wave.
save(dir+'/shortlist.json',selected);save(old+'/commons-selected-titles.json',selected);console.log(JSON.stringify({shortlistedVenues:Object.keys(selected).length,images:Object.values(selected).reduce((n,p)=>n+p.candidates.length,0)}));
