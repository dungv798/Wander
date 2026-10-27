// Máy khách API. Phiên được giữ trong localStorage (rủi ro XSS được ghi ở docs/implementation/decisions.md).
const TOKEN_KEY = 'wander.session';
const PENDING_KEY = 'wander.pendingRecovery';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t: string): void => {
  try {
    localStorage.setItem(TOKEN_KEY, t);
  } catch {
    /* trình duyệt chặn lưu trữ: phiên chỉ sống trong tab này */
  }
};
export const clearToken = (): void => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* bỏ qua */
  }
};

/** Bí mật phiên do thiết bị tự sinh (256 bit, base64url); server chỉ giữ băm. */
export function newSessionSecret(): string {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export class ApiFailure extends Error {
  status: number;
  code: string;
  field: string | undefined;
  details: unknown;
  constructor(status: number, code: string, message: string, field?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
    this.details = details;
  }
}

const MESSAGES: Record<string, string> = {
  NEGATIVE: 'Số tiền không được âm.',
  MALFORMED: 'Giá trị chưa đúng định dạng.',
  TOO_LARGE: 'Giá trị quá lớn.',
  REQUIRED: 'Trường này là bắt buộc.',
  TOO_LONG: 'Nội dung quá dài.',
  OUT_OF_RANGE: 'Giá trị nằm ngoài phạm vi cho phép.',
  START_REQUIRED: 'Cần nhập ngày đi.',
  END_REQUIRED: 'Cần nhập ngày về.',
  END_BEFORE_START: 'Ngày về không được trước ngày đi.',
  INVALID_DATE: 'Ngày không hợp lệ.',
  DAY_OUT_OF_RANGE: 'Ngày nằm ngoài khoảng ngày của chuyến.',
  REFERENCE_REQUIRES_INCLUDED: 'Giá tham khảo chỉ dùng khi tích "đã bao gồm".',
  INVALID_STYLE: 'Kiểu chuyến không hợp lệ.',
  INVALID_PACE: 'Nhịp chuyến không hợp lệ.',
  TOO_MANY: 'Chọn quá nhiều mục.',
  INVALID_BOOKING: 'Trạng thái đặt chỗ không hợp lệ.',
  BOOKING_NOT_APPLICABLE: 'Loại mục này không có trạng thái đặt chỗ.',
  INVALID_CODE: 'Mã không đúng hoặc đã được dùng.',
  INVALID_REPLACEMENT: 'Mã bạn nhập lại chưa khớp với mã mới.',
  ATTEMPT_EXPIRED: 'Đã hết thời gian chờ. Hãy bắt đầu lại; mã hiện tại của bạn vẫn dùng được.',
  CODE_ALREADY_USED: 'Mã này vừa được dùng ở một lần khôi phục khác.',
  CODE_CHANGED: 'Mã khôi phục đã thay đổi trong lúc chờ. Hãy bắt đầu lại.',
  STEP_UP_REQUIRED: 'Cần xác thực lại để thực hiện thao tác này.',
  INVALID_PAIRING_CODE: 'Mã ghép thiết bị không đúng hoặc đã hết hạn.',
  INVALID_APPROVAL_CODE: 'Mã phê duyệt không đúng hoặc đã hết hạn.',
  RATE_LIMITED: 'Bạn thao tác quá nhanh. Hãy thử lại sau.',
  UNAUTHENTICATED: 'Phiên không còn hiệu lực.',
  NOT_FOUND: 'Không tìm thấy.',
  NETWORK: 'Không kết nối được máy chủ. Hãy thử lại.',
};

export const errorText = (e: unknown): string => {
  if (e instanceof ApiFailure) return MESSAGES[e.code] ?? e.message;
  return 'Không kết nối được máy chủ. Hãy thử lại.';
};

async function request<T>(method: string, path: string, body?: unknown, token: string | null = getToken()): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiFailure(0, 'NETWORK', 'Không kết nối được máy chủ.');
  }
  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const err = (data as { error?: { code: string; message: string; field?: string; details?: unknown } } | undefined)?.error;
    throw new ApiFailure(res.status, err?.code ?? 'ERROR', err?.message ?? 'Đã xảy ra lỗi.', err?.field, err?.details);
  }
  return data as T;
}

export interface Choice {
  code: string;
  label: string;
}

export interface Trip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  /** Tùy chọn chuyến đi (Q11): ngân sách (nghìn đồng), kiểu chuyến và nhịp; đều có thể chưa đặt. */
  budgetK: number | null;
  budgetFormatted: string | null;
  styles: Choice[];
  pace: Choice | null;
}

