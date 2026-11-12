/** A key-value storage place (localStorage in the browser, a fake in tests): the D principle of SOLID. */
export interface KeyValueStorage {
  /** Reads the value of a key; null if there is none or it cannot be read. */
  getItem(key: string): string | null;
  /** Writes a value; it can throw when out of space or blocked. */
  setItem(key: string, value: string): void;
}

/** The default storage place: the browser's localStorage, or null when blocked (private mode, thumbnail). */
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

/** Turns data read from storage (untrusted: it may be broken, old or edited by the user by hand) into a valid state; returns `null` if it cannot be rescued. */
export type Sanitizer<T> = (raw: unknown) => T | null;

/**
 * A small store of state with persistence, compatible with `useSyncExternalStore` (one source of truth for each kind of data, FE standard section 6).
 * An immutable state: each change creates a new object. Stored data ALWAYS goes through `sanitize` before use; if broken it falls back to the default
 * so the app does not go blank because of one wrong localStorage key. A change from another tab reloads it (they do not overwrite each other).
 */
export class PersistentStore<T extends object> {
  /** Reads the old key verbatim; a plain string and JSON both keep their format, a blocked store returns null. */
  static readRaw(key: string, storage: Pick<KeyValueStorage, 'getItem'> | null = browserStorage()): string | null {
    try { return storage?.getItem(key) ?? null; } catch { return null; }
  }

  /** Writes verbatim for an existing key; running out of space does not block an action within the session. */
  static writeRaw(key: string, value: string, storage: Pick<KeyValueStorage, 'setItem'> | null = browserStorage()): void {
    try { storage?.setItem(key, value); } catch { /* The state is still used in the current session. */ }
  }

  private state: T;
  private readonly listeners = new Set<() => void>();
  private readonly key: string;
  private readonly initial: T;
  private readonly storage: KeyValueStorage | null;
  private readonly sanitize: Sanitizer<T>;

  /** Creates the store with a default state and a sanitizer; loads the stored value and listens to other tabs. */
  constructor(key: string, initial: T, sanitize: Sanitizer<T>, storage: KeyValueStorage | null = browserStorage()) {
    this.key = key;
    this.initial = initial;
    this.sanitize = sanitize;
    this.storage = storage;
    this.state = this.read();
  }

  /** Reads and cleans the stored value; any error (broken JSON, wrong type, blocked) returns the default. */
  private read(): T {
    try {
      const raw = this.storage?.getItem(this.key);
      return (raw ? this.sanitize(JSON.parse(raw)) : null) ?? this.initial;
    } catch {
      return this.initial;
    }
  }

  /** Another tab changed exactly this key: reload so it does not overwrite that tab's change. */
  private readonly onStorage = (e: StorageEvent): void => {
    if (e.key !== this.key) return;
    this.state = this.read();
    this.listeners.forEach((l) => l());
  };

  /** The snapshot of the current state (a stable reference between two changes, exactly as `useSyncExternalStore` requires). */
  getSnapshot = (): T => this.state;

  /** Subscribes to changes; returns an unsubscribe function. */
  subscribe = (listener: () => void): (() => void) => {
    // listens to other tabs only when someone is subscribed (leaving no orphan listener when the store is abandoned, for example StrictMode building twice)
    if (!this.listeners.size && typeof window !== 'undefined') window.addEventListener('storage', this.onStorage);
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
      if (!this.listeners.size && typeof window !== 'undefined') window.removeEventListener('storage', this.onStorage);
    };
  };

  /** Updates the state with a pure function (takes the old state, returns the new state), saves and then notifies the listeners. */
  update(change: (current: T) => T): void {
    this.state = change(this.state);
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.state));
    } catch {
      /* run without saving: the device is full or blocks storage */
    }
    this.listeners.forEach((l) => l());
  }
}
