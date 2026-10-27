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

/** Có phải đối tượng thường. */
function isRecord(v: unknown): v is Json {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Lấy trường chuỗi bắt buộc; thiếu hoặc sai kiểu thì phản hồi hỏng (`INTERNAL`). */
function text(body: unknown, key: string): string {
  const v = isRecord(body) ? body[key] : undefined;
  if (typeof v !== 'string' || !v) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** Lấy trường số bắt buộc. */
function num(body: unknown, key: string): number {
  const v = isRecord(body) ? body[key] : undefined;
  if (typeof v !== 'number') throw new ApiError(CLIENT_ERROR.INTERNAL);
  return v;
}

/** Thời điểm ISO bắt buộc thành mili giây. */
function when(body: unknown, key: string): number {
  const t = Date.parse(text(body, key));
  if (Number.isNaN(t)) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return t;
}

/** Ba lựa chọn số khớp từ phản hồi `preview`; sai hình dạng thì phản hồi hỏng. */
function options(body: unknown): number[] {
  const list = isRecord(body) ? body['options'] : undefined;
  if (!Array.isArray(list) || !list.every((n) => typeof n === 'number')) throw new ApiError(CLIENT_ERROR.INTERNAL);
  return list as number[];
}

/** Tên thiết bị tự khai trong phản hồi, hoặc null nếu chưa đặt. */
function optionalText(body: unknown, key: string): string | null {
  const v = isRecord(body) ? body[key] : undefined;
  return typeof v === 'string' && v ? v : null;
}

/**
 * Cài đặt `IdentityGateway` bằng API thật. Bí mật phiên do `ApiClient` gắn (nguồn tiêu đề), trừ các lời gọi công khai
 * (tạo danh tính, khôi phục, ghép) không cần phiên. Mọi thất bại là `ApiError` có mã của backend.
 */
export class HttpIdentityGateway implements IdentityGateway {
  private readonly client: ApiClient;
  private readonly fallbackName: string;

  /** Dùng máy khách HTTP đã cho; `fallbackName` là tên hiện cho thiết bị chưa tự đặt tên. */
  constructor(client: ApiClient, fallbackName: string) {
    this.client = client;
    this.fallbackName = fallbackName;
  }

  /** Tạo danh tính ẩn danh (bỏ qua mã khôi phục lúc này) và trả bí mật phiên của máy này. */
  async createIdentity(deviceName: string): Promise<string> {
    const body = await this.client.send<unknown>('POST', P.IDENTITY, { skipRecoveryCode: true, deviceName });
    return text(body, 'token');
  }

  /** Gộp phiên, nhật ký và trạng thái mã thành ảnh chụp danh tính; phản hồi sai dạng là lỗi nội bộ. */
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

  /** Đánh dấu chủ đã xem hoạt động mới. */
  async markSeen(): Promise<void> {
    await this.client.send('POST', P.EVENTS_SEEN);
  }

  /** Thu hồi một thiết bị tin cậy theo mã thiết bị. */
  async revoke(deviceId: string): Promise<void> {
    await this.client.send('DELETE', `${P.SESSIONS}/${encodeURIComponent(deviceId)}`);
  }

  /** Đổi tên thiết bị đang dùng. */
  async rename(name: string): Promise<void> {
    await this.client.send('PATCH', P.CURRENT_SESSION, { deviceName: name });
  }

  /** Pha 1 phát mã thay thế: máy chủ sinh mã, mã cũ vẫn còn hiệu lực tới khi xác nhận; có mã hiện hành thì cần bằng chứng. */
  async beginReplacement(evidence?: Evidence): Promise<BegunReplacement> {
    const body = await this.client.send<unknown>('POST', P.CODE_BEGIN, evidence ? { evidence } : {});
    return { pendingId: text(body, 'pendingId'), code: text(body, 'replacementCode'), expiresAt: when(body, 'expiresAt') };
  }

  /** Pha 2 phát mã thay thế: nhập lại đúng mã thì mã mới có hiệu lực. */
  async confirmReplacement(pendingId: string, code: string): Promise<void> {
    await this.client.send('POST', P.CODE_CONFIRM, { pendingId, replacementCode: code });
  }

  /** Xin phê duyệt xác thực lại từ thiết bị tin cậy khác cho thao tác tạo mã mới. */
  async requestStepUp(): Promise<StepUpRequested> {
    const body = await this.client.send<unknown>('POST', P.STEP_UP_REQUESTS, { operation: P.OPERATION_REGENERATE });
    return { requestId: text(body, 'requestId'), approvalCode: text(body, 'approvalCode'), number: num(body, 'matchNumber'), expiresAt: when(body, 'expiresAt') };
  }

  /** Bắt đầu khôi phục bằng mã; trả mã thay thế do máy chủ sinh (lần thử hết hạn sau 15 phút). */
  async startRecovery(code: string, attemptId: string, sessionToken: string, deviceName: string): Promise<RecoveryStarted> {
    const body = await this.client.send<unknown>('POST', P.RECOVERY_START, { code, attemptId, sessionToken, deviceName });
    return { attemptId, code: text(body, 'replacementCode'), expiresAt: when(body, 'expiresAt') };
  }

  /** Hoàn tất khôi phục: xác nhận mã thay thế để phiên của máy này có hiệu lực. */
  async completeRecovery(attemptId: string, replacementCode: string): Promise<void> {
    await this.client.send('POST', P.RECOVERY_COMPLETE, { attemptId, replacementCode });
  }

  /** Máy mới xin ghép: nhận mã ghép, số khớp và hạn. */
  async createLink(sessionToken: string, deviceName: string): Promise<LinkCreated> {
    const body = await this.client.send<unknown>('POST', P.LINKS, { sessionToken, deviceName });
    return { requestId: text(body, 'requestId'), pairingCode: text(body, 'pairingCode'), number: num(body, 'matchNumber'), expiresAt: when(body, 'expiresAt') };
  }

  /** Trạng thái yêu cầu ghép của máy mới; giá trị lạ là lỗi nội bộ. */
  async linkStatus(requestId: string): Promise<PairingStatus> {
    const body = await this.client.get<unknown>(`${P.LINKS}/${encodeURIComponent(requestId)}`);
    const status = text(body, 'status');
    if (status !== 'pending' && status !== 'approved' && status !== 'denied' && status !== 'expired') throw new ApiError(CLIENT_ERROR.INTERNAL);
    return status;
  }

  /** Xem trước yêu cầu theo mã: thử mã ghép rồi mã duyệt; sai ở cả hai thì một lỗi chung. */
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
      // sai ở cả hai nơi: một thông báo chung, không lộ mã thuộc loại nào (MĐ-8)
      if (e instanceof ApiError && e.code === P.INVALID_APPROVAL_CODE) throw new ApiError(P.INVALID_PAIRING_CODE, e.status);
      throw e;
    }
  }

  /** Trả lời bằng số khớp: đúng là duyệt, chọn sai là `wrong` (yêu cầu bị từ chối vĩnh viễn). */
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

  /** Từ chối chủ động một yêu cầu ghép hoặc xác thực lại. */
  async deny(preview: ApprovalPreview): Promise<void> {
    const link = preview.kind === 'link';
    await this.client.send('POST', link ? P.LINK_DENY : P.STEP_UP_DENY, link ? { pairingCode: preview.code } : { approvalCode: preview.code });
  }
}
