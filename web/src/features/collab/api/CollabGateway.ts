/** The role in a trip (Q6). */
export type MemberRole = 'organizer' | 'member';

/** One member; {@code self} marks the person who is viewing. There is no identity id. */
export interface Member {
  readonly id: string;
  readonly displayName: string;
  readonly role: MemberRole;
  readonly joinedAt: number;
  readonly self: boolean;
}

/** The state of the existing invite link (NO code). */
export interface InviteStatus {
  readonly id: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly active: boolean;
}

/** The link that was just created: the code is only here, exactly once. */
export interface CreatedInvite {
  readonly id: string;
  readonly code: string;
  readonly expiresAt: number;
}

/** A preview of an invite link that is still usable. */
export interface InvitePreview {
  readonly tripName: string;
  readonly memberCount: number;
}

/** The result of joining a trip. */
export interface Joined {
  readonly tripId: string;
  readonly member: Member;
}

/** The state of a deletion request. */
export type RequestStatus = 'pending' | 'approved' | 'rejected';

/** A request to delete an item. {@code requesterName} is null if the requester has left the trip. */
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

/** A checklist item: {@code done} is the viewer's own, {@code doneBy} are the ids of the members who finished. */
export interface ChecklistItem {
  readonly id: string;
  readonly group: string;
  readonly title: string;
  readonly position: number;
  readonly done: boolean;
  readonly doneBy: readonly string[];
}

/** The gateway to the collaboration API. Every failure is an `ApiError` with the backend's code. */
export interface CollabGateway {
  members(tripId: string): Promise<Member[]>;
  /** The state of the invite link (Organizer only); null if there is none yet. */
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
