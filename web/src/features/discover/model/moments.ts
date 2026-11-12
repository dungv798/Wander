import type { MomentTheme, MomentView } from './Catalog.types.ts';
import { ALL_MOMENTS, MOMENT_THEMES } from './moments.const.ts';

/** Accepts only a plain object so missing or wrongly typed data does not break the screen. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A record kind that lacks the caption, theme or required attribution information. */
function isMoment(value: unknown): value is MomentView {
  if (!isRecord(value) || !isRecord(value['photo'])) return false;
  const photo = value['photo'];
  return ['id', 'themeLabel', 'caption'].every(key => typeof value[key] === 'string' && value[key].trim() !== '')
    && MOMENT_THEMES.some(theme => theme === value['theme'])
    && ['url', 'author', 'license', 'sourceUrl'].every(key => typeof photo[key] === 'string' && photo[key].trim() !== '');
}

/** An additive field that is absent or of the wrong type becomes an empty array; broken records and duplicate ids are dropped. */
export function parseMoments(value: unknown): readonly MomentView[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter(isMoment).filter(moment => {
    if (seen.has(moment.id)) return false;
    seen.add(moment.id);
    return true;
  });
}

/** Themes keep the editorial order, each theme has only one chip. */
export function momentThemes(moments: readonly MomentView[]): readonly { readonly theme: MomentTheme; readonly label: string }[] {
  return [...new Map(moments.map(moment => [moment.theme, { theme: moment.theme, label: moment.themeLabel }])).values()];
}

/** A stable filter by theme, keeping the photo order of the editorial catalog. */
export function filterMoments(moments: readonly MomentView[], theme: MomentTheme | typeof ALL_MOMENTS): readonly MomentView[] {
  return theme === ALL_MOMENTS ? moments : moments.filter(moment => moment.theme === theme);
}
