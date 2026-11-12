import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../../shared/ui/Button.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Keeps the action part outside the scroll area and limits the sheet by the keyboard, even when the viewport is shifted on iOS. */
export function TripFormLayout({ children, actions }: { readonly children: ReactNode; readonly actions: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sheet = ref.current?.closest<HTMLElement>('.sheet');
    const panel = ref.current?.closest<HTMLElement>('.panel');
    if (!sheet || !panel) return;
    const sheetStyle = sheet.getAttribute('style');
    const panelStyle = panel.getAttribute('style');
    /** Syncs the container with the part of the screen still visible when the keyboard changes. */
    const sync = (): void => {
      const viewport = window.visualViewport;
      sheet.style.height = String(viewport?.height ?? window.innerHeight) + 'px';
      sheet.style.top = String(viewport?.offsetTop ?? 0) + 'px';
      sheet.style.bottom = 'auto';
      sheet.style.setProperty('--form-viewport-height', String(viewport?.height ?? window.innerHeight) + 'px');
      panel.style.height = 'auto';
      panel.style.overflow = 'hidden';
    };
    sync();
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    return () => {
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      if (sheetStyle === null) sheet.removeAttribute('style'); else sheet.setAttribute('style', sheetStyle);
      if (panelStyle === null) panel.removeAttribute('style'); else panel.setAttribute('style', panelStyle);
    };
  }, []);
  return (
    <div ref={ref} data-trip-form>
      <div className="pp trip-form-content">{children}</div>
      <div className="trip-form-actions">{actions}</div>
    </div>
  );
}

/** The shared button group of the quick form and the wizard, outside the scrolling content. */
export function TripFormActions({ label, busy, onSubmit, onClose, onBack }: { readonly label: string; readonly busy: boolean; readonly onSubmit: () => void; readonly onClose: () => void; readonly onBack?: () => void }) {
  return <>
    <Button block disabled={busy} onClick={onSubmit}>{label}</Button>
    {onBack ? <Button kind="ghost" block onClick={onBack}>{T.wizard.back}</Button> : null}
    <Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>
  </>;
}
