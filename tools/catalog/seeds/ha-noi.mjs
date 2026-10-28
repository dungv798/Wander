// Seed biên tập Hà Nội: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'ha-noi', name: 'Hà Nội', region: 'Đồng bằng sông Hồng', tagline: 'Thủ đô nghìn năm với hồ, phố cổ và di tích', coverPlaceId: 'ho-hoan-kiem',
  references: [{ id: 'trung-tam-ha-noi', name: 'Hồ Hoàn Kiếm', lat: 21.0285, lon: 105.8542, approximate: true }],
  season: { summary: 'Tháng 10–11 và 3–4 dễ chịu; tháng 6–8 nóng, tháng 12–2 lạnh.', best: [10, 11, 3, 4], rainy: m(5, 9), notes: ['Mùa thu (tháng 9–11) trời mát và nhiều nắng đẹp; mùa xuân (tháng 3–4) mát, có mưa phùn.', 'Mùa hè tháng 6–8 nóng và mưa rào; mùa đông tháng 12–2 lạnh, cần áo ấm.'] },
  packing: { summary: 'Áo khoác theo mùa, giày dễ đi, áo mưa mỏng.', items: ['Áo khoác theo mùa', 'Giày dễ đi bộ', 'Áo mưa mỏng', 'Mũ nón', 'Tiền mặt nhỏ'] },
  places: [
    p('ho-hoan-kiem', 'Hồ Hoàn Kiếm', 'canh', 'Hoàn Kiếm', 'Hồ giữa trung tâm với Tháp Rùa và Đền Ngọc Sơn, phố đi bộ cuối tuần.', 'must', 'Trái tim của Hà Nội, điểm bắt đầu của hầu hết chuyến đi.', m(9, 11), '1–2 giờ', { slots: ['sang', 'toi'], slotReason: 'Sáng sớm mát, người dân tập thể dục; tối cuối tuần có phố đi bộ.' }),
    p('den-ngoc-son', 'Đền Ngọc Sơn', 'van', 'Hoàn Kiếm', 'Ngôi đền nhỏ trên đảo giữa hồ Hoàn Kiếm, nối bằng cầu Thê Húc.', 'worth', 'Nằm ngay giữa hồ, dễ ghé khi đi dạo.', m(1, 12), '30–45 phút'),
    p('pho-co-ha-noi', 'Phố cổ Hà Nội', 'van', 'Hoàn Kiếm', 'Khu phố 36 phố phường với những ngõ nhỏ, hàng quán và nghề truyền thống.', 'must', 'Nơi cảm nhận nhịp sống và ẩm thực của Hà Nội.', m(9, 11), '3–4 giờ', { slots: ['sang', 'toi'] }),
    p('van-mieu-quoc-tu-giam', 'Văn Miếu – Quốc Tử Giám', 'van', 'Đống Đa', 'Trường đại học đầu tiên của Việt Nam với sân vườn, bia tiến sĩ và kiến trúc cổ.', 'must', 'Di tích lịch sử và văn hóa nổi bật, không khí yên tĩnh.', m(9, 11), '1–1,5 giờ', { slots: ['sang'] }),
    p('lang-chu-tich-ho-chi-minh', 'Lăng Chủ tịch Hồ Chí Minh', 'van', 'Ba Đình', 'Công trình lăng giữa quảng trường Ba Đình, có quy định tham quan riêng.', 'worth', 'Điểm lịch sử quan trọng, nên kiểm tra giờ và quy định trước khi đi.', m(9, 11), '1–1,5 giờ', { slots: ['sang'], tips: ['Kiểm tra giờ mở cửa và quy định trang phục trước.', 'Không mang vật dụng bị cấm.'] }),
    p('hoang-thanh-thang-long', 'Khu di tích Trung tâm Hoàng thành Thăng Long', 'van', 'Ba Đình', 'Khu di tích khảo cổ của kinh thành xưa, Di sản Thế giới.', 'worth', 'Hợp ai thích lịch sử, đi bộ thoải mái.', m(9, 11), '1,5–2 giờ', { name: 'Hoàng thành Thăng Long' }),
    p('chua-mot-cot', 'Chùa Một Cột', 'van', 'Ba Đình', 'Ngôi chùa nhỏ dựng trên một cột đá giữa hồ sen, kiến trúc độc đáo.', 'worth', 'Biểu tượng của Hà Nội, tiện đi cùng Lăng Chủ tịch.', m(1, 12), '20–30 phút'),
    p('nha-tho-lon-ha-noi', 'Nhà thờ Lớn Hà Nội', 'van', 'Hoàn Kiếm', 'Nhà thờ Gothic gần hồ Hoàn Kiếm, khu phố xung quanh nhiều quán cà phê.', 'ifconv', 'Dễ ghé khi đi dạo phố cổ.', m(1, 12), '20–30 phút'),
    p('nha-hat-lon-ha-noi', 'Nhà hát Lớn Hà Nội', 'van', 'Hoàn Kiếm', 'Nhà hát kiến trúc Pháp nổi bật, quảng trường phía trước là nơi dạo mát.', 'ifconv', 'Đi ngang khi dạo trung tâm.', m(1, 12), '20–30 phút'),
    p('ho-tay', 'Hồ Tây', 'canh', 'Tây Hồ', 'Hồ lớn nhất nội thành, nhiều quán cà phê, chùa và đường đạp xe.', 'worth', 'Hợp dạo chơi buổi chiều và ngắm hoàng hôn.', m(9, 11), '2–3 giờ', { slots: ['chieu'] }),
    p('chua-tran-quoc', 'Chùa Trấn Quốc', 'van', 'Tây Hồ', 'Ngôi chùa cổ nhất Hà Nội, nằm trên một bán đảo nhỏ ở Hồ Tây.', 'worth', 'Yên tĩnh, cảnh đẹp ven hồ.', m(9, 11), '45 phút'),
    p('cau-long-bien', 'Cầu Long Biên', 'canh', 'Hoàn Kiếm', 'Cây cầu sắt cổ bắc qua sông Hồng, nổi tiếng với cảnh chiều và ảnh đường tàu.', 'worth', 'Cảnh quen thuộc của Hà Nội, đẹp lúc chiều.', m(9, 11), '1 giờ', { slots: ['chieu'] }),
    p('nha-tu-hoa-lo', 'Nhà tù Hỏa Lò', 'van', 'Hoàn Kiếm', 'Di tích lịch sử, bảo tàng về nhà tù thời thuộc địa.', 'worth', 'Hiểu thêm lịch sử, nội dung khá nặng.', m(1, 12), '1 giờ', { keepPhotos: [1] }),
    p('bat-trang', 'Bát Tràng', 'cho', 'Gia Lâm', 'Làng gốm nổi tiếng ven sông Hồng, có thể mua và tự tay làm gốm.', 'worth', 'Một buổi ngoài trung tâm, hợp mua quà và làm thủ công.', m(1, 12), '2–3 giờ', { slots: ['sang', 'chieu'] }),
  ],
};
