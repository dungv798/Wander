import { useCallback, useEffect, useState } from 'react';

/** A merged loading state (not two flags that disagree): loading, error or ready (FE standard section 2). */
export type ResourceState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: unknown }
  | { readonly status: 'ready'; readonly data: T };

/**
 * Loads an asynchronous resource, cancelling the old result when the parameters change or the screen is removed (avoiding an overwrite by an old request).
 * `load` receives a cancel signal; returns `retry()` to retry after an error.
 */
export function useResource<T>(load: (signal: AbortSignal) => Promise<T>, deps: readonly unknown[]): { state: ResourceState<T>; retry: () => void } {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the hook's purpose: go to 'loading' at once when the parameters change or on retry
    setState({ status: 'loading' });
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error });
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is deliberately declared by the caller
  }, [...deps, attempt]);

  const retry = useCallback(
    /** Reloads after an error. */
    () => setAttempt((n) => n + 1),
    [],
  );
  return { state, retry };
}
