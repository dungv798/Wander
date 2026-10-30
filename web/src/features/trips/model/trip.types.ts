/** Mô hình chuyến đi ở FE. Tên trường bám hợp đồng backend (`TripDetail`/`Item` ở legacy/web-v1/src/api.ts, DR-018): `costK`, `referenceK`, `timeOfDay`, `durationMin`, `booking`, `done`. */

/** Chín loại mục (D13), mã trùng `ItemType` của backend. */
export type ItemKind = 'sightseeing' | 'food' | 'transport' | 'lodging' | 'car_rental' | 'shopping' | 'tour' | 'rest' | 'task';

/** Trạng thái đặt chỗ (A-14, DR-003): chỉ loại mục có giá mới có; Nghỉ và Việc cần làm là `null`. */
export type BookingStatus = 'pending' | 'booked';

/** Một mục trong chuyến: địa điểm từ kho (`placeId`) hoặc mục tự do. */
export interface TripItem {
  readonly id: string;
  /** Mã địa điểm trong kho biên tập; null với mục tự do. */
  readonly placeId: string | null;
  readonly type: ItemKind;
  /** Tên mục tự do (địa điểm lấy tên từ kho, để rỗng). */
  readonly title: string;
  /** Ngày `yyyy-mm-dd`; null = "Chưa có ngày" (DR-011 A1). */
  readonly day: string | null;
  /** Thứ tự trong ngày (0, 1, 2…); null khi chưa xếp. */
  readonly position: number | null;
  readonly timeOfDay: string | null;
  readonly durationMin: number | null;
  readonly note: string;
  /** Chi phí, nghìn đồng. null = chưa biết giá; 0 = biết bằng không (D18). */
  readonly costK: number | null;
  /** "Đã bao gồm": nằm trong giá khác, KHÔNG cộng vào tổng (D18). */
  readonly included: boolean;
  /** Giá tham khảo khi đã bao gồm (R4). */
  readonly referenceK: number | null;
  readonly booking: BookingStatus | null;
  /** Bản thân người đang xem đã xong việc/ghé mục địa điểm chưa (theo từng người, D10/DR-029). */
  readonly done: boolean;
  /** Mã thành viên đã thêm mục (null = Organizer/dữ liệu cũ); dùng cho quyền sửa/xóa mục của mình (H3). */
  readonly addedBy: string | null;
  /** Mã những thành viên hiện tại đã xong việc/ghé mục địa điểm; dùng cho tiến độ chung. */
  readonly doneBy: readonly string[];
}

/** Một mục đã xóa mềm (D19): giữ đến khi xóa vĩnh viễn, nhớ ngày và vị trí cũ để khôi phục về đúng chỗ. */
export interface TrashEntry {
  readonly id: string;
  readonly item: TripItem;
  /** Thời điểm xóa (mili giây từ epoch). */
  readonly deletedAt: number;
  /** Ngày của mục lúc xóa; null nếu lúc đó chưa có ngày. */
  readonly day: string | null;
  /** Vị trí trong ngày lúc xóa. */
  readonly position: number | null;
}

/** Bìa lưu máy chủ: mã ảnh catalog hoặc một trong sáu mã gradient (DR-031). */
export interface TripCover {
  readonly kind: 'photo' | 'gradient';
  readonly ref: string;
}

/** Một chuyến đi. */
export interface Trip {
  /** null/không có ở dữ liệu cũ là ảnh mặc định của điểm đến. */
  readonly cover?: TripCover | null;
  readonly id: string;
  /** Vai của người đang xem (Q6): Organizer là chủ chuyến, Thành viên vào bằng liên kết. */
  readonly role: 'organizer' | 'member';
  /** Số thành viên kể cả Organizer. */
  readonly memberCount: number;
  /** Mã thành viên của chính người đang xem (null nếu chưa biết). */
  readonly selfMemberId: string | null;
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  /** "Dự kiến N ngày" (A3, DR-018): ngày chưa chốt, hiển thị "chưa chắc". */
  readonly datesTentative: boolean;
  /** "Ai đi" (F2, DR-018): nhãn kiểu chuyến, chưa phải danh sách thành viên. */
  readonly kind: string | null;
  /** Sở thích (loại địa điểm) chọn lúc tạo (F2, DR-018). */
  readonly interests: readonly string[];
  /** Mã kiểu chuyến (tối đa 5, Q11). */
  readonly styles: readonly string[];
  readonly pace: string | null;
  /** Ngân sách, nghìn đồng; null = chưa đặt. */
  readonly budgetK: number | null;
  readonly items: readonly TripItem[];
  /** "Đã xóa gần đây" (D19): mục xóa mềm, mới nhất đứng đầu. */
  readonly trash: readonly TrashEntry[];
  readonly createdAt: number;
}

/** Trạng thái kho chuyến đi (lưu trên máy ở pha FE; backend thay thế ở FE-10). */
export interface TripsState {
  readonly trips: readonly Trip[];
}
