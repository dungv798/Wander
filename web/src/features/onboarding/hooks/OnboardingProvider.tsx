import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';

/** Trạng thái giới thiệu: đã xem xong (hoặc bỏ qua) chưa. Chỉ hiện một lần; muốn xem lại thì vào thẳng địa chỉ `#/onboard`. */
export interface OnboardingState {
  readonly done: boolean;
}

interface OnboardingValue {
  readonly state: OnboardingState;
  /** Ghi nhận đã xem xong hoặc bỏ qua. */
  readonly finish: () => void;
}

const INITIAL: OnboardingState = { done: false };
const OnboardingContext = createContext<OnboardingValue | null>(null);

/** Làm sạch trạng thái đọc từ localStorage: chỉ nhận cờ `done === true`. */
function sanitize(raw: unknown): OnboardingState | null {
  return typeof raw === 'object' && raw !== null ? { done: (raw as Record<string, unknown>)['done'] === true } : null;
}

/** Cấp trạng thái "đã xem giới thiệu" (lưu cục bộ). */
export function OnboardingProvider({ children }: { readonly children: ReactNode }) {
  const [kv] = useState(() => new PersistentStore<OnboardingState>(STORAGE.ONBOARDING, INITIAL, sanitize));
  const state = useStore(kv);
  const value = useMemo<OnboardingValue>(() => ({ state, finish: () => kv.update(() => ({ done: true })) }), [state, kv]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

/** Truy cập trạng thái giới thiệu; ném lỗi nếu quên bọc `OnboardingProvider`. */
export function useOnboarding(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding phải nằm trong OnboardingProvider');
  return ctx;
}
