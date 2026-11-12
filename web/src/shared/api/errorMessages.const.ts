/** The table error code -> Vietnamese hint (docs/ux/error-codes.md, Tier B: changeable). Rule: always show the small code; do NOT count 'N attempts left' (MĐ-8). */

/** The ways out of the error box: Retry - open Security - go to Trips - open on this device - reload - close. */
export type ErrorAction = 'retry' | 'security' | 'trips' | 'recover' | 'reload' | 'close';

/** The error groups that share a hint. */
export type ErrorKind = 'invalid' | 'cover' | 'referenceCost' | 'matchMismatch' | 'expired' | 'stepUp' | 'rate' | 'recovery' | 'conflict' | 'notFound' | 'inTrash' | 'trashFull' | 'invite' | 'denied' | 'rule' | 'tooLarge' | 'network' | 'internal';

/** The hint of an error group. */
export interface ErrorInfo {
  readonly title: string;
  readonly text: string;
  readonly action: ErrorAction;
}

/** The hints by group. */
export const ERROR_INFO: Readonly<Record<ErrorKind, ErrorInfo>> = {
  invalid: { title: 'Dữ liệu chưa hợp lệ', text: 'Kiểm tra lại các ô vừa nhập rồi thử lại. Nếu vẫn lỗi, hãy báo kèm mã bên dưới.', action: 'close' },
  cover: { title: 'Bìa chưa hợp lệ', text: 'Hãy chọn ảnh hoặc màu bìa có sẵn rồi thử lại.', action: 'close' },
  referenceCost: { title: 'Giá tham khảo chưa hợp lệ', text: 'Chỉ nhập giá tham khảo khi đã chọn “Đã bao gồm”. Hãy chọn ô này hoặc xóa giá tham khảo rồi thử lại.', action: 'close' },
  matchMismatch: { title: 'Số đã chọn không khớp', text: 'Yêu cầu đã bị từ chối. Hãy tạo yêu cầu mới và kiểm tra số trên hai thiết bị trước khi xác nhận.', action: 'close' },
  expired: { title: 'Phiên đã hết', text: 'Wander cần bạn mở lại chuyến đi trên máy này.', action: 'recover' },
  stepUp: { title: 'Cần xác thực lại', text: 'Thao tác này cần xác thực lại bằng thiết bị tin cậy khác hoặc mã khôi phục.', action: 'security' },
  rate: { title: 'Bạn thao tác hơi nhanh', text: 'Chờ một lúc rồi thử lại. Dữ liệu của bạn không mất.', action: 'close' },
  recovery: { title: 'Chưa mở được', text: 'Mã chưa đúng hoặc không còn hiệu lực.', action: 'close' },
  conflict: { title: 'Chuyến đi đã thay đổi', text: 'Có thay đổi mới hơn ở nơi khác nên Wander không ghi đè. Tải lại để xem bản mới nhất.', action: 'reload' },
  notFound: { title: 'Không tìm thấy', text: 'Mục này có thể đã bị xóa, hoặc chuyến đi không còn ở máy này.', action: 'trips' },
  inTrash: { title: 'Mục đã được xử lý', text: 'Mục này đã nằm trong Đã xóa gần đây hoặc đã được khôi phục. Danh sách sẽ được đồng bộ lại.', action: 'reload' },
  invite: { title: 'Liên kết mời không dùng được', text: 'Liên kết đã hết hạn, bị thu hồi hoặc sai. Hãy xin người tổ chức một liên kết mới.', action: 'close' },
  denied: { title: 'Bạn chưa có quyền làm việc này', text: 'Chỉ Organizer làm được, hoặc mục này không phải do bạn thêm. Bạn có thể đề nghị xóa thay vì tự xóa.', action: 'close' },
  rule: { title: 'Việc này chưa làm được', text: 'Trạng thái đã đổi hoặc đã đạt giới hạn. Tải lại để xem bản mới nhất rồi thử lại.', action: 'close' },
  trashFull: { title: 'Đã xóa gần đây đã đầy', text: 'Hãy xóa vĩnh viễn bớt mục ở Đã xóa gần đây rồi thử lại.', action: 'close' },
  tooLarge: { title: 'Dữ liệu quá lớn', text: 'Dữ liệu gửi đi quá lớn. Rút gọn nội dung rồi thử lại.', action: 'close' },
  network: { title: 'Không kết nối được', text: 'Kiểm tra mạng rồi thử lại. Việc bạn vừa làm chưa được lưu.', action: 'retry' },
  internal: { title: 'Có lỗi ở phía Wander', text: 'Việc bạn vừa làm chưa được lưu. Thử lại sau ít phút.', action: 'retry' },
};

