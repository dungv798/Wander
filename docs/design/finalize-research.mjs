import fs from 'node:fs';
import path from 'node:path';
const manifest=JSON.parse(fs.readFileSync('docs/design/crops/manifest.json','utf8'));
const descriptions=[
['Tìm kiếm đang nhập','Đầu: back + search + chip châu lục; thân: popular destinations hai cột; đáy: bàn phím iOS. Có focus nhập, chưa có query kết quả.'],
['Tạo collection, snap cao','Sheet trên bản đồ: preview folder, tên,8 màu, tab Places/Outdoors/Food/Activities, lưới icon; Cancel/Save nhạt.'],
['Home thế giới','Bản đồ/pin emoji phía trên; sheet nửa dưới có chip Saved/Food/Culture/Nature, collection Recents/Temp và New; Trending; nav3 mục + nút riêng.'],
['Hong Kong / Saved rỗng','Map header chọn khu vực, sheet cao có filter ngang; thông báo chưa lưu; pill tạo chuyến dính đáy.'],
['Hong Kong / khu vực','Map phía sau; hàng tile khu vực cuộn ngang có ảnh/số spots, danh sách trending ảnh nhỏ/rating/menu; nút tạo chuyến nổi.'],
['Danh mục điểm đến','Search + filter châu lục, Popular/East Asia hai cột; ảnh vuông nhỏ; không có bàn phím.'],
['Your Trips / lộ xóa','Logo, segmented Your Trips/Trip Ideas, search/filter/sort; card chuyến lệch trái, Delete đỏ lộ bên phải; nav dính đáy. Cử chỉ gây lệch là suy luận.'],
['Your Trips / tìm chuyến','Search trip mở rộng + close, upcoming card có badge ngày và Generated; bàn phím; không khẳng định query đã lọc.'],
['Sort sheet','Trang chuyến bị dim; sheet thấp có3 kiểu sắp xếp, một kiểu được đánh dấu, Apply.'],
['Filters sheet','Sheet Date of Trip và Your Role, chip nhiều lựa chọn, Apply Filters; nền dim.'],
['Lịch mẫu / Day2','Bản đồ header, sheet có tabs Overview/Day1…4, lịch card ảnh + giờ + mô tả; ô di chuyển xe/bộ giữa điểm; Like/Share/bookmark dưới.'],
['Lịch mẫu / Overview','Tên chuyến, ngày/múi giờ, tab; card Trip Stats/Copy Itin/Memo/Checklist/Discounts, Like/Share/bookmark.'],
['Friends rỗng','Close/search, empty state No friends found, Invite a friend; không thấy danh sách bạn hay flow thêm thành công.'],
['Trip Ideas','Segment chọn Trip Ideas; search/filter/sort;31 itineraries; hero Recommended và lưới card2 cột, badge loại/ngày/saved/likes; nav.'],
['New collection, snap thấp hơn R02','Title, preview folder, input tên, palette8 màu, tab nhóm,24 lựa chọn icon nhìn thấy, Cancel/Save disabled; sheet trên map.'],
['Quota/Pro','Sheet Your quota với2 thanh usage, progress1/5, pin shortcut, import social/link/screenshots, Create trip đã claimed; nút Hide PRO badge.'],
['Chuyến Đà Lạt / Overview','Sheet tên/ngày/avatar+, hàng tab ngang; weather Typical conditions, lưới stats/discover/memo/checklist, discounts, Optimize/Edit/+; tuyến nhiều màu trên map.'],
['Hướng dẫn nhập link','Sheet Save spots from any link: nguồn social/maps/link,4 bước, Got it; map tuyến vẫn phía sau.'],
['Socials / hoàn tất','Sheet Socials, back/help, segmented Instagram/TikTok; phone tutorial Saved; progress, ô nhập link đáy + nút mũi tên.'],
['Socials / click Save','Cùng shell; phone tutorial chỉ Save, progress ở trạng thái khác; input link cố định.'],
['Socials / review kết quả','Phone tutorial danh sách địa điểm có tick, Review the spots it found; progress/input.'],
['Socials / đang tìm','Phone tutorial spinner/illustration và finding progress; không phải bằng chứng job thật đang chạy ở ảnh ngoài tutorial.'],
['Socials / gửi sang Roameo','Phone tutorial share sheet iOS chọn Roameo; progress/input. Web không có bảo đảm Share Extension native tương đương.'],
['Socials / tìm Share menu','Phone tutorial TikTok có nhấn Share; segmented và progress/input giữ nguyên.'],
['Add Spots','Sheet4 ô Socials/Map/Notes or links/Screenshots, icon màu, mô tả; back.'],
['Chuyến Đà Lạt / Overview lặp','Cùng R17, khác frame minh họa Swipe to Discover; không xem đây là feature mới hoặc đo được animation.'],
['Add activities','Sheet search, chọn ngày, segmented For you/Saved; list có ảnh/rating/radio, một mục tô chọn, Add1 to Day1 ở đáy.'],
['Your experience / Visited','Place thumb/title, segmented Want to go/Visited; reaction Superlike/Like/Dislike; public review textarea, Keep in Saved; CTA.'],
['Save for later / Want to go','Private note,2000 counter; Add to collection/Report issue, Save spot; không có giá đặt chỗ.'],
['Ba Na Hills / cuộn xuống','Sticky title +2 icon; Read more, Community saved/superlikes/likes, Share experience; Visit details website/address/tags; bottom actions Save/Navigate/Review.'],
['Ba Na Hills / chi tiết đầu','Map phía sau; sheet title/category/Google rating/open hours, Photos5/Posts8, ảnh ngang, Key takeaways, Community đầu xuất hiện; bottom actions.'],
['Your experience / cuộn xuống','Visited + reaction + public review, Keep in Saved, Report issue, Save experience; phần place header đã cuộn khỏi viewport.'],
['Bài nhập từ Instagram','Hero dọc Kyoto + blurred side fill, tên post/source, Key takeaways theo bullet emoji, Show original, pagination2 chấm, Open on Instagram.'],
['Kifune Shrine / cuộn xuống','Sticky title, Community metrics, visit Website/Reserve/Call, address/tags, bottom Save/Navigate/Review; link Reserve nhìn thấy, đặt thành công chưa thấy.'],
['Kifune Shrine / Posts','Title/category/rating/open hours, Posts2 active;2 post cover có logo Instagram, Key takeaways, Community; actions đáy.'],
['Kifune Shrine / Photos','Cùng R35 nhưng Photos5 active, gallery ảnh3 tile thấy được; Key takeaways/Community; actions đáy.'],
['Màn thanh toán TikTok Shop — ngoài mẫu Roameo','Đã xem toàn ảnh, loại khỏi font/UI Roameo. Bản dẫn xuất che vùng thông tin cá nhân; không dùng số tiền/địa chỉ làm dữ liệu Wander.']
];
const file='docs/design/roameo-spec.md';let spec=fs.readFileSync(file,'utf8');
const marker='<!-- INVENTORY -->';if(spec.includes(marker))spec=spec.slice(0,spec.indexOf(marker));
spec+=marker+'\n| ID / ảnh | Màn | Thành phần và trạng thái thấy được |\n|---|---|---|\n';
for(let i=0;i<manifest.length;i++){const r=manifest[i],d=descriptions[i];spec+=`| [${r.id}](crops/${r.id}-full.png) · [gốc](../UI-sample-2/${r.file}) | ${d[0]} | ${d[1]} |\n`;}
fs.writeFileSync(file,spec);
const links=[...spec.matchAll(/\]\(([^)]+)\)/g)].map(m=>m[1]).filter(x=>!/^https?:/.test(x));
const missing=links.filter(x=>!fs.existsSync(path.resolve('docs/design',x)));
const log={command:'node docs/design/finalize-research.mjs',images:manifest.length,inventoryRows:descriptions.length,localLinks:links.length,missing,ownedPathsOnly:true};
fs.writeFileSync('docs/design/glass-trial/.logs/research-checks.json',JSON.stringify(log,null,2));console.log(JSON.stringify(log));if(missing.length)process.exitCode=1;
