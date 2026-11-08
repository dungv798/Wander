/** Ngưỡng xếp ngày gợi ý. Đều là GIẢ ĐỊNH để gợi ý, không phải sự thật về chuyến đi. */
export const PLAN_DAYS = {
  /** Cung dài hơn một ngày hoặc chưa rõ thời lượng phải được chốt tuyến trước khi gợi ý. */
  fullDayMin: 480,
  /** Tổng thời lượng tham quan gợi ý tối đa trong một ngày (phút); mục dài hơn tự chiếm trọn một ngày. */
  dayCapacityMin: 360,
  /** Ngân sách tổng giả định cho ghé + di chuyển: 8 giờ; không phải khung giờ bắt đầu/kết thúc đã xác nhận. */
  dayTotalMin: 480,
  /** Hai nơi cách nhau (chim bay, km) quá ngưỡng này thì coi là hai cụm khác nhau, không dồn chung một ngày. */
  sameAreaKm: 20,
  /** Trọng số nội bộ khi nơi thiếu thời lượng: chỉ để đóng gói ngày, KHÔNG hiển thị như thời lượng thật. */
  unknownVisitMin: 90,
  /** Giả định nội bộ khi thiếu thời lượng, KHÔNG hiển thị thành số phút đã xác minh. */
  unknownByKind: { sightseeing: 90, tour: 90, food: 60, rest: 30, task: 15, shopping: 60, transport: 60, lodging: 30, car_rental: 30 },
} as const;
