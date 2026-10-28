// Seed biên tập Hội An: BẢN NHÁP chờ PO duyệt. Dữ kiện (tọa độ, mô tả, ảnh) do build-catalog.mjs tra từ dữ liệu mở.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'hoi-an', name: 'Hội An', region: 'Trung Bộ', tagline: 'Phố cổ đèn lồng, nhà cổ và làng nghề ven sông Hoài', coverPlaceId: 'pho-co-hoi-an',
  references: [{ id: 'trung-tam-hoi-an', name: 'Phố cổ Hội An', lat: 15.8801, lon: 108.338, approximate: true }],
  season: { summary: 'Tháng 2–4 dễ chịu, ít mưa; tháng 10–11 có thể ngập vì mưa lũ.', best: m(2, 4), rainy: m(9, 12), notes: ['Khoảng tháng 2 đến tháng 4 trời mát và nắng nhẹ, hợp đi dạo phố cổ.', 'Tháng 10–11 mưa nhiều, phố cổ có thể ngập nhẹ; kiểm tra tình hình trước khi đi.'] },
  packing: { summary: 'Giày dễ đi, áo mưa mỏng, mũ nón.', items: ['Giày dễ đi bộ', 'Áo mưa mỏng', 'Mũ nón', 'Kem chống nắng', 'Tiền mặt nhỏ'] },
  places: [
    p('pho-co-hoi-an', 'Phố cổ Hội An', 'van', 'Phố cổ', 'Khu phố cổ với nhà gỗ, đèn lồng và các con hẻm nhỏ ven sông Hoài, đẹp nhất lúc chiều tối.', 'must', 'Lý do chính nhiều người tới Hội An, nên dành ít nhất nửa ngày.', m(2, 8), '3–4 giờ', { slots: ['chieu', 'toi'], slotReason: 'Chiều tối đèn lồng lên, nhưng sáng sớm lại vắng và dễ chụp ảnh.', tips: ['Hỏi giá vé tham quan tại quầy.', 'Mang tiền mặt nhỏ.'] }),
    p('chua-cau-hoi-an', 'Chùa Cầu (Hội An)', 'van', 'Phố cổ', 'Cây cầu mái ngói bắc qua con lạch nhỏ, biểu tượng của Hội An.', 'must', 'Nằm ngay trong phố cổ, cảnh quen thuộc nhất của thành phố.', m(1, 12), '30 phút', { name: 'Chùa Cầu' }),
    p('hoi-quan-phuc-kien', 'Hội quán Phúc Kiến (Hội An)', 'van', 'Phố cổ', 'Hội quán của người Hoa Phúc Kiến với cổng lớn và sân vườn nhiều chi tiết gỗ.', 'worth', 'Thấy rõ ảnh hưởng văn hóa Hoa trong phố cổ.', m(1, 12), '30–45 phút', { name: 'Hội quán Phúc Kiến' }),
    p('nha-co-tan-ky', 'Nhà cổ Tấn Ký', 'van', 'Phố cổ', 'Ngôi nhà gỗ hơn hai trăm năm tuổi, giữ nhiều đồ nội thất cổ.', 'worth', 'Hiểu về nếp nhà phố cổ qua một ngôi nhà còn nguyên vẹn.', m(1, 12), '30 phút'),
    p('nha-co-phung-hung', 'Nhà cổ Phùng Hưng', 'van', 'Phố cổ', 'Nhà cổ có kiến trúc kết hợp Nhật, Hoa và Việt, nằm gần Chùa Cầu.', 'ifconv', 'Tiện ghé khi đã đi dạo phố cổ.', m(1, 12), '30 phút'),
    p('rung-dua-bay-mau', 'Rừng dừa Bảy Mẫu', 'canh', 'Cẩm Thanh', 'Rừng dừa nước, đi thuyền thúng len qua những kênh nhỏ.', 'worth', 'Trải nghiệm khác phố cổ, kết hợp được cùng ngày.', m(2, 8), '1,5–2 giờ', { slots: ['sang', 'chieu'] }),
    p('lang-gom-thanh-ha', 'Làng gốm Thanh Hà', 'cho', 'Thanh Hà', 'Làng gốm cổ, có thể xem và tự tay nhào đất.', 'ifconv', 'Hợp đi cùng trẻ nhỏ hoặc ai thích làm thủ công.', m(1, 12), '1–1,5 giờ'),
    p('bai-bien-an-bang', 'Bãi biển An Bàng', 'canh', 'An Bàng', 'Bãi biển yên tĩnh cách phố cổ vài km, nhiều quán ven biển.', 'worth', 'Dễ kết hợp với một ngày dạo phố cổ.', m(2, 8), '2–3 giờ', { slots: ['sang', 'chieu'] }),
    p('cu-lao-cham', 'Cù Lao Chàm', 'canh', 'Cù Lao Chàm', 'Cụm đảo nhỏ với biển trong, lặn ngắm san hô và làng chài.', 'worth', 'Một chuyến đi ngày hoặc ở lại qua đêm, nhiều người ưa vì yên tĩnh.', m(3, 8), '1 ngày', { slots: ['sang'], tips: ['Biển động thì tàu có thể không chạy.', 'Mang thuốc say sóng.'] , keepPhotos: [1] }),
    p('thanh-dia-my-son', 'Thánh địa Mỹ Sơn', 'van', 'Duy Xuyên', 'Quần thể đền tháp Chăm trong thung lũng, di sản văn hóa thế giới.', 'must', 'Di tích Chăm quan trọng nhất miền Trung, cách Hội An khoảng một giờ.', m(1, 12), '2–3 giờ', { slots: ['sang'], slotReason: 'Đi sáng sớm để tránh nắng gắt và tour đông.' }),
    p('lang-rau-tra-que', 'Làng rau Trà Quế', 'cho', 'Trà Quế', 'Làng trồng rau thơm truyền thống, có lớp nấu ăn và đạp xe quanh làng.', 'ifconv', 'Hợp ai thích ẩm thực, lớp nấu ăn nhẹ.', m(1, 12), '2 giờ'),
    p('chua-ong-hoi-an', 'Miếu Quan Công (Hội An)', 'van', 'Phố cổ', 'Miếu nhỏ nằm trong phố cổ, thờ Quan Công.', 'ifconv', 'Ghé nhanh khi đi dạo.', m(1, 12), '20–30 phút', { name: 'Miếu Quan Công' }),
    p('bai-bien-cua-dai', 'Bãi biển Cửa Đại', 'canh', 'Cửa Đại', 'Bãi cát dài nhìn ra cửa sông Thu Bồn, có nhiều quán ven biển.', 'ifconv', 'Hợp nghỉ biển, cách phố cổ khoảng vài km.', m(2, 8), '2–3 giờ', { slots: ['sang', 'chieu'] }),
    p('hoi-quan-quang-dong', 'Hội quán Quảng Đông', 'van', 'Phố cổ', 'Hội quán của người Hoa Quảng Đông với sân vườn và cổng trang trí rực rỡ.', 'ifconv', 'Tiện ghé khi đi dạo phố cổ.', m(1, 12), '20–30 phút'),
    p('chua-phuoc-lam', 'Chùa Phước Lâm', 'van', 'Cẩm Phô', 'Ngôi chùa cổ yên tĩnh trong khu vườn ở ngoại vi phố cổ.', 'ifconv', 'Hợp ai thích nơi yên tĩnh, ít khách.', m(1, 12), '30–45 phút'),
    p('bao-tang-sa-huynh', 'Bảo tàng Văn hóa Sa Huỳnh', 'van', 'Phố cổ', 'Bảo tàng nhỏ về văn hóa Sa Huỳnh với những hiện vật khảo cổ.', 'ifconv', 'Hợp ngày mưa, tìm hiểu lịch sử vùng đất.', m(1, 12), '30–45 phút'),
    p('cho-hoi-an', 'Chợ Hội An', 'cho', 'Phố cổ', 'Chợ ven sông Hoài, bán rau củ, hải sản và các món ăn địa phương.', 'worth', 'Thử món ăn địa phương, hợp đi sáng sớm.', m(1, 12), '1 giờ', { slots: ['sang'] }),
    p('hoi-quan-trieu-chau', 'Hội quán Triều Châu', 'van', 'Phố cổ', 'Hội quán của người Hoa Triều Châu với nhiều chi tiết chạm khắc gỗ.', 'ifconv', 'Hợp ai thích kiến trúc cổ.', m(1, 12), '20–30 phút'),
  ],
};
