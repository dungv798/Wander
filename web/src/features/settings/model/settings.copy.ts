/** The copy of the Settings screen (S21). The Privacy part is a DRAFT, not a legal policy. */
export const SETTINGS_COPY = {
  eyebrow: 'Wander',
  title: 'Cài đặt',
  back: 'Quay lại',
  interests: {
    title: 'Bạn mê gì?',
    text: 'Chọn những loại nơi bạn thích. Lưu theo danh tính của bạn nên sang máy khác vẫn còn.',
    group: 'Loại nơi bạn thích',
    save: 'Lưu sở thích',
    saved: 'Đã lưu sở thích',
    loading: 'Đang tải sở thích…',
    none: 'Chưa có danh tính. Chọn sở thích được sau khi bạn lưu chuyến đi đầu tiên.',
  },
  device: {
    title: 'Thiết bị này',
    text: 'Tên giúp bạn nhận ra máy này trong danh sách thiết bị tin cậy.',
    label: 'Tên thiết bị',
    save: 'Lưu tên',
    saved: 'Đã lưu tên thiết bị',
    none: 'Chưa có danh tính. Tên thiết bị đặt được sau khi bạn lưu chuyến đi đầu tiên.',
  },
  security: { title: 'Bảo mật', text: 'Mã khôi phục, thiết bị tin cậy và hoạt động gần đây.', open: 'Mở Bảo mật' },
  about: {
    title: 'Về Wander',
    text: 'Wander gợi ý nơi đi và giúp bạn xếp thành lịch trình. Nơi chốn, ảnh và cẩm nang do biên tập viên soạn từ nguồn có ghi công.',
    credit: 'Ảnh từ Wikimedia Commons; tác giả và giấy phép từng ảnh nằm ở nút ⓘ của mỗi địa điểm.',
    draft: 'Nội dung đang ở dạng bản nháp.',
  },
  privacy: {
    title: 'Quyền riêng tư',
    draft: 'Bản nháp, chưa phải chính sách pháp lý.',
    points: [
      'Wander không hỏi email hay số điện thoại; danh tính của bạn là ẩn danh.',
      'Mã khôi phục chỉ hiện một lần; Wander không giữ bản đọc được của mã.',
      'Chuyến đi lưu trên máy chủ của Wander, gắn với danh tính ẩn danh của bạn (không email, không số điện thoại).',
    ],
  },
  mistaken: {
    title: 'Chuyến đi tạo nhầm',
    text: 'Mở chuyến đó, vào tab Tổng quan và chọn “Xóa chuyến đi”. Chuyến vào “Chuyến đã xóa gần đây” nên bạn khôi phục lại được; từng mục thì khôi phục ở “Đã xóa gần đây” trong chuyến.',
  },
  intro: { title: 'Giới thiệu', text: 'Xem lại phần giới thiệu Wander (bốn cảnh).', replay: 'Xem lại giới thiệu' },
  demo: {
    title: 'GIẢ LẬP',
    note: 'Chỉ có khi phát triển, để xem các màn chưa có máy chủ thật. Bản chạy thật không có phần này.',
    expire: 'Giả lập: hết phiên',
    errors: 'Giả lập lỗi theo mã',
    close: 'Đóng hộp lỗi',
  },
} as const;
