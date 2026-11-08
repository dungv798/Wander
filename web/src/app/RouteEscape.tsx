import { useCallback, useEffect } from 'react';
import { HIDE_TABBAR_ALWAYS, HIDE_TABBAR_ON_PHONE, VIEW } from '../shared/const/routes.const.ts';
import type { ViewName } from '../shared/const/routes.const.ts';
import { COPY } from '../shared/const/copy.vi.ts';
import { goBack } from '../shared/router/hashRoute.ts';
import { IconButton } from '../shared/ui/IconButton.tsx';
import { useOnboarding } from '../features/onboarding/index.ts';

const NEEDS_CLOSE: readonly ViewName[] = [VIEW.ONBOARD, VIEW.JOIN];
/** Hiện thanh điều hướng không làm mất khả năng Escape về màn cha. */
const ESCAPE_TO_PARENT: readonly ViewName[] = [VIEW.DEST, VIEW.TRIP];

/** Escape thoát màn con khi không có hộp thoại; màn giới thiệu/liên kết có nút đóng độc lập. */
export function RouteEscape({ view }: { readonly view: ViewName }) {
  const { finish } = useOnboarding();
  const close = useCallback(() => {
    if (view === VIEW.ONBOARD) finish();
    goBack();
  }, [view, finish]);
  useEffect(() => {
    /** Để hộp thoại và ô đang soạn xử lý Escape trước, tránh thoát hai tầng cùng lúc. */
    const escape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('[role="dialog"]') || (event.target instanceof HTMLElement && event.target.matches('input, textarea, select'))) return;
      if (view !== VIEW.EXPIRED && (HIDE_TABBAR_ALWAYS.includes(view) || HIDE_TABBAR_ON_PHONE.includes(view) || ESCAPE_TO_PARENT.includes(view))) close();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [view, close]);
  return NEEDS_CLOSE.includes(view) ? <div className="route-close"><IconButton icon="x" label={COPY.common.close} onClick={close} /></div> : null;
}
