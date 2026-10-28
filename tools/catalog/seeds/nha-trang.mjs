// Seed biên tập Nha Trang: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'nha-trang', name: 'Nha Trang', region: 'Nam Trung Bộ', tagline: 'Biển xanh, đảo và những tháp Chăm cổ', coverPlaceId: 'vinh-nha-trang',
  references: [{ id: 'trung-tam-nha-trang', name: 'Trung tâm Nha Trang', lat: 12.2388, lon: 109.1967, approximate: true }],
  season: { summary: 'Tháng 1–8 nắng nhiều, biển đẹp; tháng 10–12 dễ có mưa và bão.', best: m(1, 8), rainy: m(9, 12), notes: ['Mùa khô nắng đẹp kéo dài khoảng tháng 1 đến tháng 8; biển êm hợp đi đảo.', 'Khoảng tháng 9–12 mưa nhiều và biển động, tàu ra đảo có thể bị hoãn; theo dõi dự báo.'] },
  packing: { summary: 'Đồ bơi, kem chống nắng, áo mưa mỏng.', items: ['Đồ bơi', 'Kem chống nắng', 'Mũ nón, kính râm', 'Áo mưa mỏng', 'Thuốc say sóng'] },
  places: [
    p('vinh-nha-trang', 'Vịnh Nha Trang', 'canh', 'Vịnh Nha Trang', 'Đi tàu qua các đảo trong vịnh, tắm biển và lặn ngắm san hô.', 'must', 'Biểu tượng của Nha Trang, hầu hết lịch trình đều có một buổi trên vịnh.', m(1, 8), '1 ngày', { slots: ['sang'], slotReason: 'Tàu thường khởi hành buổi sáng; biển êm nhất lúc sáng.', tips: ['Đặt tour có giá và lịch trình rõ ràng.', 'Mang thuốc say sóng nếu dễ say.'] }),
    p('bai-bien-nha-trang', 'Bãi biển Nha Trang', 'canh', 'Trung tâm', 'Bãi cát dài ngay trung tâm, tắm biển buổi sáng và dạo quanh đường biển lúc chiều tối.', 'must', 'Ngay trung tâm, dễ tiếp cận và hợp mọi lứa tuổi.', m(1, 8), '2–3 giờ', { slots: ['sang', 'chieu'], slotReason: 'Sáng sớm biển trong, chiều muộn mát để dạo bộ.' }),
    p('thap-ba-ponagar', 'Tháp Bà Ponagar', 'van', 'Phía Bắc', 'Cụm tháp Chăm cổ trên đồi nhìn ra sông Cái, vẫn còn người đến cúng lễ.', 'must', 'Di tích Chăm nổi bật nhất thành phố, gần trung tâm.', m(1, 12), '1–1,5 giờ'),
    p('hon-chong', 'Hòn Chồng', 'canh', 'Phía Bắc', 'Bãi đá lớn ra biển, nơi nhiều người đến ngắm bình minh và chụp ảnh.', 'worth', 'Cảnh đá biển độc đáo, tiện ghé trên đường tới tháp Bà Ponagar.', m(1, 8), '1 giờ', { name: 'Hòn Chồng', slots: ['sang'], slotReason: 'Ngắm bình minh và tránh nắng gắt.' }),
    p('nha-tho-nui', 'Nhà thờ Chánh tòa Nha Trang', 'van', 'Trung tâm', 'Nhà thờ đá trên đồi nhỏ giữa phố, kiến trúc Gothic nổi bật.', 'ifconv', 'Nằm ngay trung tâm, tiện đi ngang.', m(1, 12), '30–45 phút', { name: 'Nhà thờ Núi' , keepPhotos: [1, 3] }),
    p('chua-long-son', 'Chùa Long Sơn', 'van', 'Trung tâm', 'Ngôi chùa có tượng Phật trắng lớn trên đồi, nhìn xuống thành phố.', 'worth', 'View rộng thành phố và dễ đi trong ngày.', m(1, 12), '1 giờ', { slots: ['sang', 'chieu'] }),
    p('vien-hai-duong-hoc', 'Viện Hải dương học Nha Trang', 'van', 'Phía Nam', 'Bảo tàng sinh vật biển, có bể trưng bày và mẫu vật; hợp đi cùng gia đình.', 'ifconv', 'Hợp ngày mưa hoặc đi cùng trẻ nhỏ.', m(1, 12), '1–2 giờ'),
    p('thanh-co-dien-khanh', 'Thành cổ Diên Khánh', 'van', 'Diên Khánh', 'Thành cổ nhỏ ở phía tây thành phố, còn bốn cổng thành và hào nước.', 'ifconv', 'Hợp người thích lịch sử, cách trung tâm khoảng nửa giờ.', m(1, 12), '1–1,5 giờ'),
    p('hon-mun', 'Hòn Mun', 'canh', 'Vịnh Nha Trang', 'Khu bảo tồn biển nổi tiếng để lặn ngắm san hô.', 'worth', 'Điểm lặn nổi bật nhất vịnh, thường nằm trong tour đảo.', m(2, 8), '1 ngày', { slots: ['sang'], difficulty: 'Vừa' }),
    p('hon-tam', 'Hòn Tằm', 'canh', 'Vịnh Nha Trang', 'Đảo có bãi tắm, các trò chơi biển và dịch vụ nghỉ.', 'ifconv', 'Phù hợp ai muốn nghỉ ngơi và chơi nước trên đảo.', m(1, 8), '4–6 giờ', { slots: ['sang'] }),
    p('binh-ba', 'Bình Ba', 'canh', 'Cam Ranh', 'Đảo nhỏ nổi tiếng với tôm hùm và hải sản, biển còn khá hoang sơ.', 'worth', 'Hợp ai muốn đi xa hơn các đảo tour chính, có thể ở lại qua đêm.', m(2, 8), '1–2 ngày', { slots: ['sang'] }),
    p('bao-tang-yersin', 'Bảo tàng Alexandre Yersin', 'van', 'Trung tâm', 'Bảo tàng nhỏ về bác sĩ Yersin và những nghiên cứu y học ở Nha Trang.', 'ifconv', 'Ngắn gọn, hợp ngày mưa.', m(1, 12), '45 phút'),
    p('hon-khoi', 'Hòn Khói', 'canh', 'Ninh Hòa', 'Vùng đồng muối và bãi biển yên tĩnh phía bắc Nha Trang.', 'ifconv', 'Hợp ai thích chụp ảnh và nơi ít đông.', m(2, 7), '2–3 giờ', { osm: 'Hòn Khói, Ninh Hòa, Khánh Hòa' }),
    p('chua-ba-thap-tram-huong', 'Tháp Trầm Hương', 'van', 'Trung tâm', 'Tòa tháp hình búp sen nổi bật bên đường biển, một trong những biểu tượng của thành phố.', 'ifconv', 'Dễ ghé khi đi dạo đường biển.', m(1, 12), '20–30 phút'),
    p('hon-tre', 'Hòn Tre', 'canh', 'Vịnh Nha Trang', 'Đảo lớn nhất vịnh, có khu nghỉ dưỡng và bãi biển.', 'ifconv', 'Hợp ai muốn nghỉ ngơi ở đảo.', m(1, 8), '4–6 giờ', { slots: ['sang'] , keepPhotos: [1] }),
    p('dao-diep-son', 'Điệp Sơn', 'canh', 'Vạn Ninh', 'Con đường nhỏ nổi lên giữa biển lúc triều xuống, nối các đảo nhỏ.', 'worth', 'Cảnh biển rất lạ, cần xem giờ thủy triều.', m(2, 8), '4–6 giờ', { name: 'Đảo Điệp Sơn', slots: ['sang'], tips: ['Xem lịch thủy triều trước khi đi.', 'Mang giày dép đi nước.'] }),
    p('cho-dam-nha-trang', 'Chợ Đầm', 'cho', 'Trung tâm', 'Chợ lớn nhất Nha Trang, bán hải sản khô, đặc sản và đồ lưu niệm.', 'ifconv', 'Mua quà và thử món ăn vặt.', m(1, 12), '1 giờ'),
  ],
};
