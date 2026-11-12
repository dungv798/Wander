import { createContext, useContext } from 'react';

/** The content-sheet mode on a phone: open (covers most of the map) or collapsed (shows the map to drag and zoom). */
export type SheetMode = 'open' | 'peek';

/** The shared value: the current mode and the function that changes it; `null` when the screen is built outside the app frame (tests, preview). */
export interface ShellSheetValue {
  readonly mode: SheetMode;
  readonly setMode: (mode: SheetMode) => void;
}

/** The context supplied by the app frame; a screen inside the sheet uses it to open the 'main map' without building its own map. */
export const ShellSheetContext = createContext<ShellSheetValue | null>(null);

/** Reads the sheet mode of the app frame; `null` if there is no frame (the 'Map' button then hides itself). */
export function useShellSheet(): ShellSheetValue | null {
  return useContext(ShellSheetContext);
}
