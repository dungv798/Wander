export const MEAL_SUGGEST_ENTRY_COPY = {
  suggest: 'Gợi ý quán gần lịch ngày này',
  manual: 'Tự nhập',
} as const;

export const MEAL_SUGGEST_COPY = {
  title: 'Gợi ý quán gần',
  manual: MEAL_SUGGEST_ENTRY_COPY.manual,
  close: 'Đóng',
  noCoordinates: 'Ngày này chưa có địa điểm có tọa độ',
  centroid: 'trọng tâm các điểm trong ngày',
  distance: 'Cách điểm {anchor} khoảng {distance} m',
  estimate: 'ƯỚC TÍNH đường chim bay, không phải quãng đường di chuyển.',
  hours: 'Giờ mở cửa (chưa kiểm tra): {raw}',
  empty: 'Chưa tìm thấy quán trong bán kính này.',
  error: 'Không tải được quán gần. Hãy thử lại.',
  rateLimited: 'Đã có quá nhiều yêu cầu. Vui lòng đợi một lát rồi thử lại.',
  retry: 'Thử lại',
  expand: 'Mở rộng 3 km',
  loading: 'Đang tìm quán gần…',
  attribution: 'Dữ liệu OpenStreetMap, chưa xác minh hiện trạng',
  license: '© OpenStreetMap contributors · ODbL',
  licenseUrl: 'https://www.openstreetmap.org/copyright',
  sourceNote: 'Nguồn: OpenStreetMap',
  kinds: { food: 'Quán ăn', cafe: 'Cà phê', fast_food: 'Ăn nhanh', bar: 'Quán bar', other: 'Quán khác' },
} as const;
