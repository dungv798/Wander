import { useCallback, useEffect, useState } from 'react';

/** The result of `useLoaded`: the latest data (the old copy is kept while reloading), the most recent load error and the reload function. */
export interface Loaded<T> {
  readonly data: T | null;
  readonly error: unknown;
  readonly reload: () => void;
}

/**
 * Loads a list from the server when `deps` change and when `reload()` is called. Unlike `useResource`: KEEPS the old data while reloading so the list does not
 * flicker after every action. The result of an old load is dropped when a new load starts or the screen is removed.
 */
export function useLoaded<T>(load: () => Promise<T>, deps: readonly unknown[]): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let live = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- when the parameter changes (for example to another trip) the old parameter's data is dropped
    setData(null);
    load().then((value) => {
      if (!live) return;
      setData(value);
      setError(null);
    }).catch((e: unknown) => {
      if (live) setError(e);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is deliberately declared by the caller
  }, [...deps, round]);

  useEffect(() => {
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') setRound((n) => n + 1);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const reload = useCallback(
    /** Reload (after a write action). */
    () => setRound((n) => n + 1),
    [],
  );
  return { data, error, reload };
}
