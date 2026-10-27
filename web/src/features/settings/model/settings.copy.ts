/** Chữ của màn Cài đặt (S21). Phần Quyền riêng tư là BẢN NHÁP, chưa phải chính sách pháp lý. */
export const SETTINGS_COPY = {
  eyebrow: 'Wander',
  title: 'Cài đặt',
  back: 'Quay lại',
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
      'Ở bản thử này chuyến đi lưu ngay trên thiết bị của bạn.',
    ],
  },
  mistaken: {
    title: 'Chuyến đi tạo nhầm',
    text: 'Bản này chưa có xóa cả chuyến đi. Từng mục thì xóa được và khôi phục ở “Đã xóa gần đây” trong chuyến đi.',
  },
  intro: { title: 'Giới thiệu', text: 'Xem lại ba cảnh giới thiệu Wander.', replay: 'Xem lại giới thiệu' },
  demo: {
    title: 'GIẢ LẬP',
    note: 'Chỉ có khi phát triển, để xem các màn chưa có máy chủ thật. Bản chạy thật không có phần này.',
    expire: 'Giả lập: hết phiên',
    errors: 'Giả lập lỗi theo mã',
    close: 'Đóng hộp lỗi',
  },
} as const;
