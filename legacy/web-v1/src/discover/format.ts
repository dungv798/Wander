/** Thời gian đi ước tính: dưới 1 giờ làm tròn 15 phút, từ 1 giờ làm tròn 30 phút ("2,5 giờ"). */
export function formatTravel(minutes: number): string {
  if (minutes < 60) return `${Math.max(15, Math.round(minutes / 15) * 15)} phút`;
  const half = Math.round(minutes / 30) / 2;
  return `${String(half).replace('.', ',')} giờ`;
}

/** "Tháng 9–11" từ danh sách tháng liên tiếp; rỗng thì "Quanh năm". */
export function monthsLabel(months: number[]): string {
  if (months.length === 0) return 'Quanh năm';
  const first = months[0]!;
  const last = months[months.length - 1]!;
  return months.length === 1 ? `Tháng ${first}` : `Tháng ${first}–${last}`;
}

export const SLOTS: { code: string; label: string; icon: string }[] = [
  { code: 'sang', label: 'Sáng', icon: 'sunrise' },
  { code: 'trua', label: 'Trưa', icon: 'sun' },
  { code: 'chieu', label: 'Chiều', icon: 'sunset-2' },
  { code: 'toi', label: 'Tối', icon: 'moon-stars' },
];

export const CATEGORY_ICON: Record<string, string> = {
  canh: 'trees',
  van: 'columns',
  am: 'tools-kitchen-2',
  leo: 'mountain',
  luu: 'bed',
  cho: 'building-store',
};

export const VERDICT_ICON: Record<string, string> = { must: 'rosette-discount-check', worth: 'heart', ifconv: 'clock' };

/** Bỏ dấu tiếng Việt và hạ chữ hoa để so khớp khi tìm ("Đà Lạt" khớp "da lat"). */
export function plain(s: string): string {
  return s.replace(/đ/g, 'd').replace(/Đ/g, 'D').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
