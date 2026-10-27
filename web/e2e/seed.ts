import type { Page } from 'playwright-core';
import { TOKEN_KEY, addDevice, api, createOwner, loginAs } from './backend.ts';
import type { Owner } from './backend.ts';

/** Dữ liệu mẫu dùng chung cho e2e, chụp ảnh và quét truy cập: một chuyến Hà Giang 3 ngày, dựng qua API backend thật bởi `seedTrips`. */
const DAY_MS = 86_400_000;
const FIRST_DAY_OFFSET = 3;

/** Ngày `yyyy-mm-dd` cách hôm nay `n` ngày THEO LỊCH CỦA MÁY (giống `todayLocal` của ứng dụng; dùng UTC sẽ lệch một ngày vào quanh nửa đêm ở UTC+7). */
function iso(n: number): string {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) + n * DAY_MS).toISOString().slice(0, 10);
}

/** Một mục mẫu với giá trị mặc định (chưa có ngày, chưa biết giá, chờ xác nhận). */
function item(id: string, fields: Record<string, unknown>): Record<string, unknown> {
  return { id, placeId: null, type: 'sightseeing', title: '', day: null, position: null, timeOfDay: null, durationMin: null, note: '', costK: null, included: false, referenceK: null, booking: 'pending', done: false, ...fields };
}

/** Chuyến mẫu có đủ các trường hợp tiền: 0, biết giá, chưa biết, đã bao gồm + giá tham khảo, đã đặt; Nghỉ/Việc cần làm; mục chưa có ngày. Tổng phải trả thêm = 750.000 ₫. */
export function sampleTripsState(): { trips: Record<string, unknown>[] } {
  const d0 = iso(FIRST_DAY_OFFSET);
  const d1 = iso(FIRST_DAY_OFFSET + 1);
  const d2 = iso(FIRST_DAY_OFFSET + 2);
  return {
    trips: [
      {
        id: 'mau-ha-giang', name: 'Hà Giang - mẫu', destinationId: 'ha-giang', startDate: d0, endDate: d2, datesTentative: false, kind: 'Bạn bè', interests: ['canh', 'van'], styles: ['explore', 'mountain'], pace: 'moderate', budgetK: 3000, createdAt: 1,
        items: [
          item('a1', { placeId: 'cao-nguyen-da', day: d0, position: 0, costK: 0 }),
          item('a2', { placeId: 'dinh-vuong', day: d0, position: 1, costK: 30, timeOfDay: '10:00', durationMin: 60 }),
          item('a3', { placeId: 'cot-co-lung-cu', day: d0, position: 2, included: true, referenceK: 25 }),
          item('a4', { type: 'food', title: 'Ăn trưa (mẫu)', day: d0, position: 3, costK: 120, timeOfDay: '12:30', durationMin: 60 }),
          item('a5', { type: 'lodging', title: 'Homestay Đồng Văn (mẫu)', day: d0, position: 4, costK: 450, booking: 'booked', note: 'Số tiền chỉ để minh họa.' }),
          item('b1', { placeId: 'deo-ma-pi-leng', day: d1, position: 0 }),
          item('b2', { placeId: 'song-nho-que', day: d1, position: 1, costK: 150 }),
          item('b3', { type: 'rest', title: 'Nghỉ trưa', day: d1, position: 2, durationMin: 60, booking: null }),
          item('b4', { type: 'task', title: 'Đổ xăng trước khi lên đèo', day: d1, position: 3, booking: null }),
          item('u1', { placeId: 'pho-co-dong-van' }),
          item('u2', { placeId: 'hoang-su-phi' }),
          item('u3', { placeId: 'tay-con-linh' }),
        ],
      },
    ],
  };
}

/** Mã chuyến/mục do máy chủ cấp cho dữ liệu mẫu của một trang, kèm bí danh cũ (`a1`…`u3`) để test đọc dễ. */
export interface Seeded {
  readonly tripId: string;
  readonly alias: ReadonlyMap<string, string>;
  readonly start: string;
}
const seededByPage = new WeakMap<Page, Seeded>();

/** Nhãn "Ai đi" của dữ liệu mẫu cũ thành mã kiểu chuyến của backend. */
const KIND_CODE: Readonly<Record<string, string>> = { 'Bạn bè': 'friends', 'Một mình': 'solo', 'Gia đình': 'family', 'Cặp đôi': 'couple', 'Công việc': 'work' };

