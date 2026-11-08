import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const file=path.join(root,'docs/research/photo-candidates/pexels-editorial-2026-11-06.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const candidates=[
 [7276642,'ha-long','Rachel Claire','people-kayaking-in-ha-long-bay-in-vietnam','hanh-trinh','Chèo kayak giữa những vách núi đá Hạ Long','First-party caption explicitly identifies tourists kayaking in Ha Long Bay'],
 [19578152,'ninh-binh','Quý Nguyễn','hang-mua-viewpoint','hanh-trinh','Đi theo những bậc đá lên điểm nhìn Hang Múa','First-party title and caption identify Hang Mua peak in Ninh Binh'],
 [21567735,'nha-trang','Hoài Vy','woman-selling-vegetables-at-a-market','cho','Một góc chợ rau trong buổi sớm Nha Trang','First-party photo page: Nha Trang, Vietnam; vegetable vendor'],
 [36776136,'hue','nhavantuonglai','street-vendor-preparing-vietnamese-cuisine-in-hue','mon-an','Ghé một hàng ăn nhỏ trong buổi chợ Huế','First-party photo page: Hue, Hue, Vietnam; vendor preparing local dishes'],
 [4619765,'hue','Pew Nguyen','white-pasta-and-peppers-in-bowls','mon-an','Bún, rau thơm và chút cay trong một góc chợ Huế','First-party photo page: Hue, Thua Thien Hue; noodles, herbs and fish sauce'],
 [4619764,'hue','Pew Nguyen','woman-in-black-and-white-striped-long-sleeve-shirt-sitting-in-front-of-her-store','nghe','Dừng trước một quầy sợi và vải đầy màu sắc ở Huế','First-party photo page: Thanh pho Hue, Thua Thien Hue; market textiles'],
 [37223759,'da-lat','Xuân Thống Trần','street-food-vendor-cooking-at-night-market','mon-an','Hơi ấm từ một hàng nướng trong đêm Đà Lạt','First-party photo page: Xuan Huong - Da Lat, Lam Dong; night market vendor'],
 [36123440,'da-nang','nhavantuonglai','peaceful-sunrise-at-da-n-ng-fishing-beach','nghe','Đón bình minh cùng nhịp chài lưới Đà Nẵng','First-party photo page: Da Nang, Da Nang; fishermen at sunrise'],
 [29999414,'phu-quoc','Văn Long Bùi','traditional-anchovy-drying-in-phu-quoc-vietnam','nghe','Theo nhịp phơi cá cơm ở Phú Quốc','First-party photo page: Thanh pho Phu Quoc, Kien Giang; anchovy drying workers'],
 [6875004,'cao-bang','Quang Nguyen Vinh','people-standing-knee-deep-in-water-and-looking-at-the-ban-gioc-waterfall-in-vietnam','hanh-trinh','Gặp những người mê chụp ảnh bên thác Bản Giốc','First-party title and caption explicitly identify Ban Gioc Waterfall'],
];
for(const [id,dest,author,slug,theme,caption,locationEvidence] of candidates){
 if(!manifest.photos.some(p=>p.id===id))manifest.photos.push({id,dest,author,sourceUrl:`https://www.pexels.com/photo/${slug}-${id}/`,theme,caption,locationEvidence,status:'candidate'});
}
const cover=manifest.photos.find(p=>p.id===235925);
cover.cover=true;
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
console.log('Specific first-party candidates recorded:',candidates.length);
