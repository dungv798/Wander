import { RevealImage } from '../../../../shared/ui/RevealImage.tsx';
import { Button } from '../../../../shared/ui/Button.tsx';
import type { DestinationSummary } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { HOME_COPY } from '../../model/home.copy.ts';
import { CreditPill } from '../CreditPill.tsx';
import { useCreditPill } from '../../hooks/useCreditPill.ts';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { IconButton } from '../../../../shared/ui/IconButton.tsx';

interface HomeHeroProps {
  /** The destination being highlighted: only the id, the name, the tagline and the fallback cover photo are needed. */
  readonly destination: Pick<DestinationSummary, 'id' | 'name' | 'tagline' | 'coverUrl' | 'coverPhoto'>;
  /** The small line above the name (for example 'Suggested destination'). */
  readonly eyebrow: string;
  /** The label of the main button; the button always has a 'go on' arrow. */
  readonly cta: string;
  readonly onOpen: () => void;
}

/**
 * The hero card of one destination: a real photo covers the card, a large name and ONE main button; used for both the first-time Home page (a suggested destination) and the Home page with a destination chosen.
 * The photo comes from the curated hero photo set, and falls back to the catalog cover photo; the text sits on a dark layer at the bottom to be readable on any photo.
 */
export function HomeHero({ destination, eyebrow, cta, onOpen }: HomeHeroProps) {
  const src = destination.coverUrl;
  const credit = useCreditPill(0);
  return (
    <section className="home-hero-card" aria-label={destination.name}>
      <RevealImage src={src} alt="" width={HOME.IMAGE_WIDTH} height={HOME.IMAGE_HEIGHT} loading="eager" />
      <div className="hhc-in">
        <p className="hhc-eyebrow">{eyebrow}</p>
        <h2>{destination.name}</h2>
        <p className="hhc-tag">{HOME_COPY.hooks[destination.id] ?? destination.tagline}</p>
        <Button arrow onClick={onOpen}>{cta}</Button>
      </div>
      {destination.coverPhoto ? <div className="hhc-credit"><IconButton icon="info-circle" label={COPY.deck.creditAria} aria-expanded={credit.open} onClick={credit.toggle} />{credit.open ? <CreditPill photo={destination.coverPhoto} fullAuthor /> : null}</div> : null}
    </section>
  );
}