/** Server code -> error group. A code not in the table falls back to `internal`. */
export const CODE_KIND: ReadonlyMap<string, ErrorKind> = new Map(

  (
    [
      ['expired', ['UNAUTHENTICATED', 'INVALID_SESSION_TOKEN']],
      ['stepUp', ['STEP_UP_REQUIRED']],
      ['cover', ['INVALID_COVER']],
      ['referenceCost', ['REFERENCE_REQUIRES_INCLUDED']],
      ['matchMismatch', ['MATCH_MISMATCH']],
      ['rate', ['RATE_LIMITED']],
      ['recovery', ['INVALID_CODE', 'CODE_ALREADY_USED', 'CODE_CHANGED', 'INVALID_ATTEMPT', 'ATTEMPT_EXPIRED', 'INVALID_PAIRING_CODE', 'INVALID_REPLACEMENT', 'INVALID_OPERATION', 'INVALID_APPROVAL_CODE']],
      ['conflict', ['CONCURRENT_MODIFICATION']],
      ['notFound', ['NOT_FOUND']],
      ['inTrash', ['ITEM_DELETED', 'ALREADY_DELETED', 'NOT_DELETED', 'NOT_IN_TRASH']],
      ['trashFull', ['TRASH_FULL']],
      ['invite', ['INVALID_INVITE']],
      ['denied', ['NOT_ORGANIZER', 'NOT_YOUR_ITEM']],
      ['rule', ['TRIP_FULL', 'ORGANIZER_CANNOT_LEAVE', 'REQUEST_EXISTS', 'ALREADY_DECIDED', 'TOO_MANY_REQUESTS', 'CHECKLIST_FULL', 'OWN_ITEM_DELETE_DIRECTLY', 'ORGANIZER_DELETES_DIRECTLY', 'RATING_LIMIT_REACHED', 'CANNOT_REPORT_OWN']],
      ['tooLarge', ['BODY_TOO_LARGE']],
      ['network', ['NETWORK']],
      ['invalid', ['REQUIRED', 'TOO_LONG', 'TOO_LARGE', 'NEGATIVE', 'MALFORMED', 'INVALID_DATE', 'OUT_OF_RANGE', 'START_REQUIRED', 'END_REQUIRED', 'END_BEFORE_START', 'TOO_MANY', 'DATES_ORPHAN_ITEMS', 'DAY_OUT_OF_RANGE', 'INVALID_JSON']],
    ] as const
  ).flatMap(([kind, codes]) => codes.map((c) => [c, kind] as const)),
);

/** The code used when an error has no code (an unknown error). */
export const UNKNOWN_CODE = 'INTERNAL';

/** The sample codes in the 'Simulation' area of Settings (S20). */
export const DEMO_ERROR_CODES: readonly string[] = ['RATE_LIMITED', 'NOT_FOUND', 'INTERNAL', 'STEP_UP_REQUIRED', 'BODY_TOO_LARGE'];

/** The button labels by way out. */
export const ERROR_ACTION_LABEL: Readonly<Record<ErrorAction, string>> = {
  retry: 'Thử lại',
  security: 'Mở Bảo mật',
  trips: 'Về Chuyến đi',
  recover: 'Mở trên máy này',
  reload: 'Tải lại',
  close: 'Đóng',
};

/** The labels for the small code in the error box. */
export const ERROR_CODE_LABEL = 'Mã lỗi: {code}';
