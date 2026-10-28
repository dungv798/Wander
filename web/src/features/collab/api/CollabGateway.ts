/** Vai trong chuyến (Q6). */
export type MemberRole = 'organizer' | 'member';

/** Một thành viên; {@code self} đánh dấu chính người đang xem. Không có mã danh tính. */
export interface Member {
  readonly id: string;
  readonly displayName: string;
  readonly role: MemberRole;
  readonly joinedAt: number;
  readonly self: boolean;
}

/** Trạng thái liên kết mời hiện có (KHÔNG có mã). */
export interface InviteStatus {
  readonly id: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly active: boolean;
}

/** Liên kết vừa tạo: mã chỉ có ở đây, đúng một lần. */
export interface CreatedInvite {
  readonly id: string;
  readonly code: string;
  readonly expiresAt: number;
}

/** Xem trước một liên kết mời còn dùng được. */
export interface InvitePreview {
  readonly tripName: string;
  readonly memberCount: number;
}

/** Kết quả vào chuyến. */
export interface Joined {
  readonly tripId: string;
  readonly member: Member;
}

/** Trạng thái đề nghị xóa. */
export type RequestStatus = 'pending' | 'approved' | 'rejected';

/** Một đề nghị xóa mục. {@code requesterName} null nếu người đề nghị đã rời chuyến. */
export interface DeletionRequest {
  readonly id: string;
  readonly itemId: string;
  readonly requesterId: string;
  readonly requesterName: string | null;
  readonly reason: string;
  readonly status: RequestStatus;
  readonly requestedAt: number;
  readonly decidedAt: number | null;
}

/** Một hạng mục checklist: {@code done} là của chính người xem, {@code doneBy} là mã những thành viên đã xong. */
export interface ChecklistItem {
  readonly id: string;
  readonly group: string;
  readonly title: string;
  readonly position: number;
  readonly done: boolean;
  readonly doneBy: readonly string[];
}

/** Cổng tới API cộng tác. Mọi thất bại là `ApiError` có mã của backend. */
export interface CollabGateway {
  members(tripId: string): Promise<Member[]>;
  /** Trạng thái liên kết mời (chỉ Organizer); chưa có thì null. */
  invite(tripId: string): Promise<InviteStatus | null>;
  createInvite(tripId: string): Promise<CreatedInvite>;
  revokeInvite(tripId: string): Promise<void>;
  removeMember(tripId: string, memberId: string): Promise<void>;
  leave(tripId: string): Promise<void>;
  rename(tripId: string, displayName: string): Promise<Member>;
  preview(code: string): Promise<InvitePreview>;
  join(code: string, displayName: string): Promise<Joined>;
  requests(tripId: string): Promise<DeletionRequest[]>;
  submitRequest(tripId: string, itemId: string, reason: string): Promise<DeletionRequest>;
  cancelRequest(tripId: string, requestId: string): Promise<void>;
  approveRequest(tripId: string, requestId: string): Promise<DeletionRequest>;
  rejectRequest(tripId: string, requestId: string): Promise<DeletionRequest>;
  checklist(tripId: string): Promise<ChecklistItem[]>;
  addChecklist(tripId: string, input: { readonly group: string; readonly title: string }): Promise<ChecklistItem>;
  editChecklist(tripId: string, itemId: string, change: { readonly group?: string; readonly title?: string }): Promise<ChecklistItem>;
  removeChecklist(tripId: string, itemId: string): Promise<void>;
  setChecklistDone(tripId: string, itemId: string, done: boolean): Promise<ChecklistItem>;
}
