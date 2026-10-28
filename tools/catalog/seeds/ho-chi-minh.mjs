// Seed biên tập TP. Hồ Chí Minh: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', region: 'Nam Bộ', tagline: 'Thành phố náo nhiệt với di tích, chợ và ẩm thực', coverPlaceId: 'nha-tho-duc-ba',
  references: [{ id: 'trung-tam-sai-gon', name: 'Trung tâm Sài Gòn', lat: 10.7769, lon: 106.7009, approximate: true }],
  season: { summary: 'Tháng 12–4 khô ráo, mát hơn; tháng 5–11 mưa chiều.', best: m(12, 4), rainy: m(5, 11), notes: ['Mùa khô khoảng tháng 12 đến tháng 4, ít mưa và dễ đi bộ.', 'Mùa mưa tháng 5–11, thường mưa vào chiều; mang áo mưa.'] },
  packing: { summary: 'Áo mưa, mũ nón, giày dễ đi, sạc dự phòng.', items: ['Áo mưa mỏng', 'Mũ nón', 'Giày dễ đi bộ', 'Kem chống nắng', 'Sạc dự phòng'] },
  places: [
    p('nha-tho-duc-ba', 'Nhà thờ Đức Bà Sài Gòn', 'van', 'Quận 1', 'Nhà thờ gạch đỏ nổi bật giữa trung tâm, đối diện Bưu điện Trung tâm.', 'must', 'Biểu tượng kiến trúc của thành phố, dễ ghé khi đi dạo trung tâm.', m(12, 4), '30–45 phút', { name: 'Nhà thờ Đức Bà' }),
    p('buu-dien-trung-tam', 'Bưu điện Trung tâm Sài Gòn', 'van', 'Quận 1', 'Bưu điện kiến trúc Pháp cổ với mái vòm và nội thất đẹp, vẫn đang hoạt động.', 'must', 'Đẹp và miễn phí để vào, nằm cạnh Nhà thờ Đức Bà.', m(12, 4), '30–45 phút'),
    p('dinh-doc-lap', 'Dinh Độc Lập', 'van', 'Quận 1', 'Dinh thự lịch sử với phòng làm việc, hầm và nhiều hiện vật.', 'must', 'Điểm lịch sử quan trọng của thành phố.', m(12, 4), '1,5–2 giờ', { slots: ['sang'] }),
    p('cho-ben-thanh', 'Chợ Bến Thành', 'cho', 'Quận 1', 'Chợ lớn trung tâm bán đồ lưu niệm, đồ ăn và hàng thủ công.', 'must', 'Mua quà và thử món ăn vặt, nổi tiếng với du khách.', m(1, 12), '1–2 giờ', { slots: ['sang', 'toi'] }),
    p('pho-di-bo-nguyen-hue', 'Đường Nguyễn Huệ, Thành phố Hồ Chí Minh', 'canh', 'Quận 1', 'Phố đi bộ rộng giữa trung tâm, nhiều hoạt động buổi tối và cuối tuần.', 'worth', 'Dạo chơi buổi tối, tiện nối các điểm trung tâm.', m(12, 4), '1–2 giờ', { name: 'Phố đi bộ Nguyễn Huệ', slots: ['chieu', 'toi'] }),
    p('nha-hat-thanh-pho', 'Nhà hát Thành phố Hồ Chí Minh', 'van', 'Quận 1', 'Nhà hát kiến trúc Pháp cổ giữa trung tâm, thường tổ chức biểu diễn.', 'ifconv', 'Đi ngang khi dạo trung tâm.', m(1, 12), '20–30 phút'),
    p('bao-tang-chung-tich-chien-tranh', 'Bảo tàng Chứng tích Chiến tranh', 'van', 'Quận 3', 'Bảo tàng trưng bày hiện vật và tư liệu về chiến tranh Việt Nam.', 'worth', 'Hiểu thêm lịch sử, có nội dung nặng nề.', m(1, 12), '1,5–2 giờ'),
    p('dia-dao-cu-chi', 'Địa đạo Củ Chi', 'van', 'Củ Chi', 'Hệ thống địa đạo thời chiến cách trung tâm khoảng 60 km.', 'worth', 'Một chuyến nửa ngày ngoài trung tâm, hiểu thêm lịch sử.', m(12, 4), '3–4 giờ', { slots: ['sang'] }),
    p('cho-lon', 'Chợ Lớn', 'cho', 'Quận 5', 'Khu người Hoa với chợ Bình Tây, chùa và quán ăn.', 'worth', 'Hợp ai thích khám phá phố chợ và ẩm thực.', m(12, 4), '2–3 giờ', { slots: ['sang', 'toi'] }),
    p('thao-cam-vien', 'Thảo Cầm Viên Sài Gòn', 'canh', 'Quận 1', 'Vườn thú và vườn thực vật lâu đời giữa thành phố.', 'ifconv', 'Hợp đi cùng gia đình.', m(12, 4), '2–3 giờ', { slots: ['sang'] }),
    p('landmark-81', 'Landmark 81', 'canh', 'Bình Thạnh', 'Tòa nhà cao nhất Việt Nam với đài quan sát toàn cảnh.', 'ifconv', 'Ngắm thành phố từ trên cao lúc hoàng hôn.', m(12, 4), '1–2 giờ', { slots: ['chieu', 'toi'] , keepPhotos: [1] }),
    p('chua-ngoc-hoang', 'Chùa Ngọc Hoàng (Thành phố Hồ Chí Minh)', 'van', 'Quận 1', 'Ngôi chùa cổ của người Hoa với nhiều tượng gỗ và khói hương.', 'ifconv', 'Hợp ai thích không khí chùa cổ.', m(1, 12), '30–45 phút', { name: 'Chùa Ngọc Hoàng' , keepPhotos: [1, 3] }),
    p('rung-ngap-man-can-gio', 'Khu dự trữ sinh quyển rừng ngập mặn Cần Giờ', 'canh', 'Cần Giờ', 'Rừng ngập mặn rộng, đi thuyền, xem khỉ và hệ sinh thái.', 'worth', 'Một chuyến nửa ngày ra khỏi trung tâm.', m(12, 4), '5–6 giờ', { name: 'Rừng ngập mặn Cần Giờ', slots: ['sang'] }),
  ],
};
