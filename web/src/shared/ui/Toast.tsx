import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { UI } from '../const/app.const.ts';
import { COPY } from '../const/copy.vi.ts';

interface ToastApi {
  /** Hiện thông báo ngắn; có `undo` thì hiện nút "Hoàn tác" và giữ lâu hơn. */
  readonly show: (text: string, undo?: () => void) => void;
  /** Hiện thông báo LỖI: ở lại cho tới khi người dùng bấm Đóng hoặc có thông báo mới (lỗi lưu không được biến mất sau vài giây; B-09). */
  readonly error: (text: string) => void;
  /** Tắt thông báo hiện tại (một thay đổi mới làm "Hoàn tác" cũ hết nghĩa). */
  readonly dismiss: () => void;
}

interface ToastState {
  readonly text: string;
  readonly undo: (() => void) | undefined;
  /** Thông báo lỗi: không tự tắt. */
  readonly sticky: boolean;
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
      setToast({ text, undo, sticky: false });
      timer.current = window.setTimeout(() => setToast(null), undo ? UI.TOAST_UNDO_MS : UI.TOAST_MS);
    },
    [],
  );
  const error = useCallback(
    /** Hiện lỗi và KHÔNG hẹn giờ tắt. */
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
