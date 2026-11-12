import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { STORAGE } from '../../../shared/const/app.const.ts';
import { useStore } from '../../../shared/hooks/useStore.ts';
import { PersistentStore } from '../../../shared/state/PersistentStore.ts';

/** The intro state: has it been watched to the end (or skipped). It shows only once; to watch again go straight to the address `#/onboard`. */
export interface OnboardingState {
  readonly done: boolean;
}

interface OnboardingValue {
  readonly state: OnboardingState;
  /** Records it as watched to the end or skipped. */
  readonly finish: () => void;
}

const INITIAL: OnboardingState = { done: false };
const OnboardingContext = createContext<OnboardingValue | null>(null);

/** Cleans the state read from localStorage: only accepts the flag `done === true`. */
function sanitize(raw: unknown): OnboardingState | null {
  return typeof raw === 'object' && raw !== null ? { done: (raw as Record<string, unknown>)['done'] === true } : null;
}

/** Provides the 'intro watched' state (stored locally). */
export function OnboardingProvider({ children }: { readonly children: ReactNode }) {
  const [kv] = useState(() => new PersistentStore<OnboardingState>(STORAGE.ONBOARDING, INITIAL, sanitize));
  const state = useStore(kv);
  const value = useMemo<OnboardingValue>(() => ({ state, finish: () => kv.update(() => ({ done: true })) }), [state, kv]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

/** Access to the intro state; throws if `OnboardingProvider` was forgotten. */
export function useOnboarding(): OnboardingValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding phải nằm trong OnboardingProvider');
  return ctx;
}
