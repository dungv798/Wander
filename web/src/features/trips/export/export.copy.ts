/** Chữ riêng của xuất PNG; không dùng nhãn giả vờ PDF/Lịch đã hoạt động. */
export const EXPORT_COPY = {
  image: 'Ảnh PNG', pdf: 'PDF · Sắp có', calendar: 'Lịch · Sắp có',
  formats: 'Hiện có ảnh PNG, cao vừa đủ nội dung. PDF và Lịch chưa hỗ trợ tạo tệp.',
  loading: 'Đang tạo ảnh xem trước…', error: 'Chưa tạo được ảnh. Bạn thử lại nhé.', retry: 'Thử lại',
  styleLabel: 'Kiểu ảnh', styleSummary: 'Tóm tắt chuyến', styleDays: 'Theo từng ngày',
  styleSummaryNote: 'Mỗi ngày một dòng tên các nơi: gọn, dễ gửi nhóm.', styleDaysNote: 'Từng nơi theo thứ tự, kèm giờ và giá khi bạn đã nhập.',
  create: 'Tạo ảnh PNG', download: 'Tải ảnh PNG', preview: 'Ảnh xem trước',
  exact: 'Ảnh bên dưới chính là tệp tải về. Lịch dài chia thành nhiều ảnh cân đối; tải từng ảnh bằng nút tương ứng.',
  noTime: 'Chưa đặt giờ', unknown: 'Chưa biết giá', included: 'Đã bao gồm',
  emptyDay: 'Ngày còn trống — bạn có thể thêm địa điểm sau.', empty: 'Chưa có địa điểm. Đây là bản lịch trống để bạn bắt đầu.',
  tentative: 'Ngày dự kiến · chưa chốt ngày đi', undated: 'Chưa xếp ngày',
  noDates: 'Chưa có ngày đi', undatedNote: 'mục chưa có ngày không nằm trong ảnh này', day: 'Ngày', total: 'Tổng phải trả thêm (giá đã biết)',
  noKnown: 'Chưa có giá đã biết để tính tổng', unknownNote: 'mục chưa biết giá; chưa tính vào tổng.',
  includedNote: 'Mục đã bao gồm không cộng vào tổng.', photo: 'Ảnh', photoMissing: 'Không tải được ảnh bìa · bản chữ vẫn đầy đủ lịch trình.',
  brand: 'Wander', fallbackName: 'chuyen-di', page: 'Ảnh',
  continued: '(tiếp)',
} as const;
