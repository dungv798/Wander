// Rút gọn việc biên tập: place(mã, tiêu đề Wikipedia vi, loại, khu vực, lời dẫn, nhãn, lý do nhãn, tháng đẹp, thời lượng, phần thêm).
// Phần thêm: name (tên hiển thị khác tiêu đề), difficulty, slots, slotReason, highlights, tips, osm (truy vấn Nominatim nếu bài không có tọa độ).
export const place = (id, wiki, cat, area, hook, verdict, verdictReason, months, duration, extra = {}) => ({ id, wiki, cat, area, hook, verdict, verdictReason, months, duration, ...extra });

/** Các tháng liền nhau từ a đến b (có thể vòng qua tháng 12). */
export const months = (a, b) => {
  const out = [];
  for (let m = a; ; m = (m % 12) + 1) {
    out.push(m);
    if (m === b) return out;
  }
};
