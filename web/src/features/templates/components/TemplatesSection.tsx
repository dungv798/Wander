import { useState } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { SectionHead } from '../../../shared/ui/SectionHead.tsx';
import { firstPhotoUrl } from '../../discover/index.ts';
import { useTemplates } from '../hooks/useTemplates.ts';
import type { TemplateView } from '../model/template.types.ts';
import { TEMPLATES_COPY as T } from '../model/templates.copy.ts';
import { TemplateSheet } from './TemplateSheet.tsx';

/** The cover photo of a sample itinerary: the photo of the first place of the itinerary. */
function coverOf(t: TemplateView): string | undefined {
  const first = t.days.flatMap((d) => d.places)[0];
  return first ? firstPhotoUrl(first) : undefined;
}

/** One sample-itinerary card: the photo of the first place, the name, the number of days/places and the 'Draft' label when not approved. */
function TemplateCard({ template, onOpen }: { readonly template: TemplateView; readonly onOpen: () => void }) {
  const cover = coverOf(template);
  return (
    <button className="tplcard" type="button" onClick={onOpen}>
      <span className="tplimg">{cover ? <img alt="" src={cover} loading="lazy" /> : null}</span>
      <span className="tpltx">
        <b>{template.title}</b>
        <span className="note">{fill(T.card, { days: template.days.length, places: template.placeCount })}</span>
        {template.status === 'draft' ? <span className="chip tint cat-luu">{T.draft}</span> : null}
        {template.status === 'reference' ? <span className="chip tint cat-van">{T.reference}</span> : null}
      </span>
    </button>
  );
}

/** The 'Sample itineraries to start with' block on the Discover page: a horizontally scrolling row of cards; hidden when there is no sample itinerary or while loading/error (it does not block the page). */
export function TemplatesSection({ destId }: { readonly destId: string }) {
  const { state } = useTemplates(destId);
  const [openId, setOpenId] = useState<string | null>(null);
  if (state.status !== 'ready' || !state.data.length) return null;
  const open = state.data.find((t) => t.id === openId);
  return (
    <section className="stack">
      <SectionHead title={T.section} />
      <p className="note">{T.sectionNote}</p>
      <div className="hscroll tplrow">
        {state.data.map((t) => (
          <TemplateCard key={t.id} template={t} onOpen={() => setOpenId(t.id)} />
        ))}
      </div>
      {open ? <TemplateSheet template={open} destId={destId} onClose={() => setOpenId(null)} /> : null}
    </section>
  );
}