/** Ngân sách so với "Tổng phải trả thêm"; chỉ có khi đã đặt ngân sách. gapK luôn không âm. */
export interface Budget {
  budgetK: number;
  budgetFormatted: string;
  extraK: number;
  extraFormatted: string;
  unknownCount: number;
  over: boolean;
  gapK: number;
  gapFormatted: string;
}

export interface Item {
  id: string;
  day: string;
  position: number;
  type: string;
  typeLabel: string;
  title: string;
  timeOfDay: string | null;
  durationMin: number | null;
  note: string | null;
  costK: number | null;
  costFormatted: string | null;
  included: boolean;
  referenceK: number | null;
  referenceFormatted: string | null;
  /** Trạng thái đặt chỗ (A-14); null với Nghỉ và Việc cần làm. */
  booking: 'pending' | 'booked' | null;
  bookingLabel: string | null;
  done: boolean;
  deletedAt: string | null;
}

export interface DayView {
  date: string;
  index: number;
  weekday: number;
  weekdayLabel: string;
  items: Item[];
}

export interface TripDetail {
  trip: Trip;
  dayCount: number;
  days: DayView[];
  totals: {
    extraK: number;
    extraFormatted: string;
    byDay: Array<{ date: string; extraK: number; extraFormatted: string }>;
    byType: Array<{ type: string; typeLabel: string; extraK: number; extraFormatted: string }>;
  };
  pendingTasks: Array<{ id: string; day: string; title: string; timeOfDay: string | null }>;
  trashCount: number;
  budget: Budget | null;
}

export interface SessionInfo {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

export const ITEM_TYPES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'sightseeing', label: 'Tham quan' },
  { value: 'food', label: 'Ăn uống' },
  { value: 'transport', label: 'Di chuyển' },
  { value: 'lodging', label: 'Lưu trú' },
  { value: 'car_rental', label: 'Thuê xe' },
  { value: 'shopping', label: 'Mua sắm' },
  { value: 'tour', label: 'Tour/Combo' },
  { value: 'rest', label: 'Nghỉ' },
  { value: 'task', label: 'Việc cần làm' },
];

/** Kiểu chuyến (chọn nhiều, tối đa MAX_TRIP_STYLES) và nhịp (chọn một): chỉ là nhãn (Q11, DR-002). */
export const MAX_TRIP_STYLES = 5;
export const TRIP_STYLES: ReadonlyArray<Choice> = [
  { code: 'relax', label: 'Nghỉ dưỡng' },
  { code: 'explore', label: 'Khám phá' },
  { code: 'food', label: 'Ẩm thực' },
  { code: 'beach', label: 'Biển' },
  { code: 'mountain', label: 'Núi' },
  { code: 'city', label: 'Thành phố' },
  { code: 'family', label: 'Gia đình' },
  { code: 'friends', label: 'Bạn bè' },
];
export const TRIP_PACES: ReadonlyArray<Choice> = [
  { code: 'relaxed', label: 'Thoải mái' },
  { code: 'moderate', label: 'Vừa' },
  { code: 'packed', label: 'Dày' },
];

// ---- Kho địa điểm (module catalog, ADR-010). Tên trường khớp CatalogViews.java ----
export interface CatalogPreview {
  placeId: string;
  name: string;
  url: string;
}
export interface DestinationSummary {
  id: string;
  name: string;
  region: string;
  tagline: string;
  placeCount: number;
  coverUrl: string;
  bestMonths: number[];
  previews: CatalogPreview[];
}
export interface PhotoView {
  url: string;
  author: string;
  license: string;
  sourceUrl: string;
}
/** Khoảng cách ước tính từ một mốc; approximate = tọa độ mốc chưa kiểm chứng. */
export interface Away {
  refId: string;
  refName: string;
  km: number;
  minutes: number;
  approximate: boolean;
}
export interface PlaceView {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  area: string;
  hook: string;
  summary: string;
  lat: number | null;
  lon: number | null;
  bestMonths: number[];
  bestLabel: string;
  duration: string;
  difficulty: string;
  highlights: string[];
  verdict: string;
  verdictLabel: string;
  verdictReason: string;
  bestSlots: string[];
  slotReason: string;
  tips: string[];
  photos: PhotoView[];
  away: Away[];
  wikipediaTitle: string;
}
export interface GuideItemView {
  icon: string;
  title: string;
  text: string;
  placeId: string | null;
}
export interface GuideSectionView {
  id: string;
  layout: 'months' | 'checklist' | 'cards' | 'places' | 'rows';
  category: string;
  icon: string;
  title: string;
  summary: string;
  bestMonths: number[];
  rainyMonths: number[];
  notes: string[];
  items: GuideItemView[];
}
export interface DestinationDetail {
  id: string;
  name: string;
  region: string;
  tagline: string;
  coverUrl: string;
  references: { id: string; name: string; approximate: boolean }[];
  guide: GuideSectionView[];
  places: PlaceView[];
}

