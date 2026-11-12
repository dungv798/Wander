import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { KeyboardEvent, ReactNode } from 'react';
import { MEDIA } from '../const/app.const.ts';
import { useMediaQuery } from '../hooks/useMediaQuery.ts';
import { lockDocumentScroll } from '../lib/lockDocumentScroll.ts';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
const DRAWER_BODY_CLASS = 'has-drawer';

interface SheetProps {
  /** The label for screen readers (the dialog title). */
  readonly label: string;
  readonly onClose: () => void;
  /** A wide screen of at least 1280 px is a right-hand drawer, which does NOT cover the content (`aria-modal=false`). */
  readonly asDrawer?: boolean;
  readonly full?: boolean;
  readonly children: ReactNode;
}

/** The focusable elements being shown in the dialog (used for the focus trap). */
function focusableIn(panel: HTMLElement): HTMLElement[] {
  return [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
}

/** Handles the keyboard of exactly the sheet that holds the target DOM; a child portal has its own focus trap. */
function sheetKey(event: KeyboardEvent<HTMLDivElement>, panel: HTMLElement | null, drawer: boolean, onClose: () => void): void {
  if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation(); onClose();
    return;
  }
  if (event.key !== 'Tab' || drawer || !panel) return;
  const items = focusableIn(panel), first = items[0], last = items[items.length - 1];
  if (!first || !last) return;
  const active = document.activeElement;
  if (!panel.contains(active)) { event.preventDefault(); first.focus(); }
  else if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
}

/**
 * A bottom overlay sheet / a center dialog / a right drawer. It has a focus trap, Esc closes, tapping the background closes and returns the focus to where it was opened (a11y, FE standard section 2).
 * The drawer does not block the background so it has no focus trap and does not close on a background tap.
 */
export function Sheet({ label, onClose, asDrawer = false, full = false, children }: SheetProps) {
  const drawerOk = useMediaQuery(MEDIA.DRAWER);
  const drawer = asDrawer && drawerOk;
  const panelRef = useRef<HTMLDivElement | null>(null);
  const downOnOverlay = useRef(false);

  useLayoutEffect(() => drawer ? undefined : lockDocumentScroll(), [drawer]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel && !drawer) (focusableIn(panel)[0] ?? panel).focus();
    document.body.classList.toggle(DRAWER_BODY_CLASS, drawer);
    return () => {
      document.body.classList.remove(DRAWER_BODY_CLASS);
      opener?.focus?.({ preventScroll: true });
    };
  }, [drawer]);

  /** Esc closes; Tab cycles within the dialog (not applied to the drawer). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    sheetKey(e, panelRef.current, drawer, onClose);
  };

  return createPortal(
    <div
      className={drawer ? 'sheet drawer' : 'sheet'}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => {
        downOnOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // selecting text and releasing the mouse outside the dialog must not count as a tap on the background
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
