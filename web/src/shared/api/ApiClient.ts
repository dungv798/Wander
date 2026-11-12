import { ApiError } from './ApiError.ts';
import { ABORT_ERROR_NAME, CLIENT_ERROR, HEADER, HTTP } from './http.const.ts';

/** Phần tối thiểu của `fetch` mà `ApiClient` cần (tiêm được khi test). */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Nguồn tiêu đề bổ sung cho MỖI lời gọi (ví dụ `Authorization: Bearer …`); gọi lại mỗi lần nên bí mật đổi là có hiệu lực ngay. */
export type HeaderSource = () => Record<string, string>;

/** Phần tối thiểu của bộ theo dõi lời gọi mà `ApiClient` cần: báo bắt đầu, trả hàm báo kết thúc (B-05). */
export interface RequestObserver {
  readonly begin: () => () => void;
}

/** Có phải lỗi hủy: `AbortError` của `fetch`/`json()`, hoặc bất kỳ lỗi nào khi `signal` đã bị hủy (hủy bằng `abort(lý do)` ném chính lý do). */
function isAbort(e: unknown, signal?: AbortSignal): boolean {
  if (signal?.aborted) return true;
  return typeof e === 'object' && e !== null && (e as { name?: unknown }).name === ABORT_ERROR_NAME;
}

/** Lỗi từ phản hồi không thành công: lấy mã từ thân `{error:{code}}` của backend; thân không đọc được ⇒ `INTERNAL`. Không bao giờ lộ lời báo thô; hủy khi đang đọc thân được ném lại. */
async function toApiError(res: Response, signal?: AbortSignal): Promise<ApiError> {
  try {
    const body = (await res.json()) as { error?: { code?: unknown } } | null;
    const code = body?.error?.code;
    if (typeof code === 'string' && code) return new ApiError(code, res.status);
  } catch (e) {
    if (isAbort(e, signal)) throw e;
    // thân không phải JSON (cổng proxy trả HTML…): rơi xuống INTERNAL bên dưới
  }
  return new ApiError(CLIENT_ERROR.INTERNAL, res.status);
}

/**
 * Máy khách HTTP duy nhất của giao diện: gọi `/api/**` bằng JSON, đổi mọi thất bại thành `ApiError` có mã (khớp
 * `docs/ux/error-codes.md`) để màn hình chọn lời nhắc tiếng Việt. Hủy bằng `AbortSignal` (ở bước gọi hoặc đang đọc thân) được
 * ném lại nguyên dạng, không bao giờ bị gán nhầm là lỗi mạng hay lỗi máy chủ.
 * Tiêm `fetch` và nguồn tiêu đề để kiểm thử mà không cần mạng.
 */
export class ApiClient {
  private readonly fetchImpl: FetchLike;
  private readonly extraHeaders: HeaderSource;
  private readonly observer: RequestObserver | undefined;

  /** Tạo máy khách; mặc định dùng `fetch` của trình duyệt và không thêm tiêu đề nào. */
  constructor(fetchImpl: FetchLike = (input, init) => fetch(input, init), extraHeaders: HeaderSource = () => ({}), observer?: RequestObserver) {
    this.fetchImpl = fetchImpl;
    this.extraHeaders = extraHeaders;
    this.observer = observer;
  }

  /** GET một đường dẫn và trả JSON đã phân tích. */
  get<T>(path: string, signal?: AbortSignal): Promise<T> {
    return this.send<T>('GET', path, undefined, signal);
  }

  /**
   * Gửi một yêu cầu; `body` (nếu có) được mã hóa JSON. Trả JSON đã phân tích, hoặc `undefined` khi máy chủ trả 204.
   * Mất kết nối ⇒ `ApiError('NETWORK')`; mã HTTP lỗi ⇒ `ApiError` mang mã của backend; thân 2xx hỏng ⇒ `ApiError('INTERNAL')`.
   */
  async send<T = unknown>(method: string, path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
    const done = this.observer?.begin();
    try {
      return await this.exchange<T>(method, path, body, signal);
    } finally {
      done?.();
    }
  }

  /** Một vòng gửi và đọc phản hồi (tách khỏi `send` để `send` luôn báo kết thúc cho bộ theo dõi). */
  private async exchange<T>(method: string, path: string, body: unknown, signal: AbortSignal | undefined): Promise<T> {
    const headers: Record<string, string> = { [HEADER.ACCEPT]: HEADER.JSON, ...this.extraHeaders() };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers[HEADER.CONTENT_TYPE] = HEADER.JSON;
      init.body = JSON.stringify(body);
    }
    if (signal) init.signal = signal;

    let res: Response;
    try {
      res = await this.fetchImpl(path, init);
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new ApiError(CLIENT_ERROR.NETWORK);
    }
    if (!res.ok) throw await toApiError(res, signal);
    if (res.status === HTTP.NO_CONTENT) return undefined as T;
    try {
      return (await res.json()) as T;
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      throw new ApiError(CLIENT_ERROR.INTERNAL, res.status);
    }
  }
}
