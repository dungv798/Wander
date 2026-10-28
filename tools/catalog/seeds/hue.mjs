// Seed biên tập Huế: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'hue', name: 'Huế', region: 'Trung Bộ', tagline: 'Cố đô với Đại Nội, lăng tẩm và sông Hương', coverPlaceId: 'hoang-thanh-hue',
  references: [{ id: 'trung-tam-hue', name: 'Trung tâm Huế', lat: 16.4637, lon: 107.5909, approximate: true }],
  season: { summary: 'Tháng 1–4 mát và ít mưa; tháng 9–12 mưa nhiều, dễ có lũ.', best: m(1, 4), rainy: m(9, 12), notes: ['Khoảng tháng 1 đến tháng 4 thời tiết dễ chịu, thích hợp đi bộ tham quan.', 'Tháng 5–8 nóng; tháng 9–12 mưa nhiều và có thể có lũ.'] },
  packing: { summary: 'Áo mưa, mũ nón, giày dễ đi.', items: ['Áo mưa', 'Mũ nón', 'Giày dễ đi bộ', 'Nước uống', 'Kem chống nắng'] },
  places: [
    p('hoang-thanh-hue', 'Kinh thành Huế', 'van', 'Trung tâm', 'Hoàng thành triều Nguyễn với cổng Ngọ Môn, điện Thái Hòa và nhiều cung điện.', 'must', 'Di sản trung tâm của Huế, nên dành nửa ngày.', m(1, 4), '3–4 giờ', { name: 'Đại Nội Huế', slots: ['sang'], slotReason: 'Sáng mát và ít đông; trưa nắng gắt, đi bộ nhiều.', tips: ['Mang mũ nón, nước uống.', 'Hỏi giờ mở cửa và giá vé tại cổng.'] , keepPhotos: [1, 2] }),
    p('chua-thien-mu', 'Chùa Thiên Mụ', 'van', 'Ven sông Hương', 'Ngôi chùa cổ bên sông Hương với tháp bảy tầng, biểu tượng của Huế.', 'must', 'Cảnh đẹp ven sông, đi thuyền hoặc xe đều tiện.', m(1, 12), '1–1,5 giờ', { slots: ['sang', 'chieu'] , keepPhotos: [2, 3] }),
    p('lang-khai-dinh', 'Lăng Khải Định', 'van', 'Phía Nam', 'Lăng có kiến trúc kết hợp Đông Tây, nội thất khảm sành sứ.', 'worth', 'Một trong những lăng ấn tượng nhất, nhiều chi tiết trang trí.', m(1, 4), '1–1,5 giờ'),
    p('lang-minh-mang', 'Lăng Minh Mạng', 'van', 'Phía Nam', 'Lăng rộng với hồ, đình và sân đền theo trục đối xứng.', 'worth', 'Không gian rộng, nhiều cây xanh, hợp đi dạo.', m(1, 4), '1,5 giờ'),
    p('lang-tu-duc', 'Lăng Tự Đức', 'van', 'Phía Nam', 'Lăng như một khu vườn với hồ và đình tạ, nơi vua Tự Đức từng nghỉ ngơi.', 'must', 'Đẹp nhất trong các lăng, yên tĩnh và nhiều bóng cây.', m(1, 4), '1,5 giờ'),
    p('cau-truong-tien', 'Cầu Trường Tiền', 'canh', 'Trung tâm', 'Cây cầu sắt bắc qua sông Hương, tối lên đèn đổi màu.', 'worth', 'Đi dạo ven sông buổi tối rất dễ chịu.', m(1, 12), '30–60 phút', { slots: ['toi'] }),
    p('song-huong', 'Sông Hương', 'canh', 'Trung tâm', 'Dòng sông chảy qua trung tâm, đi thuyền rồng nghe ca Huế.', 'worth', 'Trải nghiệm đặc trưng của Huế, thường vào buổi chiều tối.', m(1, 12), '1–2 giờ', { slots: ['chieu', 'toi'] }),
    p('dan-nam-giao', 'Đàn Nam Giao', 'van', 'Phía Nam', 'Đàn tế trời của triều Nguyễn, khuôn viên rộng và vắng.', 'ifconv', 'Hợp người thích lịch sử và nơi yên tĩnh.', m(1, 4), '45 phút'),
    p('doi-vong-canh', 'Đồi Vọng Cảnh', 'canh', 'Phía Nam', 'Ngọn đồi nhìn xuống sông Hương và những khúc cong quanh Huế.', 'ifconv', 'Cảnh đẹp lúc chiều, thường kết hợp với đi lăng.', m(1, 4), '30–45 phút', { slots: ['chieu'] }),
    p('cho-dong-ba', 'Chợ Đông Ba', 'cho', 'Trung tâm', 'Chợ lớn nhất Huế, bán đồ ăn, quà lưu niệm, nón lá.', 'worth', 'Mua quà và thử món ăn vặt, nằm ngay trung tâm.', m(1, 12), '1–1,5 giờ'),
    p('cung-an-dinh', 'Cung An Định', 'van', 'Trung tâm', 'Cung điện nhỏ kiểu Á Âu với nhiều chi tiết trang trí.', 'ifconv', 'Hợp ai thích kiến trúc, tiện đi thêm ở trung tâm.', m(1, 12), '30–45 phút'),
    p('lang-co', 'Lăng Cô', 'canh', 'Phú Lộc', 'Vịnh biển và đầm phá ở chân đèo Hải Vân, bãi cát dài.', 'worth', 'Cảnh biển đẹp, tiện khi đi đường Huế – Đà Nẵng.', m(2, 8), '2–3 giờ'),
    p('vuon-quoc-gia-bach-ma', 'Vườn quốc gia Bạch Mã', 'leo', 'Phú Lộc', 'Rừng núi cao mát với thác và đường mòn đi bộ.', 'worth', 'Hợp ai thích đi bộ nhẹ trong rừng, mát hơn vùng đồng bằng.', m(2, 7), '1 ngày', { slots: ['sang'], difficulty: 'Vừa' , keepPhotos: [1, 2] }),
  ],
};
