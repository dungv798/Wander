// Seed biên tập Phú Yên: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'phu-yen', name: 'Phú Yên', region: 'Nam Trung Bộ', tagline: 'Gành Đá Đĩa, Mũi Điện và những vịnh biển yên bình', coverPlaceId: 'ganh-da-dia',
  references: [{ id: 'trung-tam-tuy-hoa', name: 'Tuy Hòa', lat: 13.0882, lon: 109.0929, approximate: true }],
  season: { summary: 'Tháng 1–8 nắng đẹp; tháng 9–12 mưa nhiều và có thể có bão.', best: m(1, 8), rainy: m(9, 12), notes: ['Khoảng tháng 1 đến tháng 8 trời nắng, biển đẹp.', 'Tháng 9–12 mưa nhiều, biển động; theo dõi dự báo khi ra đảo.'] },
  packing: { summary: 'Mũ nón, kem chống nắng, giày bám, áo mưa mỏng.', items: ['Mũ nón, kính râm', 'Kem chống nắng', 'Giày bám tốt', 'Áo mưa mỏng', 'Đồ bơi'] },
  places: [
    p('ganh-da-dia', 'Gành Đá Đĩa', 'canh', 'An Ninh Đông', 'Vách đá bazan xếp thành những cột lục giác như chồng đĩa sát biển.', 'must', 'Cảnh địa chất rất đặc biệt, điểm nổi bật nhất của Phú Yên.', m(1, 8), '1–1,5 giờ', { slots: ['sang', 'chieu'], slotReason: 'Sáng sớm hoặc chiều muộn ít nắng và đông; đá có thể trơn khi sóng lớn.', tips: ['Đá trơn, mang giày bám tốt.', 'Tránh đi khi sóng lớn.'] }),
    p('mui-dien', 'Mũi Điện', 'canh', 'Hòa Xuân Nam', 'Điểm cực Đông trên đất liền với ngọn hải đăng và cảnh biển rộng.', 'must', 'Có thể đón bình minh sớm nhất cả nước, view biển rất đẹp.', m(1, 8), '2–3 giờ', { slots: ['sang'], slotReason: 'Bình minh là thời điểm nhiều người đến.', difficulty: 'Vừa', tips: ['Đường lên khá dốc, nên mang nước.', 'Khởi hành sớm nếu muốn đón bình minh.'] }),
    p('vinh-xuan-dai', 'Vịnh Xuân Đài', 'canh', 'Sông Cầu', 'Vịnh lớn với nhiều đảo nhỏ, đầm và các làng chài.', 'worth', 'Cảnh biển yên bình, hợp ai thích nơi ít khách.', m(1, 8), '3–4 giờ', { slots: ['sang', 'chieu'] }),
    p('thap-nhan', 'Tháp Nhạn', 'van', 'Tuy Hòa', 'Tháp Chăm cổ trên đồi nhỏ cạnh sông Đà Rằng, nhìn xuống thành phố.', 'worth', 'Nằm ngay thành phố, tiện ghé và có view đẹp lúc chiều.', m(1, 12), '45–60 phút', { slots: ['chieu'] }),
    p('bai-xep-phu-yen', 'Bãi Xép', 'canh', 'Tuy Hòa', 'Bãi biển nhỏ yên tĩnh với đá ven bờ, nổi lên nhờ phim ảnh.', 'ifconv', 'Hợp ai thích chụp ảnh và nơi yên tĩnh.', m(2, 8), '1–2 giờ', { name: 'Bãi Xép' }),
    p('nui-da-bia', 'Núi Đá Bia', 'leo', 'Tuy An', 'Ngọn núi đá cao nhìn xuống đồng bằng và biển, có đường đi bộ lên đỉnh.', 'ifconv', 'Hợp ai thích leo nhẹ và ngắm cảnh rộng.', m(1, 8), '3–4 giờ', { slots: ['sang'], difficulty: 'Vừa' }),
    p('nha-tho-mang-lang', 'Nhà thờ Mằng Lăng', 'van', 'Tuy Hòa', 'Nhà thờ cổ với kiến trúc Gothic ở ngoại ô thành phố.', 'ifconv', 'Hợp ai thích kiến trúc.', m(1, 12), '30–45 phút'),
    p('dam-o-loan', 'Đầm Ô Loan', 'canh', 'Tuy An', 'Đầm nước lợ rộng, nổi tiếng với hải sản và cảnh chiều.', 'worth', 'Cảnh đẹp lúc chiều và có món hải sản địa phương.', m(1, 12), '1,5–2 giờ', { slots: ['chieu'] }),
    p('deo-ca', 'Đèo Cả', 'canh', 'Đông Hòa', 'Đèo ven biển nối Phú Yên và Khánh Hòa, cung đường nhìn xuống biển.', 'ifconv', 'Hợp ai đi đường dài qua Phú Yên.', m(1, 8), '30–60 phút'),
    p('thap-ba-phu-yen', 'Hòn Yến', 'canh', 'Tuy An', 'Đảo nhỏ ngoài khơi, nơi có tổ yến và vách đá.', 'ifconv', 'Hợp ai thích cảnh đảo hoang sơ.', m(2, 8), '3–4 giờ', { name: 'Hòn Yến', slots: ['sang'] }),
  ],
};
