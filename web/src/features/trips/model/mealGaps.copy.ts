/** Chữ và mặc định của nhắc nhẹ; không phải giờ bữa hay dữ kiện về quán. */
export const MEAL_GAPS_COPY = {
  note: 'Bạn có thể thêm mục ăn/nghỉ thủ công. Lịch chưa tính thời gian đường thực tế.',
  lunch: { title: 'Chưa có bữa trưa', action: 'Thêm bữa trưa', suggestedTitle: 'Ăn trưa', dismiss: 'Bỏ qua nhắc bữa trưa' },
  dinner: { title: 'Chưa có bữa tối', action: 'Thêm bữa tối', suggestedTitle: 'Ăn tối', dismiss: 'Bỏ qua nhắc bữa tối' },
  rest: { title: 'Chừa khoảng nghỉ', action: 'Thêm khoảng nghỉ', suggestedTitle: 'Nghỉ', dismiss: 'Bỏ qua nhắc nghỉ' },
  close: 'Đóng',
} as const;

export const MEAL_GAPS_RULES = {
  lunchPlaces: 3, restPlaces: 4, minutesPerHour: 60,
  noonStart: 11 * 60, noonEnd: 14 * 60, eveningStart: 18 * 60,
  storagePrefix: 'wander.web.meal-gaps.v1',
  foodCategories: ['am', 'food', 'cafe', 'coffee', 'restaurant', 'dining'],
} as const;
