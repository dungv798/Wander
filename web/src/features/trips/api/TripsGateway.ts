import type { BookingStatus, ItemKind, Trip, TripCover } from '../model/trip.types.ts';

/** Thông tin tạo chuyến (mã `kind`, `styles`, `pace`, `interests` trùng backend; tiền theo nghìn đồng). */
export interface NewTripInput {
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  readonly datesTentative?: boolean;
  readonly kind?: string | null;
  readonly interests?: readonly string[];
  readonly styles?: readonly string[];
  readonly pace?: string | null;
  readonly budgetK?: number | null;
}

/** Sửa chuyến: trường không nêu thì giữ nguyên, nêu `null` thì xóa (chưa đặt). */
export type TripPatch = Partial<Omit<NewTripInput, 'destinationId'>> & { readonly cover?: TripCover | null };

/** Dữ liệu một mục mới. `day` null = "Chưa có ngày"; `position` không nêu = cuối ngày. */
export interface ItemInput {
  readonly type: ItemKind;
  readonly title: string;
  readonly placeId: string | null;
  readonly day: string | null;
  readonly position?: number;
  readonly timeOfDay: string | null;
  readonly durationMin: number | null;
  readonly note: string;
  readonly costK: number | null;
  readonly included: boolean;
  readonly referenceK: number | null;
  readonly booking: BookingStatus | null;
}

/** Sửa một mục: trường không nêu thì giữ nguyên (không đổi được `placeId`). */
export type ItemChange = Partial<Omit<ItemInput, 'placeId'>>;

/** Một mục trong lệnh lịch: gán ngày (null = bỏ ngày) và vị trí tùy chọn. */
export interface DayAssignment {
  readonly itemId: string;
  readonly day: string | null;
  readonly position?: number;
}

/** Lệnh lịch nguyên tử: đổi khoảng ngày và/hoặc gán ngày hàng loạt trong một giao dịch (cũng là cách Hoàn tác). */
export interface ScheduleChange {
  readonly startDate?: string;
  readonly endDate?: string;
  readonly assignments?: readonly DayAssignment[];
}

/** Một chuyến trong "Chuyến đã xóa gần đây" (chỉ phần tóm tắt, chưa nạp mục). */
export interface DeletedTrip {
  readonly id: string;
  readonly name: string;
  readonly destinationId: string;
  readonly startDate: string;
  readonly endDate: string;
  /** Thời điểm xóa, mili giây từ epoch. */
  readonly deletedAt: number;
}

/** Cổng tới API chuyến đi của chủ danh tính. Mọi thất bại là `ApiError` có mã của backend. */
export interface TripsGateway {
  /** Mọi chuyến của chủ kèm mục đang hiện và thùng rác. */
  loadAll(): Promise<Trip[]>;
  /** Một chuyến đầy đủ (chi tiết + thùng rác). */
  load(tripId: string): Promise<Trip>;
  /** Tạo chuyến, trả mã do máy chủ cấp. */
  create(input: NewTripInput): Promise<string>;
  update(tripId: string, patch: TripPatch): Promise<void>;
  /** Thêm mục, trả mã do máy chủ cấp. */
  addItem(tripId: string, input: ItemInput): Promise<string>;
  editItem(tripId: string, itemId: string, change: ItemChange): Promise<void>;
  /** Xóa mềm (vào "Đã xóa gần đây"). */
  trash(tripId: string, itemId: string): Promise<void>;
  /** Khôi phục từ thùng rác (ngày cũ không còn thì về "Chưa có ngày"). */
  restore(tripId: string, itemId: string): Promise<void>;
  /** Xóa vĩnh viễn một mục đã ở thùng rác. */
  purge(tripId: string, itemId: string): Promise<void>;
  setDone(tripId: string, itemId: string, done: boolean): Promise<void>;
  /** Sắp xếp lại các mục đang hiện của một ngày theo thứ tự `orderedIds`. */
  reorderDay(tripId: string, day: string, orderedIds: readonly string[]): Promise<void>;
  schedule(tripId: string, change: ScheduleChange): Promise<void>;
  /** Xóa mềm cả chuyến (vào "Chuyến đã xóa gần đây"). */
  deleteTrip(tripId: string): Promise<void>;
  /** Khôi phục một chuyến đã xóa mềm. */
  restoreTrip(tripId: string): Promise<void>;
  /** Các chuyến đã xóa mềm, xóa gần nhất trước. */
  loadDeleted(): Promise<DeletedTrip[]>;
}
