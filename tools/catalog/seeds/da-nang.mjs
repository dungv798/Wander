// Seed biên tập Đà Nẵng: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'da-nang', name: 'Đà Nẵng', region: 'Trung Bộ', tagline: 'Thành phố ven biển, cầu bên sông Hàn và núi Ngũ Hành', coverPlaceId: 'cau-rong',
  references: [{ id: 'trung-tam-da-nang', name: 'Trung tâm Đà Nẵng', lat: 16.0544, lon: 108.2022, approximate: true }],
  season: { summary: 'Tháng 2–5 nắng đẹp, biển trong; tháng 9–12 mưa và dễ có bão.', best: m(2, 5), rainy: m(9, 12), notes: ['Khoảng tháng 2 đến tháng 5 thời tiết dễ chịu, ít mưa, hợp tắm biển.', 'Tháng 6–8 nắng nóng; tháng 9–12 mưa nhiều và có thể có bão.'] },
  packing: { summary: 'Đồ bơi, mũ nón, áo mưa mỏng, giày đi bộ.', items: ['Đồ bơi', 'Kem chống nắng', 'Mũ nón', 'Áo mưa mỏng', 'Giày đi bộ'] },
  places: [
    p('cau-rong', 'Cầu Rồng', 'canh', 'Trung tâm', 'Cầu hình rồng bắc qua sông Hàn; tối cuối tuần rồng phun lửa và nước.', 'must', 'Biểu tượng hiện đại của thành phố, nằm ngay trung tâm.', m(2, 8), '1 giờ', { slots: ['toi'], slotReason: 'Buổi tối cầu lên đèn, cuối tuần có biểu diễn rồng phun lửa.', tips: ['Hỏi lịch biểu diễn trước khi đi.', 'Đến sớm để có chỗ đứng đẹp.'] }),
    p('cau-quay-song-han', 'Cầu quay sông Hàn', 'canh', 'Trung tâm', 'Cầu quay bắc qua sông Hàn, ban đêm lên đèn rực rỡ.', 'ifconv', 'Đi dạo ven sông Hàn rất tiện kết hợp với Cầu Rồng.', m(2, 8), '30–45 phút', { slots: ['toi'] }),
    p('ba-na', 'Bà Nà', 'canh', 'Hòa Vang', 'Khu du lịch trên núi với khí hậu mát, cáp treo dài và các công trình kiến trúc nổi tiếng.', 'must', 'Điểm đến nổi bật nhất vùng ngoại thành, hợp đi trọn một ngày.', m(2, 8), '1 ngày', { slots: ['sang'], slotReason: 'Đi sớm tránh đông và có tầm nhìn tốt; chiều dễ có mây che.', tips: ['Đi sớm, mang áo khoác mỏng vì trên núi mát.', 'Xem giá vé và giờ cáp treo tại quầy.'] }),
    p('ngu-hanh-son', 'Ngũ Hành Sơn', 'canh', 'Ngũ Hành Sơn', 'Cụm núi đá vôi có hang động, chùa và các điểm nhìn ra biển.', 'must', 'Gần trung tâm, kết hợp tham quan hang động và chùa trong một buổi.', m(2, 8), '2–3 giờ', { slots: ['sang', 'chieu'], difficulty: 'Vừa' }),
    p('son-tra', 'Sơn Trà', 'canh', 'Sơn Trà', 'Bán đảo xanh với đường lên đèo, biển trong và các điểm ngắm toàn cảnh.', 'worth', 'Có cảnh thiên nhiên rộng, hợp đi xe máy hoặc ô tô.', m(2, 8), '3–4 giờ', { slots: ['sang', 'chieu'] }),
    p('bai-bien-my-khe', 'Bãi biển Mỹ Khê', 'canh', 'Sơn Trà', 'Bãi cát dài, sóng vừa, tắm biển và ăn hải sản ven đường.', 'must', 'Bãi tắm chính của thành phố, dễ đi và nhiều dịch vụ.', m(2, 8), '2–3 giờ', { slots: ['sang', 'chieu'] }),
    p('chua-linh-ung', 'Chùa Linh Ứng', 'van', 'Sơn Trà', 'Chùa có tượng Quan Âm cao nhìn ra biển, nằm trên bán đảo Sơn Trà.', 'worth', 'View đẹp, kết hợp tốt với chuyến đi Sơn Trà.', m(1, 12), '1 giờ'),
    p('bao-tang-cham', 'Bảo tàng Điêu khắc Chăm', 'van', 'Trung tâm', 'Bảo tàng lưu giữ nhiều hiện vật điêu khắc đá của người Chăm.', 'worth', 'Hợp ngày mưa và ai muốn hiểu về văn hóa Chăm trước khi đi Mỹ Sơn.', m(1, 12), '1–1,5 giờ'),
    p('deo-hai-van', 'Đèo Hải Vân', 'canh', 'Phía Bắc', 'Đèo nổi tiếng giữa Đà Nẵng và Huế, cung đường ven biển rất đẹp.', 'worth', 'Một trong những cung đường đèo đẹp nhất vùng.', m(2, 8), '2–3 giờ', { slots: ['sang'], slotReason: 'Sáng sớm trời quang, ít sương mù.' , keepPhotos: [1, 2] }),
    p('nha-tho-da-nang', 'Nhà thờ chính tòa Đà Nẵng', 'van', 'Trung tâm', 'Nhà thờ màu hồng nhạt, quen gọi là nhà thờ Con Gà, giữa trung tâm.', 'ifconv', 'Dễ ghé khi đi dạo quanh trung tâm.', m(1, 12), '30 phút', { keepPhotos: [1, 2] }),
    p('thanh-dien-hai', 'Thành Điện Hải', 'van', 'Trung tâm', 'Di tích thành cũ ở trung tâm, gắn với lịch sử chống Pháp.', 'ifconv', 'Hợp người thích lịch sử.', m(1, 12), '30–45 phút', { keepPhotos: [1] }),
    p('cho-han', 'Chợ Hàn', 'cho', 'Trung tâm', 'Chợ lớn ven sông Hàn bán đồ ăn, quà biển và đồ lưu niệm.', 'ifconv', 'Mua quà và thử món địa phương, tiện cạnh sông Hàn.', m(1, 12), '1 giờ'),
    p('lang-da-non-nuoc', 'Làng đá mỹ nghệ Non Nước', 'cho', 'Ngũ Hành Sơn', 'Làng nghề điêu khắc đá dưới chân Ngũ Hành Sơn.', 'ifconv', 'Ghé xem nghề điêu khắc khi đi Ngũ Hành Sơn.', m(1, 12), '30–60 phút'),
  ],
};
