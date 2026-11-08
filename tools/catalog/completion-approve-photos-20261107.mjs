import fs from 'node:fs';
import assert from 'node:assert/strict';
import {out,cache,read,save,digest} from './complete-research-20261107.mjs';
const rows=read(cache+'/photos/sheet-index.json');
const chosen=[8,9,37,38,39,43,44,45,46,47,48],approved=[];
for(const i of chosen){
 const p=rows.find(p=>p.index===i);assert(p?.localFile);
 const html=fs.readFileSync(cache+'/photos/license-'+i+'.html','utf8');
 const license=html.match(/"license"\s*:\s*"(https:[^"\s]+)"/)?.[1];assert.equal(license,p.licenseEvidence,'Primary license '+i);
 const id=[44,45].includes(i)?'rs-da-nang-novotel-danang-premier-h-73c54590':p.recordId;
 const file='completion-'+digest(p.sourceUrl).slice(0,16)+'.jpg';
 fs.copyFileSync(p.localFile,'backend/src/main/resources/catalog/photos/'+file);
 approved.push({recordId:id,originalCandidateRecordId:p.recordId,photo:{file,author:p.author,license:p.license,sourceUrl:p.sourceUrl},checkedAt:'2026-11-07',subjectReview:'VISUALLY_REVIEWED_NAMED_BUSINESS',subjectNote:[44,45].includes(i)?'Tựa ảnh và tòa nhà là Novotel Danang Premier Han River; sửa kết quả gắn nhầm vào Novotel Nha Trang.':'Tên cơ sở trong mô tả ảnh phù hợp; đã xem ảnh và đối chiếu thẻ.',licenseReview:{method:'PRIMARY_FLICKR_PHOTO_SCHEMA_LICENSE',url:p.sourceUrl,licenseUrl:license,pageSha256:digest(html)},imageSha256:digest(fs.readFileSync(p.localFile))});
}
save(out+'/approved-photos.json',approved);
save(out+'/photo-review.json',rows.map(p=>({index:p.index,recordId:p.recordId,title:p.title,sourceUrl:p.sourceUrl,status:chosen.includes(p.index)?'APPROVED':'NOT_APPLIED',reason:chosen.includes(p.index)?'Đã đối chiếu chủ thể và giấy phép trang ảnh gốc.':p.index===49?'Ảnh 58 Phan Văn Trị, Bình Thạnh; khác cơ sở 389–391 Võ Văn Tần.':[41,42].includes(p.index)?'Ảnh chân dung là chủ thể chính; không chọn làm ảnh cơ sở.':'Chủ thể, chi nhánh hoặc vùng không đủ căn cứ khớp thẻ; không đưa vào catalog.'})));
console.log(JSON.stringify({photos:approved.length,venues:new Set(approved.map(p=>p.recordId)).size}));
