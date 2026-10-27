import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR, HTTP } from '../../../shared/api/http.const.ts';
import type { Trip } from '../model/trip.types.ts';
import type { ItemChange, ItemInput, NewTripInput, ScheduleChange, TripPatch, TripsGateway } from './TripsGateway.ts';
import { detailItems, toTrash, toTrip } from './tripMapper.ts';
import { TRIPS_API as P } from './tripsApi.const.ts';

type Body = Record<string, unknown>;

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Chép các khóa có mặt (kể cả `null`, nghĩa là "xóa") từ `source` sang thân yêu cầu theo bản đồ tên trường; khóa `undefined` bị bỏ. */
function pick(source: object, names: Readonly<Record<string, string>>): Body {
  const from = source as Body;
  const body: Body = {};
  for (const [key, apiName] of Object.entries(names)) if (from[key] !== undefined) body[apiName] = from[key];
  return body;
}

/** Tên trường FE → tên trường API của chuyến. */
const TRIP_FIELDS = { name: 'name', destinationId: 'destination', startDate: 'startDate', endDate: 'endDate', budgetK: 'budget', styles: 'styles', pace: 'pace', datesTentative: 'datesTentative', kind: 'kind', interests: 'interests' } as const;
/** Tên trường FE → tên trường API của mục. */
const ITEM_FIELDS = { type: 'type', title: 'title', placeId: 'placeId', day: 'day', position: 'position', timeOfDay: 'timeOfDay', durationMin: 'durationMin', note: 'note', costK: 'cost', included: 'included', referenceK: 'referenceCost', booking: 'booking' } as const;

/** Lấy phần tử `key` của thân phản hồi; thiếu hoặc sai dạng là lỗi nội bộ (không để giao diện dùng dữ liệu hỏng). */
function part(body: unknown, key: string): Body {
  const value = isRecord(body) ? body[key] : undefined;
  if (!isRecord(value)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** Mã (chuỗi) của một đối tượng phản hồi. */
function idOf(obj: Body): string {
  if (typeof obj['id'] !== 'string') throw new ApiError(CLIENT_ERROR.INTERNAL);
  return obj['id'];
}

/** Cài đặt `TripsGateway` bằng API thật; bí mật phiên do `ApiClient` gắn. */
export class HttpTripsGateway implements TripsGateway {
  private readonly client: ApiClient;

  /** Dùng máy khách HTTP đã cho (tiêm được khi test). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Đường dẫn của một chuyến, tùy chọn kèm hậu tố. */
  private path(tripId: string, suffix = ''): string {
    return `${P.TRIPS}/${encodeURIComponent(tripId)}${suffix}`;
  }

  /** Đường dẫn của một mục, tùy chọn kèm hậu tố. */
  private itemPath(tripId: string, itemId: string, suffix = ''): string {
    return this.path(tripId, `${P.ITEMS}/${encodeURIComponent(itemId)}${suffix}`);
  }

  /** Mọi chuyến của chủ kèm mục và thùng rác (mỗi chuyến đọc song song). */
  async loadAll(): Promise<Trip[]> {
    const body = await this.client.get<unknown>(P.TRIPS);
    const list = isRecord(body) ? body[P.KEY_TRIPS] : undefined;
    if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    const loaded = await Promise.all(list.map((view) => this.load(idOf(isRecord(view) ? view : {})).catch((e: unknown) => {
      // chuyến biến mất giữa lúc liệt kê và lúc đọc (xóa ở máy khác): bỏ qua; lỗi khác vẫn báo
      if (e instanceof ApiError && e.status === HTTP.NOT_FOUND) return null;
      throw e;
    })));
    return loaded.filter((t): t is Trip => t !== null);
  }

  /** Một chuyến đầy đủ: chi tiết (lịch theo ngày) và thùng rác đọc song song. */
  async load(tripId: string): Promise<Trip> {
    const [detail, trash] = await Promise.all([this.client.get<unknown>(this.path(tripId)), this.client.get<unknown>(this.path(tripId, P.TRASH))]);
    const rawTrash: unknown = isRecord(trash) ? trash[P.KEY_ITEMS] : undefined;
    if (!Array.isArray(rawTrash)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    const trip = toTrip(isRecord(detail) ? detail[P.KEY_TRIP] : undefined, detailItems(detail), rawTrash.map(toTrash).filter((t) => t !== null));
    if (!trip) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return trip;
  }

  /** Tạo chuyến và trả mã mới. */
  async create(input: NewTripInput): Promise<string> {
    return idOf(part(await this.client.send<unknown>('POST', P.TRIPS, pick(input, TRIP_FIELDS)), P.KEY_TRIP));
  }

  /** Sửa chuyến: chỉ trường được nêu. */
  async update(tripId: string, patch: TripPatch): Promise<void> {
    await this.client.send('PATCH', this.path(tripId), pick(patch, TRIP_FIELDS));
  }

  /** Thêm mục và trả mã mới. */
  async addItem(tripId: string, input: ItemInput): Promise<string> {
    return idOf(part(await this.client.send<unknown>('POST', this.path(tripId, P.ITEMS), pick(input, ITEM_FIELDS)), P.KEY_ITEM));
  }

  /** Sửa mục: chỉ trường được nêu (`null` xóa giá/giờ…). */
  async editItem(tripId: string, itemId: string, change: ItemChange): Promise<void> {
    await this.client.send('PATCH', this.itemPath(tripId, itemId), pick(change, ITEM_FIELDS));
  }

  /** Xóa mềm một mục. */
  async trash(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.itemPath(tripId, itemId));
  }

  /** Khôi phục một mục từ thùng rác. */
  async restore(tripId: string, itemId: string): Promise<void> {
    await this.client.send('POST', this.itemPath(tripId, itemId, P.RESTORE));
  }

  /** Xóa vĩnh viễn một mục ở thùng rác (không hoàn tác được). */
  async purge(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.itemPath(tripId, itemId, P.PERMANENT));
  }

  /** Đánh dấu hoặc bỏ đánh dấu xong một việc cần làm. */
  async setDone(tripId: string, itemId: string, done: boolean): Promise<void> {
    await this.client.send('PUT', this.itemPath(tripId, itemId, P.DONE), { done });
  }

  /** Sắp xếp lại các mục đang hiện của một ngày. */
  async reorderDay(tripId: string, day: string, orderedIds: readonly string[]): Promise<void> {
    await this.client.send('POST', this.path(tripId, `${P.DAYS}/${encodeURIComponent(day)}${P.REORDER}`), { orderedIds });
  }

  /** Lệnh lịch nguyên tử (đổi khoảng ngày và/hoặc gán ngày hàng loạt). */
  async schedule(tripId: string, change: ScheduleChange): Promise<void> {
    await this.client.send('POST', this.path(tripId, P.SCHEDULE), change);
  }
}
