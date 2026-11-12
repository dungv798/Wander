import { CRASH_DETAIL_MAX_CHARS, CRASH_STACK_LINES } from './errorBoundary.const.ts';

/** Shortens any error to a short string: the message and the first `CRASH_STACK_LINES` lines of the trace, cut at `CRASH_DETAIL_MAX_CHARS` characters. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).slice(0, CRASH_DETAIL_MAX_CHARS);
  const stack = (error.stack ?? '').split('\n').slice(0, CRASH_STACK_LINES).join('\n');
  return `${error.name}: ${error.message}\n${stack}`.slice(0, CRASH_DETAIL_MAX_CHARS);
}
