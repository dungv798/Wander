import { useSyncExternalStore } from 'react';

/**
 * Lựa chọn khám phá lưu tạm trong trình duyệt (chưa có API lưu giỏ: DR-006 cần migration "mục chưa có ngày").
 * Không chứa bí mật; mất khi xóa dữ liệu trình duyệt. Mã địa điểm là chuỗi do kho biên tập đặt (ADR-010).
 */
const KEY = 'wander.discover.v1';

export interface DiscoverState {
  decisions: Record<string, 'like' | 'skip'>;
  history: string[];
  photo: Record<string, number>;
  cat: string;
  guide: string | null;
  pack: Record<string, boolean>;
  /** Điểm đến xem gần nhất, để màn Đã chọn biết lấy dữ liệu của điểm đến nào. */
  lastDest: string;
}

const EMPTY: DiscoverState = { decisions: {}, history: [], photo: {}, cat: 'all', guide: 'mua', pack: {}, lastDest: 'ha-giang' };

function load(): DiscoverState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<DiscoverState>;
    const plainObj = (v: unknown): Record<string, unknown> => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
    const decisions = Object.fromEntries(Object.entries(plainObj(p.decisions)).filter(([, v]) => v === 'like' || v === 'skip')) as Record<string, 'like' | 'skip'>;
    const photo = Object.fromEntries(Object.entries(plainObj(p.photo)).filter(([, v]) => typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 20)) as Record<string, number>;
    const pack = Object.fromEntries(Object.entries(plainObj(p.pack)).filter(([, v]) => typeof v === 'boolean')) as Record<string, boolean>;
    return {
      decisions,
      history: Array.isArray(p.history) ? p.history.filter((x): x is string => typeof x === 'string') : [],
      photo,
      cat: typeof p.cat === 'string' ? p.cat : 'all',
      guide: typeof p.guide === 'string' || p.guide === null ? (p.guide ?? null) : 'mua',
      pack,
      lastDest: typeof p.lastDest === 'string' && /^[a-z0-9-]{1,60}$/.test(p.lastDest) ? p.lastDest : 'ha-giang',
    };
  } catch {
    return EMPTY;
  }
}

let state: DiscoverState = load();
const listeners = new Set<() => void>();

function set(next: DiscoverState): void {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* trình duyệt chặn lưu trữ: lựa chọn chỉ sống trong phiên này */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export const useDiscover = (): DiscoverState => useSyncExternalStore(subscribe, () => state);

export const discover = {
  /** Xóa lựa chọn khám phá (khi đăng xuất, để người dùng sau không thừa hưởng lựa chọn của người trước). */
  reset() {
    set(EMPTY);
  },
  decide(placeId: string, dir: 'like' | 'skip') {
    set({ ...state, decisions: { ...state.decisions, [placeId]: dir }, history: [...state.history.filter((x) => x !== placeId), placeId] });
  },
  undo(): string | null {
    const last = state.history[state.history.length - 1];
    if (!last) return null;
    const { [last]: _removed, ...rest } = state.decisions;
    set({ ...state, decisions: rest, history: state.history.slice(0, -1) });
    return last;
  },
  unpick(placeId: string) {
    const { [placeId]: _removed, ...rest } = state.decisions;
    set({ ...state, decisions: rest, history: state.history.filter((x) => x !== placeId) });
  },
  restoreSkipped() {
    const decisions = Object.fromEntries(Object.entries(state.decisions).filter(([, v]) => v === 'like'));
    set({ ...state, decisions, history: state.history.filter((id) => decisions[id] === 'like') });
  },
  setPhoto(placeId: string, index: number) {
    set({ ...state, photo: { ...state.photo, [placeId]: index } });
  },
  visit(destId: string) {
    if (state.lastDest !== destId) set({ ...state, lastDest: destId });
  },
  setCat(cat: string) {
    set({ ...state, cat });
  },
  toggleGuide(id: string) {
    set({ ...state, guide: state.guide === id ? null : id });
  },
  togglePack(key: string) {
    set({ ...state, pack: { ...state.pack, [key]: !state.pack[key] } });
  },
};
