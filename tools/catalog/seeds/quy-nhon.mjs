// Seed biên tập Quy Nhơn: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'quy-nhon', name: 'Quy Nhơn', region: 'Nam Trung Bộ', tagline: 'Biển Kỳ Co, Eo Gió, tháp Chăm và những bãi đá', coverPlaceId: 'ky-co',
  references: [{ id: 'trung-tam-quy-nhon', name: 'Trung tâm Quy Nhơn', lat: 13.7765, lon: 109.2237, approximate: true }],
  season: { summary: 'Tháng 1–8 nắng đẹp, biển trong; tháng 9–12 mưa nhiều và biển động.', best: m(1, 8), rainy: m(9, 12), notes: ['Khoảng tháng 1 đến tháng 8 trời nắng, biển êm, hợp đi đảo và tắm biển.', 'Tháng 9–12 mưa nhiều, biển động, tàu ra đảo có thể bị hoãn.'] },
  packing: { summary: 'Đồ bơi, kem chống nắng, mũ nón, áo mưa mỏng.', items: ['Đồ bơi', 'Kem chống nắng', 'Mũ nón, kính râm', 'Áo mưa mỏng', 'Dép đi biển'] },
  places: [
    p('ky-co', 'Kỳ Co', 'canh', 'Nhơn Lý', 'Bãi biển nước trong với bờ cát trắng và đá, đi canô từ Nhơn Lý hoặc đi đường bộ.', 'must', 'Cảnh biển nổi bật nhất vùng, thường là điểm chính của chuyến đi.', m(2, 8), '4–6 giờ', { slots: ['sang'], slotReason: 'Sáng biển êm và trong, canô thường chạy buổi sáng.' }),
    p('eo-gio', 'Eo Gió', 'canh', 'Nhơn Lý', 'Vách đá nhìn ra biển với con đường bậc thang và bãi đá trắng.', 'must', 'Cảnh đẹp, dễ đi, rất hợp ngắm hoàng hôn hoặc bình minh.', m(2, 8), '1–1,5 giờ', { slots: ['sang', 'chieu'], slotReason: 'Bình minh và chiều muộn lên ảnh đẹp, nắng trưa gắt.' }),
    p('thap-doi', 'Tháp Đôi', 'van', 'Trung tâm', 'Cụm tháp Chăm đôi giữa phố, kiến trúc gạch đỏ đặc trưng.', 'worth', 'Dễ ghé, nằm ngay thành phố, hiểu thêm văn hóa Chăm.', m(1, 12), '30–45 phút'),
    p('ghenh-rang', 'Ghềnh Ráng', 'canh', 'Ghềnh Ráng', 'Bãi đá ven biển, nơi nhà thơ Hàn Mặc Tử yên nghỉ, có nhiều góc ngắm biển.', 'worth', 'Cảnh biển và nơi mang dấu ấn văn học địa phương.', m(2, 8), '1–1,5 giờ', { name: 'Ghềnh Ráng' }),
    p('hon-kho', 'Hòn Khô', 'canh', 'Nhơn Hải', 'Làng chài nhỏ với bãi cát, đá và nước biển trong.', 'worth', 'Yên tĩnh hơn Kỳ Co, hợp ai thích cảnh làng chài.', m(2, 8), '2–3 giờ', { slots: ['sang'] }),
    p('bai-xep', 'Bãi Xép', 'canh', 'Ghềnh Ráng', 'Bãi nhỏ giữa đá, quen thuộc với dân chụp ảnh.', 'ifconv', 'Hợp ai thích chụp ảnh và nơi yên tĩnh.', m(2, 8), '1 giờ', { slots: ['sang'] }),
    p('thien-vien-truc-lam-chanh-giac', 'Thiền viện Trúc Lâm Chánh Giác', 'van', 'Phía Tây', 'Thiền viện trên đồi, không gian yên tĩnh, nhìn xuống thành phố.', 'ifconv', 'Hợp ai thích nơi tĩnh lặng.', m(1, 12), '1 giờ'),
    p('thap-banh-it', 'Tháp Bánh Ít', 'van', 'Tuy Phước', 'Cụm tháp Chăm cổ trên đồi nhỏ, nhìn ra cánh đồng.', 'ifconv', 'Hợp ai thích kiến trúc Chăm, cách trung tâm khoảng nửa giờ.', m(1, 12), '45 phút'),
    p('bao-tang-quang-trung', 'Bảo tàng Quang Trung', 'van', 'Tây Sơn', 'Bảo tàng về vua Quang Trung và phong trào Tây Sơn.', 'ifconv', 'Hợp ai muốn tìm hiểu lịch sử địa phương.', m(1, 12), '1 giờ', { keepPhotos: [1, 3] }),
    p('dam-thi-nai', 'Đầm Thị Nại', 'canh', 'Phía Nam', 'Đầm lớn phía nam thành phố, có cầu vượt biển và làng chài.', 'ifconv', 'Hợp ai thích ngắm cảnh đầm phá lúc chiều.', m(1, 12), '1–2 giờ', { slots: ['chieu'] , keepPhotos: [1] }),
    p('bai-bien-quy-nhon', 'Bãi biển Quy Nhơn', 'canh', 'Trung tâm', 'Bãi cát cong ngay trung tâm, tắm biển và đi dạo.', 'worth', 'Dễ đi, hợp buổi sáng hoặc chiều muộn.', m(2, 8), '2 giờ', { slots: ['sang', 'chieu'] }),
    p('cu-lao-xanh', 'Cù lao Xanh', 'canh', 'Nhơn Châu', 'Đảo nhỏ ngoài khơi với biển trong và bãi đá, có thể ở lại qua đêm.', 'worth', 'Hợp ai muốn đi xa hơn và nghỉ qua đêm trên đảo.', m(3, 8), '1–2 ngày', { slots: ['sang'] }),
    p('thap-duong-long', 'Tháp Dương Long', 'van', 'Tây Sơn', 'Cụm ba tháp Chăm cao nhất Việt Nam, kiến trúc gạch đỏ.', 'worth', 'Di tích Chăm ấn tượng, cách trung tâm khoảng một giờ.', m(1, 12), '1 giờ', { slots: ['sang', 'chieu'] }),
    p('thap-canh-tien', 'Tháp Cánh Tiên', 'van', 'An Nhơn', 'Tháp Chăm cổ trên đồi, nhìn xuống cánh đồng.', 'ifconv', 'Hợp ai thích kiến trúc Chăm.', m(1, 12), '45 phút', { keepPhotos: [1, 3] }),
    p('thanh-do-ban', 'Thành Đồ Bàn', 'van', 'An Nhơn', 'Thành cổ của Chăm Pa, còn cổng thành và tường gạch.', 'ifconv', 'Hợp ai thích lịch sử.', m(1, 12), '1 giờ'),
    p('chua-thap-thap', 'Chùa Thập Tháp', 'van', 'Nhơn Thành', 'Ngôi chùa cổ có mười tòa tháp nhỏ, yên tĩnh.', 'ifconv', 'Hợp ai thích nơi yên tĩnh.', m(1, 12), '45 phút'),
  ],
};
