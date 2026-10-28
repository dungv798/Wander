import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import type { ChecklistItem, CollabGateway, CreatedInvite, DeletionRequest, InvitePreview, InviteStatus, Joined, Member, MemberRole, RequestStatus } from './CollabGateway.ts';
import { COLLAB_API as P } from './collabApi.const.ts';

type Body = Record<string, unknown>;

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Thân phản hồi phải là đối tượng; không thì lỗi nội bộ (không để giao diện dùng dữ liệu hỏng). */
function record(v: unknown): Body {
  if (!isRecord(v)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** Phần tử `key` của thân phản hồi, bắt buộc là đối tượng. */
function part(body: unknown, key: string): Body {
  return record(record(body)[key]);
}

/** Mảng `key` của thân phản hồi; thiếu là lỗi nội bộ. */
function list(body: unknown, key: string): unknown[] {
  const value = record(body)[key];
  if (!Array.isArray(value)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** Chuỗi không rỗng hoặc undefined. */
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

/** Thời điểm ISO thành mili giây; sai dạng thì NaN. */
function millis(v: unknown): number {
  return typeof v === 'string' ? Date.parse(v) : Number.NaN;
}

/** Vai theo mã; mã lạ thì undefined. */
function roleOf(v: unknown): MemberRole | undefined {
  return v === 'organizer' || v === 'member' ? v : undefined;
}

/** Một thành viên của API; hỏng thì null (bị bỏ). */
function toMember(raw: unknown): Member | null {
  if (!isRecord(raw)) return null;
  const id = str(raw['id']);
  const displayName = str(raw['displayName']);
  const role = roleOf(raw['role']);
  const joinedAt = millis(raw['joinedAt']);
  return id && displayName && role && !Number.isNaN(joinedAt) ? { id, displayName, role, joinedAt, self: raw['self'] === true } : null;
}

/** Một đề nghị xóa của API; hỏng hoặc trạng thái lạ thì null. */
function toRequest(raw: unknown): DeletionRequest | null {
  if (!isRecord(raw)) return null;
  const status = raw['status'];
  const valid: readonly RequestStatus[] = ['pending', 'approved', 'rejected'];
  const id = str(raw['id']);
  const itemId = str(raw['itemId']);
  const requesterId = str(raw['requesterId']);
  const requestedAt = millis(raw['requestedAt']);
  if (!id || !itemId || !requesterId || Number.isNaN(requestedAt) || !valid.includes(status as RequestStatus)) return null;
  const decided = millis(raw['decidedAt']);
  return {
    id, itemId, requesterId, requesterName: str(raw['requesterName']) ?? null, reason: typeof raw['reason'] === 'string' ? raw['reason'] : '',
    status: status as RequestStatus, requestedAt, decidedAt: Number.isNaN(decided) ? null : decided,
  };
}

/** Một hạng mục checklist của API; hỏng thì null. */
function toChecklistItem(raw: unknown): ChecklistItem | null {
  if (!isRecord(raw)) return null;
  const id = str(raw['id']);
  const title = str(raw['title']);
  if (!id || !title || typeof raw['position'] !== 'number') return null;
  const doneBy = Array.isArray(raw['doneBy']) ? raw['doneBy'].filter((x): x is string => typeof x === 'string') : [];
  return { id, group: typeof raw['group'] === 'string' ? raw['group'] : '', title, position: raw['position'], done: raw['done'] === true, doneBy };
}

/** Giá trị đã ánh xạ bắt buộc có; null là phản hồi hỏng. */
function required<T>(value: T | null): T {
  if (value === null) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** Cài đặt `CollabGateway` bằng API thật; bí mật phiên do `ApiClient` gắn. */
export class HttpCollabGateway implements CollabGateway {
  private readonly client: ApiClient;

  /** Dùng máy khách HTTP đã cho (tiêm được khi test). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Đường dẫn dưới một chuyến. */
  private under(tripId: string, suffix: string): string {
    return `${P.TRIPS}/${encodeURIComponent(tripId)}${suffix}`;
  }

  /** Danh sách thành viên; phần tử hỏng bị bỏ. */
  async members(tripId: string): Promise<Member[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.MEMBERS)), P.KEY_MEMBERS).map(toMember).filter((m): m is Member => m !== null);
  }

  /** Trạng thái liên kết mời hiện có; chưa có thì null. */
  async invite(tripId: string): Promise<InviteStatus | null> {
    const body = record(await this.client.get<unknown>(this.under(tripId, P.INVITES)));
    const raw = body[P.KEY_INVITE];
    if (raw === null || raw === undefined) return null;
    const invite = record(raw);
    return { id: str(invite['id']) ?? '', createdAt: millis(invite['createdAt']), expiresAt: millis(invite['expiresAt']), active: invite['active'] === true };
  }

  /** Tạo liên kết mới; mã chỉ có ở kết quả này. */
  async createInvite(tripId: string): Promise<CreatedInvite> {
    const invite = part(await this.client.send<unknown>('POST', this.under(tripId, P.INVITES)), P.KEY_INVITE);
    const code = str(invite['code']);
    const id = str(invite['id']);
    if (!code || !id) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { id, code, expiresAt: millis(invite['expiresAt']) };
  }

  /** Thu hồi liên kết đang dùng. */
  async revokeInvite(tripId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, P.INVITE_ACTIVE));
  }

  /** Organizer gỡ một thành viên. */
  async removeMember(tripId: string, memberId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.MEMBERS}/${encodeURIComponent(memberId)}`));
  }

  /** Tự rời chuyến. */
  async leave(tripId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, P.ME));
  }

  /** Đổi tên hiển thị của mình. */
  async rename(tripId: string, displayName: string): Promise<Member> {
    return required(toMember(part(await this.client.send<unknown>('PATCH', this.under(tripId, P.ME), { displayName }), P.KEY_MEMBER)));
  }

  /** Xem trước liên kết (công khai). */
  async preview(code: string): Promise<InvitePreview> {
    const invite = part(await this.client.send<unknown>('POST', `${P.INVITES_BASE}${P.PREVIEW}`, { code }), P.KEY_INVITE);
    if (typeof invite['tripName'] !== 'string' || typeof invite['memberCount'] !== 'number') throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { tripName: invite['tripName'], memberCount: invite['memberCount'] };
  }

  /** Vào chuyến bằng mã và tên hiển thị. */
  async join(code: string, displayName: string): Promise<Joined> {
    const body = record(await this.client.send<unknown>('POST', `${P.INVITES_BASE}${P.JOIN}`, { code, displayName }));
    const tripId = str(body[P.KEY_TRIP_ID]);
    if (!tripId) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { tripId, member: required(toMember(body[P.KEY_MEMBER])) };
  }

  /** Đề nghị xóa (Organizer: tất cả; thành viên: của mình). */
  async requests(tripId: string): Promise<DeletionRequest[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.REQUESTS)), P.KEY_REQUESTS).map(toRequest).filter((r): r is DeletionRequest => r !== null);
  }

  /** Gửi đề nghị xóa một mục. */
  async submitRequest(tripId: string, itemId: string, reason: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, P.REQUESTS), { itemId, reason }), P.KEY_REQUEST)));
  }

  /** Hủy đề nghị còn chờ. */
  async cancelRequest(tripId: string, requestId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}`));
  }

  /** Organizer đồng ý. */
  async approveRequest(tripId: string, requestId: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}${P.APPROVE}`)), P.KEY_REQUEST)));
  }

  /** Organizer từ chối. */
  async rejectRequest(tripId: string, requestId: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}${P.REJECT}`)), P.KEY_REQUEST)));
  }

  /** Checklist của chuyến. */
  async checklist(tripId: string): Promise<ChecklistItem[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.CHECKLIST)), P.KEY_ITEMS).map(toChecklistItem).filter((c): c is ChecklistItem => c !== null);
  }

  /** Organizer thêm hạng mục. */
  async addChecklist(tripId: string, input: { readonly group: string; readonly title: string }): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('POST', this.under(tripId, P.CHECKLIST), input), P.KEY_ITEM)));
  }

  /** Organizer sửa hạng mục. */
  async editChecklist(tripId: string, itemId: string, change: { readonly group?: string; readonly title?: string }): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('PATCH', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}`), change), P.KEY_ITEM)));
  }

  /** Organizer xóa hạng mục. */
  async removeChecklist(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}`));
  }

  /** Đặt/bỏ dấu hoàn thành của chính mình. */
  async setChecklistDone(tripId: string, itemId: string, done: boolean): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('PUT', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}${P.DONE}`), { done }), P.KEY_ITEM)));
  }
}
