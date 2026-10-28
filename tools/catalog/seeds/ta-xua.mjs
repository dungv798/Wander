// Seed biên tập Tà Xùa (Sơn La): BẢN NHÁP chờ PO duyệt. Dữ liệu mở về vùng này RẤT THƯA; các mục chưa dựng được nên bổ sung ảnh/mô tả thủ công.
import { place as p, months as m } from './_lib.mjs';

export default {
  id: 'ta-xua', name: 'Tà Xùa', region: 'Tây Bắc', tagline: 'Săn mây trên sống lưng khủng long và những đỉnh núi Tây Bắc', coverPlaceId: 'ta-xua',
  radiusKm: 90,
  references: [{ id: 'ta-xua', name: 'Tà Xùa', lat: 21.3, lon: 104.4, approximate: true }],
  season: { summary: 'Tháng 10–4 dễ gặp biển mây; tháng 5–9 mưa nhiều, đường trơn.', best: m(10, 4), rainy: m(5, 9), notes: ['Mùa săn mây từ khoảng tháng 10 đến tháng 4, nhiều nhất vào sáng sớm.', 'Mùa mưa khoảng tháng 5–9, đường lên núi trơn và có nguy cơ sạt lở.'] },
  packing: { summary: 'Áo ấm, áo mưa, giày bám tốt, đèn pin.', items: ['Áo ấm dày', 'Áo mưa', 'Giày bám tốt', 'Đèn pin', 'Thuốc cá nhân'] },
  places: [
    p('ta-xua', 'Tà Xùa', 'leo', 'Bắc Yên', 'Dãy núi cao nổi tiếng với biển mây sáng sớm và đoạn sống lưng khủng long.', 'must', 'Lý do chính của chuyến đi, cảnh mây rất nổi tiếng với dân phượt.', m(10, 4), '1–2 ngày', { slots: ['sang'], slotReason: 'Biển mây thường rõ nhất lúc rạng sáng.', difficulty: 'Khó', tips: ['Khởi hành rất sớm, mang áo ấm và đèn pin.', 'Đường lên dốc và trơn khi mưa, không nên đi một mình.'] }),
    p('bac-yen', 'Bắc Yên', 'canh', 'Bắc Yên', 'Huyện miền núi là điểm xuất phát lên Tà Xùa, có chợ và quán ăn.', 'ifconv', 'Điểm nghỉ chân trước khi lên núi.', m(10, 4), '2–3 giờ', { name: 'Bắc Yên', slots: ['chieu'] , keepPhotos: [2] }),
    p('hang-doi-bac-yen', 'Hang Dơi (Sơn La)', 'canh', 'Sơn La', 'Hang động nhỏ trong vùng núi Sơn La.', 'ifconv', 'Hợp ai muốn thêm một điểm tham quan.', m(10, 4), '1 giờ', { name: 'Hang Dơi' }),
    p('moc-chau', 'Cao nguyên Mộc Châu', 'canh', 'Mộc Châu', 'Cao nguyên với đồi chè, đồng hoa và khí hậu mát quanh năm.', 'worth', 'Thường kết hợp đi cùng Tà Xùa trong một chuyến Tây Bắc.', m(11, 4), '1 ngày', { name: 'Mộc Châu', slots: ['sang', 'chieu'] }),
    p('thac-dai-yem', 'Thác Dải Yếm', 'canh', 'Mộc Châu', 'Thác cao đổ xuống như dải lụa giữa rừng thông.', 'worth', 'Một điểm cảnh đẹp ở Mộc Châu, dễ đi.', m(5, 10), '1–1,5 giờ'),
  ],
};
