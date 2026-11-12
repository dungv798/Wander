import { useEffect, useState } from 'react';
import { COPY } from '../../../../shared/const/copy.vi.ts';
import { useReveal } from '../../../../shared/hooks/useReveal.ts';
import type { DestinationDetail } from '../../model/Catalog.types.ts';
import { HOME } from '../../model/home.const.ts';
import { DestMapSection } from '../map/DestMapSection.tsx';

/** Initializes the map only when half of the card shows above the tab bar; reserves space so data arriving late does not trigger it early. */
export function HomeMap({ dest }: { readonly dest: DestinationDetail }) {
  // HomeScreen has no reveal observer; scans locally even when the lazy branch has just appeared.
  const ref = useReveal<HTMLDivElement>();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= HOME.MAP_VISIBLE_RATIO)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: HOME.MAP_VISIBLE_RATIO, rootMargin: HOME.MAP_ROOT_MARGIN });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return <div ref={ref} className="home-map">
    {visible ? <DestMapSection dest={dest} title={COPY.home.mapTitle} /> : <h2 className="h2">{COPY.home.mapTitle}</h2>}
  </div>;
}
