import { LOOK } from '../shared/const/look.const.ts';

/** A URL outside the hash takes priority; the old trial flag and unknown values do not turn on the old UI. */
export function readClassicLook(location: Pick<Location, 'search' | 'hash'>, storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null): boolean {
  const query = new URLSearchParams(location.search);
  const hashQuery = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const requested = query.get(LOOK.PARAM) ?? hashQuery.get(LOOK.PARAM);
  try {
    if (requested === LOOK.OFF) storage?.removeItem(LOOK.STORAGE);
    if (requested === LOOK.CLASSIC) storage?.setItem(LOOK.STORAGE, LOOK.CLASSIC);
    if (requested !== null) return requested === LOOK.CLASSIC;
    return storage?.getItem(LOOK.STORAGE) === LOOK.CLASSIC;
  } catch {
    return requested === LOOK.CLASSIC;
  }
}

/** Sets the mode before the first render; loads the old CSS and fonts only when the PO chooses classic. */
export function initializeLook(): void {
  // Runs before React; keeps the classic string and removeItem when the URL turns the old mode off.
  // PersistentStore has no key-removal port yet, so this access is kept for compatibility with old data.
  let storage: Storage | null = null;
  try { storage = window.localStorage; } catch { /* The URL still works when storage is blocked. */ }
  if (!readClassicLook(window.location, storage)) return;
  document.documentElement.dataset.look = LOOK.CLASSIC;
  void import('../styles/classic.css').catch(() => {
    delete document.documentElement.dataset.look;
  });
}
