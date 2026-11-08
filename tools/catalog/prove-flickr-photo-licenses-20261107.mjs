// Flickr's public search response is primary, public license metadata (not a search engine's claim).
import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {objects} from './research-flickr-venues-20261107.mjs';
const dir='docs/research/photo-fill-20261107',read=f=>JSON.parse(fs.readFileSync(f,'utf8')),proof=read(dir+'/primary-license-proof.json'),downloads=read(dir+'/downloads.json');
const licenses={1:['CC BY-NC-SA 2.0','by-nc-sa'],2:['CC BY-NC 2.0','by-nc'],3:['CC BY-NC-ND 2.0','by-nc-nd'],4:['CC BY 2.0','by'],5:['CC BY-SA 2.0','by-sa']};
const extra='.logs/photo-multisource-20261107/sources';
for(const s of read(dir+'/reviewed-selections.json')){
 const p=downloads[s.id];if(!p?.sourceUrl.includes('flickr.com')||proof[p.sourceUrl])continue;
 const photoId=new URL(p.sourceUrl).pathname.split('/').filter(Boolean).at(-1);
 const files=[p.sourceFile,...['flickr-core','flickr-phrases','openverse-phrases','flickr-variants'].map(c=>extra+'/'+c+'-'+s.placeId+'.html'),...fs.readdirSync(extra).filter(f=>f.startsWith('probe-')).map(f=>extra+'/'+f)].filter(f=>f&&fs.existsSync(f));
 let found;
 for(const file of files){const raw=fs.readFileSync(file,'utf8'),ph=objects(raw).find(ph=>String(ph.id)===photoId);if(!ph)continue;const license=licenses[ph.license];assert(license,'Unsupported primary code');assert.equal(license[0],p.license);assert(p.sourceUrl.includes('/'+ph.ownerNsid+'/'));found={checkedAt:new Date().toISOString(),sourceUrl:p.sourceUrl,licenseUrl:'https://creativecommons.org/licenses/'+license[1]+'/2.0/',evidenceType:'FLICKR_PUBLIC_SEARCH_PRIMARY_METADATA',sourceFile:file,sourceSha256:crypto.createHash('sha256').update(raw).digest('hex'),photoId,owner:ph.ownerNsid,licenseCode:ph.license,description:ph.description||'',taken:ph.dateTaken||ph.datetaken||null};break;}
 assert(found,'No primary license evidence for '+p.sourceUrl);proof[p.sourceUrl]=found;
}
fs.writeFileSync(dir+'/primary-license-proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify({primaryProofs:Object.keys(proof).length}));
