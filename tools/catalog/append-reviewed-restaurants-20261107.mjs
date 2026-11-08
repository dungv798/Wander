import fs from 'node:fs';
const file='docs/research/venue-candidates-20261107.json',r=JSON.parse(fs.readFileSync(file,'utf8'));
const url='https://hoianworldheritage.org.vn/en/news/Hoi-An-Travel/explore-the-food-of-hoi-an-751.hwh';
for(const[slug,name,address,query,focus]of[
 ['white-rose','Bông Hồng Trắng · White Rose','533 Hai Bà Trưng, Hội An','White Rose Hội An','Ghé một địa chỉ chuyên bánh bao bánh vạc, hỏi phần nhân và món ăn kèm.'],
 ['madam-khanh','Madam Khanh · Bánh mì Queen','115 Trần Cao Vân, Hội An','Madam Khanh Hội An','Chọn một ổ bánh mì theo khẩu vị trước khi tiếp tục dạo phố.'],
]){const id='venue-hoi-an-'+slug;if(r[id])continue;const hits=JSON.parse(fs.readFileSync('.logs/venue-extra-'+encodeURIComponent(query)+'.json','utf8'));r[id]={id,dest:'hoi-an',slug,name,address,url:'',sourceUrl:url,focus,kind:'restaurant',checkedAt:'2026-11-07',approved:false,photos:[],hits};}
fs.writeFileSync(file,JSON.stringify(r,null,2)+'\n');
