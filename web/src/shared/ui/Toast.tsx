import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UI } from '../const/app.const.ts';
import { COPY } from '../const/copy.vi.ts';

interface ToastApi {
  /** Shows a short notice; with `undo` it shows an 'Undo' button and keeps it longer. */
  readonly show: (text: string, undo?: () => void) => void;
  /** Shows an ERROR notice: it stays until the user taps Close or a new notice comes (a save error must not disappear after a few seconds; B-09). */
  readonly error: (text: string) => void;
  /** Turns off the current notice (a new change makes the old 'Undo' meaningless). */
  readonly dismiss: () => void;
}

interface ToastState {
  readonly text: string;
  readonly undo: (() => void) | undefined;
  /** An error notice: it does not turn off by itself. */
  readonly sticky: boolean;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Provides a floating notice (`role=status`) for the whole app. With an Undo button it keeps it 10 seconds and stops counting when focused (keyboard users). */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef(0);

  const dismiss = useCallback(
    /** Turns off the notice and cancels the timer. */
    () => {
      window.clearTimeout(timer.current);
      setToast(null);
    },
    [],
  );
  const show = useCallback(
    /** Shows a notice and schedules the timer to turn it off. */
    (text: string, undo?: () => void) => {
      window.clearTimeout(timer.current);
      setToast({ text, undo, sticky: false });
      timer.current = window.setTimeout(() => setToast(null), undo ? UI.TOAST_UNDO_MS : UI.TOAST_MS);
    },
    [],
  );
  const error = useCallback(
    /** Shows an error and does NOT schedule the timer to turn it off. */
    (text: string) => {
      window.clearTimeout(timer.current);
      setToast({ text, undo: undefined, sticky: true });
    },
    [],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const api = useMemo(() => ({ show, error, dismiss }), [show, error, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <div className="toast" role={toast.sticky ? 'alert' : 'status'} aria-live={toast.sticky ? 'assertive' : 'polite'} onFocus={() => window.clearTimeout(timer.current)}>
          <span>{toast.text}</span>
          {toast.sticky ? <button type="button" className="glass-control undo-control" onClick={dismiss}>{COPY.common.close}</button> : null}
          {toast.undo ? (
            <button
              type="button"
              className="glass-control undo-control"
              onClick={() => {
                dismiss(); // turn off first: the undo function can show a new notice and must not be cleared at once
                toast.undo?.();
              }}
            >
              {COPY.common.undo}
            </button>
          ) : null}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

/** Access to the floating notice; throws if `ToastProvider` was forgotten. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider');
  return ctx;
}