export const api = {
  createIdentity: () => request<{ identityId: string; token: string }>('POST', '/api/identity', { skipRecoveryCode: true }, null),
  listTrips: () => request<{ trips: Trip[] }>('GET', '/api/trips'),
  searchDestinations: (q: string) => request<{ destinations: DestinationSummary[] }>('GET', `/api/catalog/destinations?q=${encodeURIComponent(q)}`),
  getDestination: (id: string) => request<{ destination: DestinationDetail }>('GET', `/api/catalog/destinations/${encodeURIComponent(id)}`),
  createTrip: (b: Record<string, unknown>) => request<{ trip: Trip }>('POST', '/api/trips', b),
  getTrip: (id: string) => request<TripDetail>('GET', `/api/trips/${id}`),
  updateTrip: (id: string, b: Record<string, unknown>) => request<{ trip: Trip }>('PATCH', `/api/trips/${id}`, b),
  createItem: (tripId: string, b: Record<string, unknown>) => request<{ item: Item }>('POST', `/api/trips/${tripId}/items`, b),
  updateItem: (tripId: string, id: string, b: Record<string, unknown>) =>
    request<{ item: Item }>('PATCH', `/api/trips/${tripId}/items/${id}`, b),
  deleteItem: (tripId: string, id: string) => request<{ item: Item }>('DELETE', `/api/trips/${tripId}/items/${id}`),
  restoreItem: (tripId: string, id: string) => request<{ item: Item }>('POST', `/api/trips/${tripId}/items/${id}/restore`),
  permanentDelete: (tripId: string, id: string) => request<undefined>('DELETE', `/api/trips/${tripId}/items/${id}/permanent`),
  trash: (tripId: string) => request<{ items: Item[] }>('GET', `/api/trips/${tripId}/trash`),
  setDone: (tripId: string, id: string, done: boolean) =>
    request<{ item: Item }>('PUT', `/api/trips/${tripId}/items/${id}/done`, { done }),
  reorder: (tripId: string, day: string, orderedIds: string[]) =>
    request<{ items: Item[] }>('POST', `/api/trips/${tripId}/days/${day}/reorder`, { orderedIds }),

  // Xác thực và khôi phục (release gate RG-1)
  sessions: () => request<{ sessions: SessionInfo[] }>('GET', '/api/sessions'),
  revokeSession: (id: string) => request<undefined>('DELETE', `/api/sessions/${id}`),
  codeStatus: () => request<{ hasCode: boolean; createdAt: string | null }>('GET', '/api/recovery-code'),
  beginCode: (evidence?: Record<string, unknown>) =>
    request<{ pendingId: string; replacementCode: string; expiresAt: string }>('POST', '/api/recovery-code/begin', evidence ? { evidence } : {}),
  confirmCode: (pendingId: string, replacementCode: string) =>
    request<{ committed: true }>('POST', '/api/recovery-code/confirm', { pendingId, replacementCode }),
  stepUpRequest: () =>
    request<{ requestId: string; approvalCode: string; expiresAt: string }>('POST', '/api/step-up/requests', { operation: 'regenerate_code' }),
  stepUpApprove: (approvalCode: string) => request<{ approved: true }>('POST', '/api/step-up/approve', { approvalCode }),
  approveDevice: (pairingCode: string) => request<{ approved: true }>('POST', '/api/device-links/approve', { pairingCode }),
  recoveryStart: (code: string, attemptId: string, sessionToken: string) =>
    request<{ attemptId: string; replacementCode: string; expiresAt: string }>('POST', '/api/recovery/start', { code, attemptId, sessionToken }, null),
  recoveryComplete: (attemptId: string, replacementCode: string) =>
    request<{ committed: true }>('POST', '/api/recovery/complete', { attemptId, replacementCode }, null),
  deviceLinkCreate: (sessionToken: string) =>
    request<{ requestId: string; pairingCode: string; expiresAt: string }>('POST', '/api/device-links', { sessionToken }, null),
  deviceLinkStatus: (id: string) => request<{ status: 'pending' | 'approved' | 'expired' }>('GET', `/api/device-links/${id}`, undefined, null),
};
