/** Chữ và mặc định của nhắc nhẹ; không phải giờ bữa hay dữ kiện về quán. */
export const MEAL_GAPS_COPY = {
  note: 'Chỉ là gợi ý; Wander không tự thêm gì vào lịch của bạn.',
  addEntry: 'Thêm ăn uống / nghỉ',
  addLabel: 'Chọn loại mục muốn thêm vào ngày này',
  lunch: { short: 'Bữa trưa', reason: 'Ngày này có nhiều điểm tham quan mà chưa có bữa trưa.', title: 'Chưa có bữa trưa', action: 'Thêm bữa trưa', suggestedTitle: 'Ăn trưa', dismiss: 'Bỏ qua nhắc bữa trưa' },
  dinner: { short: 'Bữa tối', reason: 'Lịch kéo dài đến tối mà chưa có bữa tối.', title: 'Chưa có bữa tối', action: 'Thêm bữa tối', suggestedTitle: 'Ăn tối', dismiss: 'Bỏ qua nhắc bữa tối' },
  rest: { short: 'Nghỉ', reason: 'Nhiều điểm liền nhau; có thể chừa một khoảng nghỉ.', title: 'Chừa khoảng nghỉ', action: 'Thêm khoảng nghỉ', suggestedTitle: 'Nghỉ', dismiss: 'Bỏ qua nhắc nghỉ' },
  close: 'Đóng',
} as const;

export const MEAL_GAPS_RULES = {
  lunchPlaces: 3, restPlaces: 4, minutesPerHour: 60,
  noonStart: 11 * 60, noonEnd: 14 * 60, eveningStart: 18 * 60,
  storagePrefix: 'wander.web.meal-gaps.v1',
  foodCategories: ['am', 'food', 'restaurant', 'dining'],
} as const;
