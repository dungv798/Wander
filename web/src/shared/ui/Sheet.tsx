import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent, ReactNode } from 'react';
import { MEDIA } from '../const/app.const.ts';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
const DRAWER_BODY_CLASS = 'has-drawer';

interface SheetProps {
  /** Nhãn cho trình đọc màn hình (tiêu đề hộp thoại). */
  readonly label: string;
  readonly onClose: () => void;
  /** Màn rộng ≥ 1280 px thì dạng ngăn kéo bên phải, KHÔNG che nội dung (`aria-modal=false`). */
  readonly asDrawer?: boolean;
  readonly full?: boolean;
  readonly children: ReactNode;
}

/** Các phần tử nhận focus đang hiển thị trong hộp thoại (dùng cho bẫy focus). */
function focusableIn(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
}

/**
 * Tờ phủ dưới/hộp thoại giữa/ngăn kéo phải. Có bẫy focus, Esc đóng, chạm nền đóng và trả focus về nơi mở (a11y, chuẩn FE §2).
 * Ngăn kéo không chặn nền nên không bẫy focus và không đóng khi chạm nền.
 */
export function Sheet({ label, onClose, asDrawer = false, full = false, children }: SheetProps) {
  const drawerOk = useMediaQuery(MEDIA.DRAWER);
  const drawer = asDrawer && drawerOk;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const downOnOverlay = useRef(false);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !drawer) (focusableIn(panel)[0] ?? panel).focus();
    document.body.classList.toggle(DRAWER_BODY_CLASS, drawer);
    return () => {
      document.body.classList.remove(DRAWER_BODY_CLASS);
      opener?.focus?.();
    };
  }, [drawer]);

  /** Esc đóng; Tab xoay vòng trong hộp thoại (không áp dụng cho ngăn kéo). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    const panel = panelRef.current;
    if (e.key !== 'Tab' || drawer || !panel) return;
    const items = focusableIn(panel);
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    const active = document.activeElement;
    if (!panel.contains(active)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={drawer ? 'sheet drawer' : 'sheet'}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        downOnOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // chọn chữ rồi nhả chuột ngoài hộp thoại không được tính là bấm nền
        if (!drawer && downOnOverlay.current && e.target === e.currentTarget) onClose();
        downOnOverlay.current = false;
      }}
      role="presentation"
    >
      <div ref={panelRef} className={full ? 'panel full' : 'panel'} role="dialog" aria-modal={!drawer} aria-label={label} tabIndex={-1}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
