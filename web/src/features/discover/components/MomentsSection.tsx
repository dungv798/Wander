import { useState } from 'react';
import { COPY, fill } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import { navigate } from '../../../shared/router/hashRoute.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { Chip } from '../../../shared/ui/Chip.tsx';
import { RevealImage } from '../../../shared/ui/RevealImage.tsx';
import { Sheet } from '../../../shared/ui/Sheet.tsx';
import type { DestinationDetail, MomentTheme, MomentView } from '../model/Catalog.types.ts';
import { filterMoments, momentThemes } from '../model/moments.ts';
import { ALL_MOMENTS } from '../model/moments.const.ts';
import { MOMENTS_COPY } from '../model/moments.copy.ts';
import { CreditPill } from './CreditPill.tsx';
import '../moments.css';

/** Dải ảnh đời sống: ẩn khi rỗng, chỉ hiện bộ lọc khi có nhiều chủ đề. */
export function MomentsSection({ dest }: { readonly dest: DestinationDetail }) {
  const [theme, setTheme] = useState<MomentTheme | typeof ALL_MOMENTS>(ALL_MOMENTS);
  const [opened, setOpened] = useState<MomentView | null>(null);
  const moments = dest.moments ?? [];
  const themes = momentThemes(moments);
  const selected = themes.some(item => item.theme === theme) ? theme : ALL_MOMENTS;
  if (!moments.length) return null;
  return <section className="stack moments-section">
    <h2 className="h2">{fill(MOMENTS_COPY.title, { dest: dest.name })}</h2>
    {themes.length > 1 ? <div className="hscroll moment-filters" role="group" aria-label={MOMENTS_COPY.filter}>
      <button className="chip" type="button" aria-pressed={selected === ALL_MOMENTS} onClick={() => setTheme(ALL_MOMENTS)}>{MOMENTS_COPY.all}</button>
      {themes.map(item => <button className="chip" type="button" key={item.theme} aria-pressed={selected === item.theme} onClick={() => setTheme(item.theme)}>{item.label}</button>)}
    </div> : null}
    <div className="hscroll moment-rail">
      {filterMoments(moments, selected).map(moment => <article className="moment-card" key={moment.id}>
        <button type="button" className="moment-photo" aria-label={fill(MOMENTS_COPY.open, { caption: moment.caption })} onClick={() => setOpened(moment)}>
          <RevealImage src={moment.photo.url} alt={moment.caption} loading="lazy" />
        </button>
        <div className="moment-copy"><Chip>{moment.themeLabel}</Chip><p>{moment.caption}</p></div>
      </article>)}
    </div>
    {opened ? <Sheet label={opened.caption} onClose={() => setOpened(null)}>
      <div className="moment-viewer stack">
        <Button kind="ghost" onClick={() => setOpened(null)}>{COPY.common.close}</Button>
        <RevealImage src={opened.photo.url} alt={opened.caption} loading="lazy" />
        <p>{opened.caption}</p>
        <CreditPill photo={opened.photo} fullAuthor />
        <Button icon="hand-finger" arrow onClick={() => { setOpened(null); navigate(VIEW.DECK, dest.id); }}>{fill(MOMENTS_COPY.explore, { dest: dest.name })}</Button>
      </div>
    </Sheet> : null}
  </section>;
}
