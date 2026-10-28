// Seed biên tập Vĩnh Hy (Ninh Thuận): BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'vinh-hy', name: 'Vĩnh Hy', region: 'Nam Trung Bộ', tagline: 'Vịnh biển xanh, đồi cát và làng Chăm vùng nắng gió', coverPlaceId: 'vinh-vinh-hy',
  references: [{ id: 'vinh-hy', name: 'Vịnh Vĩnh Hy', lat: 11.7, lon: 109.2, approximate: true }],
  season: { summary: 'Tháng 1–8 nắng nhiều, biển trong; tháng 9–11 có mưa.', best: m(1, 8), rainy: m(9, 11), notes: ['Khu vực khô nóng, ít mưa; tháng 1 đến tháng 8 thời tiết hợp đi biển.', 'Tháng 9–11 có mưa; vẫn nắng nhiều so với nơi khác.'] },
  packing: { summary: 'Mũ nón, kem chống nắng, đồ bơi, nhiều nước.', items: ['Mũ nón, kính râm', 'Kem chống nắng', 'Đồ bơi', 'Nước uống', 'Giày bám tốt'] },
  places: [
    p('vinh-vinh-hy', 'Vịnh Vĩnh Hy', 'canh', 'Vĩnh Hải', 'Vịnh nhỏ nước xanh trong giữa núi, đi cano hoặc lặn ngắm san hô.', 'must', 'Cảnh biển nổi bật nhất của vùng, nơi chính của chuyến đi.', m(2, 8), '4–6 giờ', { slots: ['sang'] }),
    p('doi-cat-nam-cuong', 'Đồi cát Nam Cương', 'canh', 'Phước Dinh', 'Đồi cát vàng rộng cạnh biển, nơi nhiều người chụp ảnh lúc sáng và chiều.', 'worth', 'Cảnh sa mạc thu nhỏ, đẹp nhất lúc bình minh và hoàng hôn.', m(1, 8), '1–2 giờ', { slots: ['sang', 'chieu'], slotReason: 'Bình minh và chiều muộn nắng dịu, cát lên màu đẹp.' }),
    p('thap-po-klong-garai', 'Tháp Po Klong Garai', 'van', 'Phan Rang – Tháp Chàm', 'Cụm tháp Chăm cổ trên đồi nhìn xuống thành phố, còn tổ chức lễ hội.', 'must', 'Di tích Chăm nổi bật nhất vùng và dễ đi.', m(1, 12), '1 giờ', { keepPhotos: [1] }),
    p('lang-gom-bau-truc', 'Bàu Trúc', 'cho', 'Phước Dân', 'Làng gốm Chăm làm thủ công, không dùng bàn xoay.', 'worth', 'Hiểu thêm về nghề gốm Chăm, có thể mua quà.', m(1, 12), '1 giờ'),
    p('vuon-quoc-gia-nui-chua', 'Vườn quốc gia Núi Chúa', 'leo', 'Thanh Hải', 'Vườn quốc gia có rừng khô và các đường đi bộ ra biển.', 'ifconv', 'Hợp ai thích đi bộ ngắm hệ sinh thái khô nóng.', m(1, 8), '4–6 giờ', { slots: ['sang'], difficulty: 'Vừa' , keepPhotos: [1, 2] }),
    p('hang-rai', 'Hang Rái', 'canh', 'Thanh Hải', 'Khu bờ biển đá với bãi và hang nhỏ, có cừu và dê sống hoang.', 'ifconv', 'Hợp ai thích cảnh hoang sơ.', m(2, 8), '1–2 giờ', { slots: ['sang', 'chieu'] }),
    p('bai-bien-ninh-chu', 'Ninh Chữ', 'canh', 'Ninh Hải', 'Bãi biển dài và nhiều khu nghỉ dưỡng, nước trong.', 'worth', 'Dễ đi, hợp nghỉ biển.', m(2, 8), '2–3 giờ', { name: 'Biển Ninh Chữ', slots: ['sang', 'chieu'] , keepPhotos: [] }),
    p('ca-na', 'Cà Ná', 'canh', 'Thuận Nam', 'Bãi biển có đá lớn và đồi cạnh quốc lộ, nổi tiếng với hoàng hôn.', 'ifconv', 'Hợp ai đi dọc đường biển và muốn dừng chụp ảnh.', m(2, 8), '1 giờ', { slots: ['chieu'] }),
    p('thap-hoa-lai', 'Tháp Hòa Lai', 'van', 'Bác Ái', 'Cụm tháp Chăm gạch đỏ cổ giữa vùng đất khô, vẫn còn nguyên nhiều chi tiết.', 'ifconv', 'Hợp ai thích kiến trúc Chăm.', m(1, 12), '45 phút'),
    p('thap-po-rome', 'Tháp Pô Rômê', 'van', 'Ninh Phước', 'Tháp Chăm cuối cùng được xây trên vùng này, nằm trên đồi nhỏ.', 'ifconv', 'Hợp ai thích lịch sử Chăm.', m(1, 12), '45 phút'),
  ],
};
