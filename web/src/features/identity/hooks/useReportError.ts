import { useCallback } from 'react';
import { describeError } from '../../../shared/api/describeError.ts';
import { ERROR_CODE_LABEL } from '../../../shared/api/errorMessages.const.ts';
import { fill } from '../../../shared/const/copy.vi.ts';
import { useToast } from '../../../shared/ui/Toast.tsx';

/** Reports an error with a floating notice that has a Vietnamese prompt and a code label like the error box, without exposing the raw error content. */
export function useReportError(): (error: unknown) => void {
  const toast = useToast();
  return useCallback(
    /** Keeps the error code in the notice so the user can report it to support. */
    (error: unknown): void => {
      const d = describeError(error);
      toast.error(`${d.title}. ${d.text} ${fill(ERROR_CODE_LABEL, { code: d.code })}`);
    },
    [toast],
  );
}
