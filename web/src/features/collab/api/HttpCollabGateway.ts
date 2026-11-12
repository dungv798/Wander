import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import type { ChecklistItem, CollabGateway, CreatedInvite, DeletionRequest, InvitePreview, InviteStatus, Joined, Member, MemberRole, RequestStatus } from './CollabGateway.ts';
import { COLLAB_API as P } from './collabApi.const.ts';

type Body = Record<string, unknown>;

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Body {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** The response body must be an object; otherwise an internal error (so the UI never uses broken data). */
function record(v: unknown): Body {
  if (!isRecord(v)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** The `key` element of the response body, required to be an object. */
function part(body: unknown, key: string): Body {
  return record(record(body)[key]);
}

/** The `key` array of the response body; missing is an internal error. */
function list(body: unknown, key: string): unknown[] {
  const value = record(body)[key];
  if (!Array.isArray(value)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** A non-empty string or undefined. */
function str(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

/** An ISO instant to milliseconds; a wrong shape gives NaN. */
function millis(v: unknown): number {
  return typeof v === 'string' ? Date.parse(v) : Number.NaN;
}

/** The role by code; an unknown code gives undefined. */
function roleOf(v: unknown): MemberRole | undefined {
  return v === 'organizer' || v === 'member' ? v : undefined;
}

/** One member from the API; broken gives null (dropped). */
function toMember(raw: unknown): Member | null {
  if (!isRecord(raw)) return null;
  const id = str(raw['id']);
  const displayName = str(raw['displayName']);
  const role = roleOf(raw['role']);
  const joinedAt = millis(raw['joinedAt']);
  return id && displayName && role && !Number.isNaN(joinedAt) ? { id, displayName, role, joinedAt, self: raw['self'] === true } : null;
}

/** One deletion request from the API; broken or an unknown state gives null. */
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

/** One checklist item from the API; broken gives null. */
function toChecklistItem(raw: unknown): ChecklistItem | null {
  if (!isRecord(raw)) return null;
  const id = str(raw['id']);
  const title = str(raw['title']);
  if (!id || !title || typeof raw['position'] !== 'number') return null;
  const doneBy = Array.isArray(raw['doneBy']) ? raw['doneBy'].filter((x): x is string => typeof x === 'string') : [];
  return { id, group: typeof raw['group'] === 'string' ? raw['group'] : '', title, position: raw['position'], done: raw['done'] === true, doneBy };
}

/** The mapped value is required; null means a broken response. */
function required<T>(value: T | null): T {
  if (value === null) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return value;
}

/** Implements `CollabGateway` with the real API; the session secret is attached by `ApiClient`. */
export class HttpCollabGateway implements CollabGateway {
  private readonly client: ApiClient;

  /** Uses the given HTTP client (injectable in tests). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** The path under a trip. */
  private under(tripId: string, suffix: string): string {
    return `${P.TRIPS}/${encodeURIComponent(tripId)}${suffix}`;
  }

  /** The member list; a broken element is dropped. */
  async members(tripId: string): Promise<Member[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.MEMBERS)), P.KEY_MEMBERS).map(toMember).filter((m): m is Member => m !== null);
  }

  /** The state of the existing invite link; null if there is none yet. */
  async invite(tripId: string): Promise<InviteStatus | null> {
    const body = record(await this.client.get<unknown>(this.under(tripId, P.INVITES)));
    const raw = body[P.KEY_INVITE];
    if (raw === null || raw === undefined) return null;
    const invite = record(raw);
    return { id: str(invite['id']) ?? '', createdAt: millis(invite['createdAt']), expiresAt: millis(invite['expiresAt']), active: invite['active'] === true };
  }

  /** Creates a new link; the code is only in this result. */
  async createInvite(tripId: string): Promise<CreatedInvite> {
    const invite = part(await this.client.send<unknown>('POST', this.under(tripId, P.INVITES)), P.KEY_INVITE);
    const code = str(invite['code']);
    const id = str(invite['id']);
    if (!code || !id) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { id, code, expiresAt: millis(invite['expiresAt']) };
  }

  /** Revokes the link in use. */
  async revokeInvite(tripId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, P.INVITE_ACTIVE));
  }

  /** The Organizer removes a member. */
  async removeMember(tripId: string, memberId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.MEMBERS}/${encodeURIComponent(memberId)}`));
  }

  /** Leave the trip yourself. */
  async leave(tripId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, P.ME));
  }

  /** Change your own display name. */
  async rename(tripId: string, displayName: string): Promise<Member> {
    return required(toMember(part(await this.client.send<unknown>('PATCH', this.under(tripId, P.ME), { displayName }), P.KEY_MEMBER)));
  }

  /** Preview a link (public). */
  async preview(code: string): Promise<InvitePreview> {
    const invite = part(await this.client.send<unknown>('POST', `${P.INVITES_BASE}${P.PREVIEW}`, { code }), P.KEY_INVITE);
    if (typeof invite['tripName'] !== 'string' || typeof invite['memberCount'] !== 'number') throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { tripName: invite['tripName'], memberCount: invite['memberCount'] };
  }

  /** Join a trip with a code and a display name. */
  async join(code: string, displayName: string): Promise<Joined> {
    const body = record(await this.client.send<unknown>('POST', `${P.INVITES_BASE}${P.JOIN}`, { code, displayName }));
    const tripId = str(body[P.KEY_TRIP_ID]);
    if (!tripId) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { tripId, member: required(toMember(body[P.KEY_MEMBER])) };
  }

  /** Deletion requests (Organizer: all; member: their own). */
  async requests(tripId: string): Promise<DeletionRequest[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.REQUESTS)), P.KEY_REQUESTS).map(toRequest).filter((r): r is DeletionRequest => r !== null);
  }

  /** Send a request to delete an item. */
  async submitRequest(tripId: string, itemId: string, reason: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, P.REQUESTS), { itemId, reason }), P.KEY_REQUEST)));
  }

  /** Cancel a pending request. */
  async cancelRequest(tripId: string, requestId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}`));
  }

  /** The Organizer approves. */
  async approveRequest(tripId: string, requestId: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}${P.APPROVE}`)), P.KEY_REQUEST)));
  }

  /** The Organizer rejects. */
  async rejectRequest(tripId: string, requestId: string): Promise<DeletionRequest> {
    return required(toRequest(part(await this.client.send<unknown>('POST', this.under(tripId, `${P.REQUESTS}/${encodeURIComponent(requestId)}${P.REJECT}`)), P.KEY_REQUEST)));
  }

  /** The trip's checklist. */
  async checklist(tripId: string): Promise<ChecklistItem[]> {
    return list(await this.client.get<unknown>(this.under(tripId, P.CHECKLIST)), P.KEY_ITEMS).map(toChecklistItem).filter((c): c is ChecklistItem => c !== null);
  }

  /** The Organizer adds an item. */
  async addChecklist(tripId: string, input: { readonly group: string; readonly title: string }): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('POST', this.under(tripId, P.CHECKLIST), input), P.KEY_ITEM)));
  }

  /** The Organizer edits an item. */
  async editChecklist(tripId: string, itemId: string, change: { readonly group?: string; readonly title?: string }): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('PATCH', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}`), change), P.KEY_ITEM)));
  }

  /** The Organizer deletes an item. */
  async removeChecklist(tripId: string, itemId: string): Promise<void> {
    await this.client.send('DELETE', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}`));
  }

  /** Set/clear your own completion mark. */
  async setChecklistDone(tripId: string, itemId: string, done: boolean): Promise<ChecklistItem> {
    return required(toChecklistItem(part(await this.client.send<unknown>('PUT', this.under(tripId, `${P.CHECKLIST}/${encodeURIComponent(itemId)}${P.DONE}`), { done }), P.KEY_ITEM)));
  }
}
