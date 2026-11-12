import { useCallback } from 'react';
import { useReportError } from '../../identity/index.ts';

/** Runs an asynchronous action without waiting for the result ('fire and forget'); a failure shows a Vietnamese error to the user instead of letting the error go unnoticed. */
export function useFire(): (work: Promise<unknown>) => void {
  const report = useReportError();
  return useCallback((work) => void work.catch(report), [report]);
}
