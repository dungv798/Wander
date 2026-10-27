/** Chữ của tính năng "Lịch mẫu" (N-2, DR-018): nội dung là BẢN NHÁP có nhãn cho tới khi PO duyệt từng lịch. */
export const TEMPLATES_COPY = {
  section: 'Lịch mẫu để bắt đầu',
  sectionNote: 'Gợi ý ghép sẵn từ các nơi có trong cẩm nang. Bạn chỉnh được mọi thứ.',
  draft: 'Bản nháp',
  card: '{days} ngày · {places} nơi',
  open: 'Xem lịch «{title}»',
  sheet: {
    draftNote: 'Bản nháp, chờ biên tập viên duyệt. Chỉ ghép các nơi có trong cẩm nang; chưa có giờ giấc hay giá.',
    day: 'Ngày {n}',
    emptyDay: 'Ngày dành cho chặng trước, chưa có nơi mới.',
    use: 'Dùng lịch này',
    close: 'Đóng',
    formTitle: 'Tạo chuyến từ «{title}»',
    formText: 'Chuyến có {days} ngày; các nơi được xếp sẵn vào từng ngày, bạn chỉnh lại sau.',
    name: 'Tên chuyến đi',
    start: 'Ngày đi',
    end: 'Ngày về {date}',
    create: 'Tạo chuyến đi',
    back: 'Quay lại',
    created: 'Đã tạo «{name}» từ lịch mẫu',
    errors: {
      name: 'Tên chuyến đi không được để trống.',
      nameLong: 'Tên chuyến đi tối đa {max} ký tự.',
      date: 'Ngày đi chưa đúng. Chọn một ngày hợp lệ.',
    },
  },
} as const;
