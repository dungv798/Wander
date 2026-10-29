import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { UI } from '../const/app.const.ts';

/** Cờ lớp CSS mà một màn có thể bật trên vùng cuộn `#screen` (CSS của prototype định kiểu theo `#screen.<cờ>`). */
export type ScreenFlag = 'immersive' | 'searching' | 'nobar';

interface ScreenApi {
  /** Đặt (hoặc gỡ khi null) một biến CSS tùy biến trên `#screen` (tên KHÔNG có `--`). */
  readonly setVar: (name: string, value: string | null) => void;
  /** Bật/tắt một cờ lớp trên `#screen`. */
  readonly setFlag: (flag: ScreenFlag, on: boolean) => void;
}

const ScreenContext = createContext<ScreenApi | null>(null);

/** Ghi cách tương tác để ô nhập không tự hiện vòng focus khi chạm; Tab khôi phục chỉ báo bàn phím. */
function useFocusModality(): void {
  useEffect(() => {
    /** Chạm/chuột không cần vòng focus nhưng vẫn giữ focus cho công nghệ hỗ trợ. */
    const pointer = (): void => { document.body.dataset.inputModality = 'pointer'; };
    /** Phím điều hướng kích hoạt lại chỉ báo, kể cả khi đang ở ô nhập. */
    const keyboard = (event: KeyboardEvent): void => {
      if (event.key === 'Tab' || event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') document.body.dataset.inputModality = 'keyboard';
    };
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('keydown', keyboard, true);
    return () => {
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('keydown', keyboard, true);
      delete document.body.dataset.inputModality;
    };
  }, []);
}

interface ScreenHostProps {
  /** Tên màn, đặt vào `data-view` (CSS dùng để định kiểu). */
  readonly view: string;
  /** Khóa đổi khi sang màn khác: kích hoạt hoạt họa vào màn và đưa cuộn về đầu. */
  readonly routeKey: string;
  readonly noBar: boolean;
  readonly children: ReactNode;
}

/**
 * Vùng cuộn chính `#screen`. Giữ các lớp CSS theo màn (`nobar`, `immersive`, `searching`, `enter`) tại MỘT chỗ,
 * để màn con chỉ khai báo mong muốn qua `useScreenFlag` thay vì chạm DOM của nơi khác.
 */
export function ScreenHost({ view, routeKey, noBar, children }: ScreenHostProps) {
  useFocusModality();
  const ref = useRef<HTMLElement | null>(null);

  const setFlag = useCallback(
    /** Bật/tắt lớp trên phần tử `#screen`. */
    (flag: ScreenFlag, on: boolean) => {
      ref.current?.classList.toggle(flag, on);
    },
    [],
  );

  const setVar = useCallback(
    /** Đặt/gỡ biến CSS trên phần tử `#screen`. */
    (name: string, value: string | null) => {
      if (value === null) ref.current?.style.removeProperty(`--${name}`);
      else ref.current?.style.setProperty(`--${name}`, value);
    },
    [],
  );

  const api = useMemo(() => ({ setFlag, setVar }), [setFlag, setVar]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    el.scrollTop = 0;
    el.classList.add('enter');
    const timer = window.setTimeout(() => el.classList.remove('enter'), UI.ENTER_MS);
    return () => window.clearTimeout(timer);
  }, [routeKey]);

  useEffect(() => {
    ref.current?.classList.toggle('nobar', noBar);
  }, [noBar]);

  return (
    <ScreenContext.Provider value={api}>
      <main id="screen" ref={ref} data-view={view}>
        {children}
      </main>
    </ScreenContext.Provider>
  );
}

/** Bật một cờ lớp trên `#screen` suốt thời gian màn còn hiển thị (hoặc khi `on` đúng); tự gỡ khi rời màn. */
export function useScreenFlag(flag: ScreenFlag, on: boolean = true): void {
  const api = useContext(ScreenContext);
  useEffect(() => {
    api?.setFlag(flag, on);
    return () => api?.setFlag(flag, false);
  }, [api, flag, on]);
}

/** Đặt một biến CSS trên `#screen` suốt thời gian màn hiển thị (ví dụ ảnh nền mờ `stage` của bộ thẻ); tự gỡ khi rời màn. */
export function useScreenVar(name: string, value: string | null): void {
  const api = useContext(ScreenContext);
  useEffect(() => {
    api?.setVar(name, value);
    return () => api?.setVar(name, null);
  }, [api, name, value]);
}
