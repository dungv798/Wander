import type { CSSProperties } from 'react';

/** Creates a `style` holding custom CSS variables from a name->value table (names WITHOUT `--`), for example `cssVars({ n: 2 })` -> `--n: 2`. */
export function cssVars(vars: Readonly<Record<string, string | number>>): CSSProperties {
  const style: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(vars)) style[`--${k}`] = v;
  return style as CSSProperties;
}
