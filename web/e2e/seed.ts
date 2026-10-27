import type { Page } from 'playwright-core';
import { fakeHash } from '../src/features/identity/model/identityServer.ts';

/** Dữ liệu mẫu dùng chung cho e2e, chụp ảnh và quét truy cập: một chuyến Hà Giang 3 ngày ghi thẳng vào localStorage (đúng khóa và hình dạng `TripsState`). */
export const TRIPS_KEY = 'wander.web.trips.v1';
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

/** Ghi chuyến mẫu vào localStorage của trang đang mở rồi tải lại (kho đọc localStorage lúc khởi tạo). */
export async function seedTrips(page: Page): Promise<void> {
  await page.evaluate(([key, value]) => localStorage.setItem(key as string, JSON.stringify(value)), [TRIPS_KEY, sampleTripsState()] as const);
  await page.reload();
}

const SERVER_KEY = 'wander.web.server.v1';
const SESSION_KEY = 'wander.web.session.v1';

/** Danh tính mẫu cho ảnh chụp/kiểm thử: máy này + (tùy chọn) một máy tính bảng, có hoặc chưa có mã khôi phục. */
export async function seedIdentity(page: Page, opts: { withCode?: boolean; tablet?: boolean } = {}): Promise<void> {
  const now = Date.now();
  const server = {
    identity: {
      createdAt: now - 9 * 86_400_000,
      codeHash: opts.withCode ? fakeHash('7K2QFR9XMT4B8HDWJ3NC5VZ6AE1G0Y') : null,
      devices: [{ id: 'this', name: 'Điện thoại', at: now }, ...(opts.tablet ? [{ id: 'tab', name: 'Máy tính bảng', at: now - 3 * 86_400_000 }] : [])],
      events: [{ at: now - 3 * 86_400_000, kind: 'paired', device: 'Máy tính bảng' }, { at: now - 9 * 86_400_000, kind: 'created', device: 'Điện thoại' }],
      unseen: false,
    },
    pairing: null,
    requests: [],
  };
  await page.evaluate(([k1, v1, k2, v2]) => {
    localStorage.setItem(k1 as string, JSON.stringify(v1));
    localStorage.setItem(k2 as string, JSON.stringify(v2));
  }, [SERVER_KEY, server, SESSION_KEY, { deviceId: 'this', recovered: false }] as const);
  await page.reload();
}
