import { CRASH_DETAIL_MAX_CHARS, CRASH_STACK_LINES } from './errorBoundary.const.ts';

/** Rút gọn một lỗi bất kỳ thành chuỗi ngắn: thông điệp và `CRASH_STACK_LINES` dòng đầu của dấu vết, cắt ở `CRASH_DETAIL_MAX_CHARS` ký tự. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).slice(0, CRASH_DETAIL_MAX_CHARS);
  const stack = (error.stack ?? '').split('\n').slice(0, CRASH_STACK_LINES).join('\n');
  return `${error.name}: ${error.message}\n${stack}`.slice(0, CRASH_DETAIL_MAX_CHARS);
}
