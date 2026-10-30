import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UI } from '../const/app.const.ts';
import { COPY } from '../const/copy.vi.ts';

interface ToastApi {
  /** Hiện thông báo ngắn; có `undo` thì hiện nút "Hoàn tác" và giữ lâu hơn. */
  readonly show: (text: string, undo?: () => void) => void;
  /** Tắt thông báo hiện tại (một thay đổi mới làm "Hoàn tác" cũ hết nghĩa). */
  readonly dismiss: () => void;
}

interface ToastState {
  readonly text: string;
  readonly undo: (() => void) | undefined;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Cấp thông báo nổi (`role=status`) cho cả ứng dụng. Có nút Hoàn tác thì giữ 10 giây và dừng đếm khi focus vào (người dùng bàn phím). */
export function ToastProvider({ children }: { readonly children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef(0);

  const dismiss = useCallback(
    /** Tắt thông báo và hủy hẹn giờ. */
    () => {
      window.clearTimeout(timer.current);
      setToast(null);
    },
    [],
  );
  const show = useCallback(
    /** Hiện thông báo và hẹn giờ tự tắt. */
    (text: string, undo?: () => void) => {
      window.clearTimeout(timer.current);
      setToast({ text, undo });
      timer.current = window.setTimeout(() => setToast(null), undo ? UI.TOAST_UNDO_MS : UI.TOAST_MS);
    },
    [],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {toast ? (
        <div className="toast" role="status" aria-live="polite" onFocus={() => window.clearTimeout(timer.current)}>
          <span>{toast.text}</span>
          {toast.undo ? (
            <button
              type="button"
              className="glass-control undo-control"
              onClick={() => {
                dismiss(); // tắt trước: hàm hoàn tác có thể hiện thông báo mới và không được bị xóa ngay
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

/** Truy cập thông báo nổi; ném lỗi nếu quên bọc `ToastProvider`. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider');
  return ctx;
}
