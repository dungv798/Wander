import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { UI } from '../const/app.const.ts';

/** The CSS class flag that a screen can turn on at the `#screen` scroll region (the prototype's CSS styles by `#screen.<flag>`). */
export type ScreenFlag = 'immersive' | 'searching' | 'nobar';

interface ScreenApi {
  /** Sets (or removes when null) a custom CSS variable on `#screen` (the name has NO `--`). */
  readonly setVar: (name: string, value: string | null) => void;
  /** Turns a class flag on/off on `#screen`. */
  readonly setFlag: (flag: ScreenFlag, on: boolean) => void;
}

const ScreenContext = createContext<ScreenApi | null>(null);

/** Records how the interaction happened so an input box does not show a focus ring by itself on touch; Tab restores the keyboard indicator. */
function useFocusModality(): void {
  useEffect(() => {
    /** Touch/mouse needs no focus ring but still keeps focus for assistive technology. */
    const pointer = (): void => { document.body.dataset.inputModality = 'pointer'; };
    /** A navigation key re-activates the indicator, even when in an input box. */
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
  /** The screen name, put into `data-view` (CSS uses it for styling). */
  readonly view: string;
  /** A key that changes when going to another screen: triggers the screen-entry animation and brings the scroll back to the top. */
  readonly routeKey: string;
  readonly noBar: boolean;
  /** The map is open: keeps the list layout but removes it from interaction and the accessibility tree. */
  readonly inert?: boolean;
  readonly children: ReactNode;
}

/**
 * The main scroll region `#screen`. Keeps the per-screen CSS classes (`nobar`, `immersive`, `searching`, `enter`) in ONE place,
 * so a child screen only declares what it wants through `useScreenFlag` instead of touching the DOM of another place.
 */
export function ScreenHost({ view, routeKey, noBar, inert = false, children }: ScreenHostProps) {
  useFocusModality();
  const ref = useRef<HTMLElement | null>(null);

  const setFlag = useCallback(
    /** Turns a class on/off on the `#screen` element. */
    (flag: ScreenFlag, on: boolean) => {
      ref.current?.classList.toggle(flag, on);
    },
    [],
  );

  const setVar = useCallback(
    /** Sets/removes a CSS variable on the `#screen` element. */
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
      <main id="screen" ref={ref} data-view={view} inert={inert}>
        {children}
      </main>
    </ScreenContext.Provider>
  );
}

/** Turns on a class flag on `#screen` for as long as the screen is shown (or when `on` is exactly true); it removes itself when leaving the screen. */
export function useScreenFlag(flag: ScreenFlag, on: boolean = true): void {
  const api = useContext(ScreenContext);
  useEffect(() => {
    api?.setFlag(flag, on);
    return () => api?.setFlag(flag, false);
  }, [api, flag, on]);
}

/** Sets a CSS variable on `#screen` for as long as the screen is shown (for example the blurred `stage` background of the deck); it removes itself when leaving the screen. */
export function useScreenVar(name: string, value: string | null): void {
  const api = useContext(ScreenContext);
  useEffect(() => {
    api?.setVar(name, value);
    return () => api?.setVar(name, null);
  }, [api, name, value]);
}
