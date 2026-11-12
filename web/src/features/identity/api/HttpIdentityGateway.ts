import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR } from '../../../shared/api/http.const.ts';
import type { IdentitySnapshot, PairingStatus } from '../model/identity.types.ts';
import { toSnapshot } from '../model/identitySnapshot.ts';
import { IDENTITY_API as P } from './identityApi.const.ts';
import type {
  AnswerOutcome,
  ApprovalPreview,
  BegunReplacement,
  Evidence,
  IdentityGateway,
  LinkCreated,
  RecoveryStarted,
  StepUpRequested,
} from './IdentityGateway.ts';

type Json = Record<string, unknown>;

/** Whether it is a plain object. */
function isRecord(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Gets a required string field; missing or of the wrong type means a broken response (`INTERNAL`). */
function text(body: unknown, key: string): string {
  const v = isRecord(body) ? body[key] : undefined;
  if (typeof v !== 'string' || !v) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** Gets a required number field. */
function num(body: unknown, key: string): number {
  const v = isRecord(body) ? body[key] : undefined;
  if (typeof v !== 'number') throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** A required ISO instant as milliseconds. */
function when(body: unknown, key: string): number {
  const t = Date.parse(text(body, key));
  if (Number.isNaN(t)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return t;
}

/** The three matching-number choices from the `preview` response; a wrong shape means a broken response. */
function options(body: unknown): number[] {
  const list = isRecord(body) ? body['options'] : undefined;
  if (!Array.isArray(list) || !list.every((n) => typeof n === 'number')) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return list as number[];
}

/** The self-declared device name in the response, or null if not set. */
function optionalText(body: unknown, key: string): string | null {
  const v = isRecord(body) ? body[key] : undefined;
  return typeof v === 'string' && v ? v : null;
}

/**
 * Implements `IdentityGateway` with the real API. The session secret is attached by `ApiClient` (the header source), except for the public calls
 * (create identity, recovery, pairing) that need no session. Every failure is an `ApiError` with the backend's code.
 */
export class HttpIdentityGateway implements IdentityGateway {
  private readonly client: ApiClient;
  private readonly fallbackName: string;

  /** Uses the given HTTP client; `fallbackName` is the name shown for a device that has not named itself. */
  constructor(client: ApiClient, fallbackName: string) {
    this.client = client;
    this.fallbackName = fallbackName;
  }

  /** Creates an anonymous identity (skipping the recovery code for now) and returns this device's session secret. */
  async createIdentity(deviceName: string): Promise<string> {
    const body = await this.client.send<unknown>('POST', P.IDENTITY, { skipRecoveryCode: true, deviceName });
    return text(body, 'token');
  }

  /** Merges the sessions, the log and the code status into an identity snapshot; a wrongly shaped response is an internal error. */
  async snapshot(): Promise<IdentitySnapshot> {
    const [sessions, events, code] = await Promise.all([
      this.client.get<unknown>(P.SESSIONS),
      this.client.get<unknown>(P.EVENTS),
      this.client.get<unknown>(P.CODE_STATUS),
    ]);
    const snapshot = toSnapshot(sessions, events, code, this.fallbackName);
    if (!snapshot) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return snapshot;
  }

  /** Marks that the owner has seen the new activity. */
  async markSeen(): Promise<void> {
    await this.client.send('POST', P.EVENTS_SEEN);
  }

  /** Revokes a trusted device by device id. */
  async revoke(deviceId: string): Promise<void> {
    await this.client.send('DELETE', `${P.SESSIONS}/${encodeURIComponent(deviceId)}`);
  }

  /** Renames the device in use. */
  async rename(name: string): Promise<void> {
    await this.client.send('PATCH', P.CURRENT_SESSION, { deviceName: name });
  }

  /** Phase 1 of issuing a replacement code: the server generates the code, the old code stays valid until confirmation; with a current code, evidence is needed. */
  async beginReplacement(evidence?: Evidence): Promise<BegunReplacement> {
    const body = await this.client.send<unknown>('POST', P.CODE_BEGIN, evidence ? { evidence } : {});
    return { pendingId: text(body, 'pendingId'), code: text(body, 'replacementCode'), expiresAt: when(body, 'expiresAt') };
  }

  /** Phase 2 of issuing a replacement code: typing the code again correctly makes the new code take effect. */
  async confirmReplacement(pendingId: string, code: string): Promise<void> {
    await this.client.send('POST', P.CODE_CONFIRM, { pendingId, replacementCode: code });
  }

  /** Asks for a re-authentication approval from another trusted device for the action of creating a new code. */
  async requestStepUp(): Promise<StepUpRequested> {
    const body = await this.client.send<unknown>('POST', P.STEP_UP_REQUESTS, { operation: P.OPERATION_REGENERATE });
    return { requestId: text(body, 'requestId'), approvalCode: text(body, 'approvalCode'), number: num(body, 'matchNumber'), expiresAt: when(body, 'expiresAt') };
  }

  /** Starts recovery with a code; returns the replacement code generated by the server (the attempt expires after 15 minutes). */
  async startRecovery(code: string, attemptId: string, sessionToken: string, deviceName: string): Promise<RecoveryStarted> {
    const body = await this.client.send<unknown>('POST', P.RECOVERY_START, { code, attemptId, sessionToken, deviceName });
    return { attemptId, code: text(body, 'replacementCode'), expiresAt: when(body, 'expiresAt') };
  }

  /** Completes recovery: confirming the replacement code makes this device's session take effect. */
  async completeRecovery(attemptId: string, replacementCode: string): Promise<void> {
    await this.client.send('POST', P.RECOVERY_COMPLETE, { attemptId, replacementCode });
  }

  /** A new device asks to be paired: receives the pairing code, the matching number and the time limit. */
  async createLink(sessionToken: string, deviceName: string): Promise<LinkCreated> {
    const body = await this.client.send<unknown>('POST', P.LINKS, { sessionToken, deviceName });
    return { requestId: text(body, 'requestId'), pairingCode: text(body, 'pairingCode'), number: num(body, 'matchNumber'), expiresAt: when(body, 'expiresAt') };
  }

  /** The pairing-request status of the new device; an unknown value is an internal error. */
  async linkStatus(requestId: string, signal?: AbortSignal): Promise<PairingStatus> {
    const body = await this.client.get<unknown>(`${P.LINKS}/${encodeURIComponent(requestId)}`, signal);
    const status = text(body, 'status');
    if (status !== 'pending' && status !== 'approved' && status !== 'denied' && status !== 'expired') throw new ApiError(CLIENT_ERROR.INTERNAL);
    return status;
  }

  /** Previews a request by code: tries the pairing code and then the approval code; wrong in both gives one common error. */
  async preview(code: string): Promise<ApprovalPreview> {
    try {
      const body = await this.client.send<unknown>('POST', P.LINK_PREVIEW, { pairingCode: code });
      return { kind: 'link', code, deviceName: optionalText(body, 'deviceName'), createdAt: when(body, 'createdAt'), options: options(body) };
    } catch (e) {
      if (!(e instanceof ApiError) || e.code !== P.INVALID_PAIRING_CODE) throw e;
    }
    try {
      const body = await this.client.send<unknown>('POST', P.STEP_UP_PREVIEW, { approvalCode: code });
      return { kind: 'stepUp', code, deviceName: optionalText(body, 'requesterDeviceName'), createdAt: when(body, 'createdAt'), options: options(body) };
    } catch (e) {
      // wrong in both places: one common message that does not reveal which kind the code is (MĐ-8)
      if (e instanceof ApiError && e.code === P.INVALID_APPROVAL_CODE) throw new ApiError(P.INVALID_PAIRING_CODE, e.status);
      throw e;
    }
  }

  /** Answers with the matching number: right approves, a wrong choice is `wrong` (the request is denied for good). */
  async answer(preview: ApprovalPreview, number: number): Promise<AnswerOutcome> {
    const link = preview.kind === 'link';
    try {
      await this.client.send(
        'POST',
        link ? P.LINK_APPROVE : P.STEP_UP_APPROVE,
        link ? { pairingCode: preview.code, number } : { approvalCode: preview.code, number },
      );
      return 'approved';
    } catch (e) {
      if (e instanceof ApiError && e.code === P.MATCH_MISMATCH) return 'wrong';
      throw e;
    }
  }

  /** Actively denies a pairing or re-authentication request. */
  async deny(preview: ApprovalPreview): Promise<void> {
    const link = preview.kind === 'link';
    await this.client.send('POST', link ? P.LINK_DENY : P.STEP_UP_DENY, link ? { pairingCode: preview.code } : { approvalCode: preview.code });
  }
}
