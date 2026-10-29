import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../../../shared/ui/Button.tsx';
import { TRIPS_COPY as T } from '../model/trips.copy.ts';

/** Giữ phần hành động ngoài vùng cuộn và giới hạn sheet theo bàn phím, kể cả viewport bị dịch trên iOS. */
export function TripFormLayout({ children, actions }: { readonly children: ReactNode; readonly actions: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sheet = ref.current?.closest<HTMLElement>('.sheet');
    const panel = ref.current?.closest<HTMLElement>('.panel');
    if (!sheet || !panel) return;
    const sheetStyle = sheet.getAttribute('style');
    const panelStyle = panel.getAttribute('style');
    /** Đồng bộ vùng chứa với phần màn hình còn nhìn thấy khi bàn phím thay đổi. */
    const sync = (): void => {
      const viewport = window.visualViewport;
      sheet.style.height = String(viewport?.height ?? window.innerHeight) + 'px';
      sheet.style.top = String(viewport?.offsetTop ?? 0) + 'px';
      sheet.style.bottom = 'auto';
      panel.style.height = '94%';
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
    <div ref={ref} data-trip-form style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div className="pp" style={{ flex: 1, overflowY: 'auto', minHeight: 0, alignContent: 'start' }}>{children}</div>
      <div className="stack pad-x" style={{ flexShrink: 0, paddingBlock: 'var(--s-2)', paddingBottom: 'max(var(--s-2), env(safe-area-inset-bottom))', background: 'var(--surface)' }}>{actions}</div>
    </div>
  );
}

/** Bộ nút chung của form nhanh và trình từng bước, nằm ngoài phần nội dung cuộn. */
export function TripFormActions({ label, busy, onSubmit, onClose, onBack }: { readonly label: string; readonly busy: boolean; readonly onSubmit: () => void; readonly onClose: () => void; readonly onBack?: () => void }) {
  return <>
    <Button block disabled={busy} onClick={onSubmit}>{label}</Button>
    {onBack ? <Button kind="ghost" block onClick={onBack}>{T.wizard.back}</Button> : null}
    <Button kind="ghost" block onClick={onClose}>{T.create.cancel}</Button>
  </>;
}
