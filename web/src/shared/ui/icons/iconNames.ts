import { ICON_PATHS } from './iconPaths.const.ts';
import type { IconName } from './iconPaths.const.ts';

/** Turns a string (for example an icon name from editorial data) into a valid icon name; if it is not in the set it returns null instead of drawing an empty box. */
export function toIconName(name: string): IconName | null {
  return Object.prototype.hasOwnProperty.call(ICON_PATHS, name) ? (name as IconName) : null;
}
