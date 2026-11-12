import { COPY } from '../../../../shared/const/copy.vi.ts';
import { UI } from '../../../../shared/const/app.const.ts';
import { Icon } from '../../../../shared/ui/Icon.tsx';
import { toIconName } from '../../../../shared/ui/icons/iconNames.ts';
import { usePlaceSheet } from '../../hooks/PlaceSheetProvider.tsx';
import { useDiscover } from '../../hooks/DiscoverProvider.tsx';
import { CATEGORY_ICON } from '../../model/discover.const.ts';
import type { DestinationDetail, GuideItemView, GuideSectionView } from '../../model/Catalog.types.ts';
import { placeById } from '../../model/destinationQueries.ts';

/** The 12-month grid: the best months (`best`), the rainy months (`rain`), the trip's months (`mine`, if any). */
export function MonthsGrid({ section, mine }: { readonly section: GuideSectionView; readonly mine?: number | null }) {
  const months = Array.from({ length: UI.MONTHS_IN_YEAR }, (_, i) => i + 1);
  return (
    <>
      <div className="months" aria-label={COPY.dest.monthsLabel}>
        {months.map((m) => {
          const cls = [section.bestMonths.includes(m) ? 'best' : section.rainyMonths.includes(m) ? 'rain' : '', m === mine ? 'mine' : ''].filter(Boolean).join(' ');
          return (
            <i key={m} className={cls || undefined}>
              {m}
            </i>
          );
        })}
      </div>
      <div className="leg">
        <span>{COPY.dest.legendBest}</span>
        <span className="r">{COPY.dest.legendRain}</span>
      </div>
      {section.notes.length ? <p className="note">{section.notes.join(' ')}</p> : null}
    </>
  );
}

/** The 'what to bring' list: tap to mark as prepared (saved on this device). */
function Checklist({ section }: { readonly section: GuideSectionView }) {
  const { state, actions } = useDiscover();
  return (
    <div className="packs">
      {section.items.map((it) => {
        const key = `${section.id}:${it.title}`;
        return (
          <button key={key} className="pack" type="button" aria-pressed={Boolean(state.pack[key])} onClick={() => actions.togglePack(key)}>
            <Icon name="check" size="s" />
            {it.title}
          </button>
        );
      })}
    </div>
  );
}

/** A short info card (for example a dish): an icon, a name, a description. */
function Cards({ items }: { readonly items: readonly GuideItemView[] }) {
  return (
    <div className="foods">
      {items.map((it) => {
        const icon = toIconName(it.icon);
        return (
          <div key={it.title} className="food">
            {icon ? <Icon semantic name={icon} size="l" /> : null}
            <b>{it.title}</b>
            <p>{it.text}</p>
          </div>
        );
      })}
    </div>
  );
}

/** The list of places in the guide: tap to open the detail (an item that points to a place that is in the catalog). */
function PlaceRows({ dest, section }: { readonly dest: DestinationDetail; readonly section: GuideSectionView }) {
  const { open } = usePlaceSheet();
  return (
    <>
      {section.items.map((it) => {
        const p = it.placeId ? placeById(dest, it.placeId) : null;
        if (!p) return null;
        return (
          <button key={p.id} className={`grow cat-${p.category}`} type="button" onClick={() => open(p.id)}>
            <span className="catbadge">
              <Icon semantic name={CATEGORY_ICON[p.category]} />
            </span>
            <span>
              <b>{p.name}</b>
              <span className="d">{p.hook}</span>
            </span>
            <Icon name="chevron-down" size="s" />
          </button>
        );
      })}
    </>
  );
}

/** The info rows (services, getting around): an icon, a title, a description. */
function InfoRows({ section }: { readonly section: GuideSectionView }) {
  return (
    <>
      {section.items.map((it) => {
        const icon = toIconName(it.icon);
        return (
          <div key={it.title} className={`grow cat-${section.category}`}>
            <span className="ib">{icon ? <Icon semantic name={icon} /> : null}</span>
            <span>
              <b>{it.title}</b>
              <span className="d">{it.text}</span>
            </span>
            <span />
          </div>
        );
      })}
    </>
  );
}

/** The body of one guide block by data layout (months, checklist, cards, places, rows). */
function SectionBody({ dest, section }: { readonly dest: DestinationDetail; readonly section: GuideSectionView }) {
  switch (section.layout) {
    case 'months':
      return <MonthsGrid section={section} />;
    case 'checklist':
      return (
        <>
          <Checklist section={section} />
          <p className="note">{COPY.dest.checklistHint}</p>
        </>
      );
    case 'cards':
      return <Cards items={section.items} />;
    case 'places':
      return <PlaceRows dest={dest} section={section} />;
    case 'rows':
      return <InfoRows section={section} />;
  }
}

/** The destination guide as open/close blocks (accordion), built entirely from the editorial data. */
export function GuideSections({ dest }: { readonly dest: DestinationDetail }) {
  const { state, actions } = useDiscover();
  return (
    <>
      <div className="guide">
        {dest.guide.map((g) => {
          const open = state.guide === g.id;
          const icon = toIconName(g.icon);
          return (
            <div key={g.id} className={`gblock cat-${g.category}${open ? ' open' : ''}`}>
              <button className="ghead" type="button" aria-expanded={open} onClick={() => actions.toggleGuide(g.id)}>
                <span className="ib">{icon ? <Icon semantic name={icon} /> : null}</span>
                <span>
                  <b>{g.title}</b>
                  <span className="sum">{g.summary}</span>
                </span>
                <span className="chev">
                  <Icon name="chevron-down" />
                </span>
              </button>
              <div className="gbody">
                <SectionBody dest={dest} section={g} />
              </div>
            </div>
          );
        })}
      </div>
      <p className="gfoot">{COPY.dest.guideFoot}</p>
    </>
  );
}
