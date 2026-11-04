/** Ngưỡng xếp ngày gợi ý. Đều là GIẢ ĐỊNH để gợi ý, không phải sự thật về chuyến đi. */
export const PLAN_DAYS = {
  /** Tổng thời lượng tham quan gợi ý tối đa trong một ngày (phút); mục dài hơn tự chiếm trọn một ngày. */
  dayCapacityMin: 360,
  /** Hai nơi cách nhau (chim bay, km) quá ngưỡng này thì coi là hai cụm khác nhau, không dồn chung một ngày. */
  sameAreaKm: 20,
  /** Trọng số nội bộ khi nơi thiếu thời lượng: chỉ để đóng gói ngày, KHÔNG hiển thị như thời lượng thật. */
  unknownVisitMin: 90,
} as const;