/** Dựng chuyến mẫu qua API backend thật: danh tính mới, chuyến Hà Giang 3 ngày với đủ mục mẫu; đăng nhập trang bằng bí mật phiên rồi tải lại. */
export async function seedTrips(page: Page): Promise<Seeded> {
  const owner = await createOwner();
  const sample = sampleTripsState().trips[0]!;
  const created = await api('POST', '/api/trips', owner.token, {
    name: sample['name'], destination: sample['destinationId'], startDate: sample['startDate'], endDate: sample['endDate'], budget: sample['budgetK'],
    styles: sample['styles'], pace: sample['pace'], datesTentative: sample['datesTentative'], kind: KIND_CODE[sample['kind'] as string] ?? null, interests: sample['interests'],
  });
  const tripId = (created.body?.['trip'] as { id: string }).id;
  const alias = new Map<string, string>();
  for (const it of sample['items'] as Record<string, unknown>[]) {
    const r = await api('POST', `/api/trips/${tripId}/items`, owner.token, {
      placeId: it['placeId'], type: it['type'], title: it['title'] || it['placeId'], day: it['day'], timeOfDay: it['timeOfDay'], durationMin: it['durationMin'], note: it['note'],
      cost: it['costK'], included: it['included'], referenceCost: it['referenceK'], booking: it['booking'],
    });
    if (r.status >= 300) throw new Error(`Thêm mục mẫu ${String(it['id'])} thất bại: ${r.status} ${JSON.stringify(r.body)}`);
    alias.set((r.body?.['item'] as { id: string }).id, it['id'] as string);
  }
  await loginAs(page, owner.token);
  const seeded = { tripId, alias, start: sample['startDate'] as string };
  seededByPage.set(page, seeded);
  return seeded;
}

/** Dữ liệu mẫu của trang này (phải đã gọi `seedTrips`). */
export function seededOf(page: Page): Seeded {
  const seeded = seededByPage.get(page);
  if (!seeded) throw new Error('Trang này chưa được seedTrips');
  return seeded;
}

/** Một mục như test cần đọc (mã đã đổi về bí danh nếu là mục mẫu). */
export interface StoredItem {
  id: string;
  placeId: string | null;
  day: string | null;
  position: number | null;
  costK: number | null;
  type: string;
  title: string;
  done: boolean;
  included: boolean;
  booking: string | null;
}
/** Một chuyến như test cần đọc. */
export interface StoredTrip {
  id: string;
  name: string;
  kind: string | null;
  interests: string[];
  styles: string[];
  datesTentative: boolean;
  budgetK: number | null;
  startDate: string;
  endDate: string;
  items: StoredItem[];
  trashCount: number;
}

/** Đọc các chuyến của chủ trang này TỪ MÁY CHỦ (nguồn sự thật), mục "Chưa có ngày" gộp vào `items` với `day: null`. */
export async function storedTrips(page: Page): Promise<{ trips: StoredTrip[] }> {
  const token = await page.evaluate((k) => (JSON.parse(localStorage.getItem(k) ?? 'null') as { token?: string } | null)?.token ?? null, TOKEN_KEY);
  if (!token) return { trips: [] };
  const alias = seededByPage.get(page)?.alias;
  const list = (await api('GET', '/api/trips', token)).body?.['trips'] as { id: string }[];
  const trips: StoredTrip[] = [];
  for (const { id } of list) {
    const d = (await api('GET', `/api/trips/${id}`, token)).body as { trip: Record<string, unknown>; days: { items: Record<string, unknown>[] }[]; unscheduled: Record<string, unknown>[]; trashCount: number };
    const t = d.trip;
    const items = [...d.days.flatMap((x) => x.items), ...d.unscheduled].map((i) => ({
      id: alias?.get(i['id'] as string) ?? (i['id'] as string), placeId: (i['placeId'] as string | null) ?? null, day: (i['day'] as string | null) ?? null,
      position: i['day'] === null ? null : (i['position'] as number), costK: (i['costK'] as number | null) ?? null, type: i['type'] as string, title: i['title'] as string,
      done: i['done'] === true, included: i['included'] === true, booking: (i['booking'] as string | null) ?? null,
    }));
    trips.push({
      id, name: t['name'] as string, kind: ((t['kind'] as { code: string } | null)?.code) ?? null, interests: ((t['interests'] as { code: string }[]) ?? []).map((x) => x.code),
      styles: ((t['styles'] as { code: string }[]) ?? []).map((x) => x.code), datesTentative: t['datesTentative'] === true, budgetK: (t['budgetK'] as number | null) ?? null,
      startDate: t['startDate'] as string, endDate: t['endDate'] as string, items, trashCount: d.trashCount,
    });
  }
  return { trips };
}

/** Danh tính thật cho ảnh chụp/kiểm thử: tạo qua API backend, thêm (tùy chọn) mã khôi phục và một máy tính bảng, rồi đăng nhập trang bằng bí mật phiên của "Điện thoại". */
export async function seedIdentity(page: Page, opts: { withCode?: boolean; tablet?: boolean } = {}): Promise<Owner> {
  const owner = await createOwner({ withCode: opts.withCode === true });
  if (opts.tablet) await addDevice(owner.token, 'Máy tính bảng');
  await loginAs(page, owner.token);
  return owner;
}
