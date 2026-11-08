/** Số phút của một "ngày" tham quan khi catalog ghi theo ngày (GIẢ ĐỊNH 8 giờ, chỉ dùng để xếp lịch gợi ý). */
const DAY_MINUTES = 480;
const HALF_DAY_MINUTES = 240;
const HOUR_MINUTES = 60;
const MID = 2;

/** Đọc số (dấu phẩy thập phân kiểu Việt); không phải số thì null. */
function num(text: string): number | null {
  const value = Number(text.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/**
 * Đọc thời lượng tham quan từ nhãn của catalog ("1–2 giờ", "30–45 phút", "Nửa ngày", "1–2 ngày") thành số phút đại diện (trung điểm).
 * Nhãn lạ hoặc rỗng trả null: bên gọi nói rõ là thiếu căn cứ thay vì tự gán thời lượng.
 */
export function parseVisitMinutes(label: string | null | undefined): number | null {
  const text = (label ?? '').trim().toLowerCase().replace(/\s*\(tham khảo\)$/, '');
  if (!text) return null;
  if (text === 'cả ngày') return DAY_MINUTES;
  if (text === 'nửa ngày') return HALF_DAY_MINUTES;
  const m = /^(\d+(?:[.,]\d+)?)(?:\s*[–-]\s*(\d+(?:[.,]\d+)?))?\s*(giờ|phút|ngày)$/.exec(text);
  if (!m) return null;
  const low = num(m[1] as string);
  const high = m[2] ? num(m[2]) : low;
  if (low === null || high === null) return null;
  const unit = m[3] === 'ngày' ? DAY_MINUTES : m[3] === 'giờ' ? HOUR_MINUTES : 1;
  return Math.round(((low + high) / MID) * unit);
}
