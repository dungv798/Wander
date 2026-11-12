import { ICON_PATHS } from './icons/iconPaths.const.ts';
import type { IconName } from './icons/iconPaths.const.ts';
import { FLUENT_ICONS, FLUENT_PATH, FLUENT_SIZE, FLUENT_SUFFIX } from './icons/fluentIcons.const.ts';
import { LOOK } from '../const/look.const.ts';

/** The icon size: 20 px by default; s 16; l 26; xl 30 (CSS `.ic`). */
export type IconSize = 's' | 'l' | 'xl';

interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  /** An extra CSS class (for example rotation). */
  readonly className?: string;
  /** The place/time semantics; controls always use SVG by default. */
  readonly semantic?: boolean;
}

/** A Tabler icon (inline SVG, decorative: hidden from screen readers; the label is provided by the surrounding button). */
export function Icon({ name, size, className, semantic = false }: IconProps) {
  const cls = ['ic', size, className].filter(Boolean).join(' ');
  const fluent = semantic && FLUENT_ICONS[name];
  if (fluent && document.documentElement.dataset.look !== LOOK.CLASSIC) {
    const pixels = FLUENT_SIZE[size ?? 'default'];
    return <img className={`${cls} fluent-icon`} src={`${FLUENT_PATH}${fluent}${FLUENT_SUFFIX}`} width={pixels} height={pixels} decoding="async" alt="" aria-hidden="true" />;
  }
  // eslint-disable-next-line react/no-danger -- the source is the static constant ICON_PATHS, the icon name is already guarded by hasOwnProperty (iconNames.ts)
  return <svg className={cls} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }} />;
}
