// Final visual decisions refer to frozen contact-sheet indexes, never a regenerated sheet.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='docs/research/photo-multisource-20261107';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const save=(f,v)=>fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n');
function append(file, rows){const old=read(file);for(const row of rows)if(!old.some(p=>p.id===row.id&&p.placeId===row.placeId))old.push(row);save(file,old);}
const pub=read(dir+'/review-core-free.json').find(p=>p.index===2);
assert.equal(pub.name,'Lotte Hotel Hanoi');
assert.match(pub.description,/Lotte hotel lobby/);
append('docs/research/photo-fill-20261107/reviewed-selections.json',[{id:pub.id,placeId:pub.placeId,sourceUrl:pub.sourceUrl,note:'Ảnh nhìn từ sảnh Lotte Hotel Hanoi, nguồn tác giả ghi rõ khách sạn và tháng 6/2016; chú thích vai trò và thời điểm, không gọi đây là ảnh phòng hay mặt tiền.',caption:'Nhìn từ sảnh khách sạn · 06/2016'}]);
const rows=read(dir+'/preview-review-2.json');
const decisions=[
 [1,'Azerai La Residence, Hue','Mặt tiền La Residence Huế, kiến trúc art deco khớp cơ sở hiện mang tên Azerai; nguồn ghi rõ chụp năm 2018.','Ảnh nguồn: 2018'],
 [4,'Azerai La Residence, Hue','Mặt sau và vườn La Residence bên sông Hương, cùng bộ ảnh nguồn năm 2018.','Ảnh nguồn: 2018'],
 [8,'Mango Bay Resort','Quầy bar Mango Bay trong bộ ảnh Phú Quốc của cùng tác giả; biển On The Rocks và không gian khớp cơ sở.','Quầy bar trong khu nghỉ dưỡng'],
 [5,'Mango Bay Resort','Bãi biển Mango Bay trong cùng loạt ảnh Phú Quốc; loại góc gần trùng và ảnh chung không nhận diện cơ sở.','Bãi biển tại khu nghỉ dưỡng'],
 [15,'Press Club','Ảnh lối vào có biển Hanoi Press Club; đối chiếu địa chỉ 59A Lý Thái Tổ. Đây là ảnh mặt tiền nguồn cũ, không mô tả nội thất hiện tại.','Mặt tiền · ảnh nguồn cũ'],
 [47,'Skylight Nha Trang','Khu ghế ngồi rooftop Skylight Nha Trang, nguồn nêu rõ tên cơ sở và hình ảnh khớp khu sân thượng.','Khu sân thượng'],
 [48,'Skylight Nha Trang','Góc sân thượng với tháp đèn đặc trưng Skylight Nha Trang, cùng bộ ảnh có tên cơ sở.','Khu sân thượng']
];
append(dir+'/preview-approved.json',decisions.map(([index,name,note,caption])=>{const p=rows.find(p=>p.index===index);assert.equal(p.name,name);assert.match(p.license,/^CC BY-NC(?:-SA)? 2\.0$/);return {id:p.id,placeId:p.placeId,sourceUrl:p.sourceUrl,note,caption};}));
console.log(JSON.stringify({publicApproved:read('docs/research/photo-fill-20261107/reviewed-selections.json').length,localNoncommercialApproved:read(dir+'/preview-approved.json').length}));
