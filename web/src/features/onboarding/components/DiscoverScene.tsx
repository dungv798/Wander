import { useEffect } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { useLatestRef } from '../../../shared/hooks/useLatestRef.ts';
import { useRunScope } from '../../../shared/hooks/useRunScope.ts';
import { cssVars } from '../../../shared/lib/cssVars.ts';
import { useCurrentDestination } from '../../discover/index.ts';
import { destinationPhoto } from '../model/onboardPhotos.ts';
import { DISCOVER_AUTO_MS, FAN_DESTINATIONS } from '../model/onboarding.const.ts';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { SceneProps } from '../model/onboarding.types.ts';

/** Ba thẻ ảnh thật cùng gợi ý trải nghiệm; giữ thẻ Đà Lạt làm điểm nối sang cảnh quẹt, không bắt người xem thao tác. */
export function DiscoverScene({ auto, reduced, onDone, onCue }: SceneProps) {
  const scope = useRunScope();
  const autoRef = useLatestRef(auto);
  const { destinations } = useCurrentDestination();
  useEffect(() => {
    if (reduced) return;
    void scope.start(async (run) => {
      if (autoRef.current) onCue(DISCOVER_AUTO_MS);
      await run.wait(DISCOVER_AUTO_MS);
      if (autoRef.current) onDone();
    });
  }, [scope, autoRef, onDone, onCue, reduced]);
  const cards = FAN_DESTINATIONS.flatMap((id) => destinations.find((d) => d.id === id) ?? []);
  return (
    <div className="ob-scene ob-discover">
      {cards.map((d, k) => {
        const photo = destinationPhoto(d.id, d.coverUrl);
        return (
        <figure key={d.id} className="ob-fan" style={cssVars({ k })}>
          <img src={photo.url} style={{ objectPosition: photo.position }} alt="" fetchPriority={k === 0 ? 'high' : 'auto'} decoding="async" />
          <figcaption>
            <b>{d.name}</b>
            <small>{fill(T.destinationPlaces, { n: d.placeCount })}</small>
          </figcaption>
        </figure>
        );
      })}
      <p className="ob-experience ob-experience-food"><Icon name="tools-kitchen-2" />{T.experiences.food}</p>
      <p className="ob-experience ob-experience-culture"><Icon name="users" />{T.experiences.culture}</p>
      <p className="ob-experience ob-experience-trail"><Icon name="mountain" />{T.experiences.trail}</p>
    </div>
  );
}
