import { ApiError } from './ApiError.ts';
import { CODE_KIND, ERROR_INFO, UNKNOWN_CODE } from './errorMessages.const.ts';
import type { ErrorInfo } from './errorMessages.const.ts';

/** Lỗi đã được mô tả cho giao diện: lời nhắc tiếng Việt + mã nhỏ để hỏi hỗ trợ. */
export interface DescribedError extends ErrorInfo {
  readonly code: string;
}

/** Biến một lỗi bất kỳ thành lời nhắc tiếng Việt theo mã (`ApiError.code`); lỗi lạ coi là lỗi phía Wander. Không bao giờ lộ nội dung lỗi thô. */
export function describeError(error: unknown): DescribedError {
  const code = error instanceof ApiError ? error.code : UNKNOWN_CODE;
  return { ...ERROR_INFO[CODE_KIND.get(code) ?? 'internal'], code };
}
