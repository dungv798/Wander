import { useMemo, useRef, useState } from 'react';
import { Icon } from '../../../shared/ui/Icon.tsx';
import { placeById } from '../../discover/index.ts';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import { useMapHealth } from '../hooks/useMapHealth.ts';
import { useShareStory } from '../hooks/useShareStory.ts';
import { ONBOARD_DESTINATION, PROPOSAL } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import type { SceneProps } from '../model/onboarding.types.ts';
import { dayMarkers, dayRoute, fitIds, stopsOf } from '../model/planMap.ts';
import { buildTrip } from '../model/sampleTrip.ts';
import { DaySheet } from './DaySheet.tsx';
import { PlanMap } from './PlanMap.tsx';
import { InvitePanel, Members, ProposalPanel } from './SharePanels.tsx';
import { ReplayButton } from './SwipeParts.tsx';
import { TouchDot } from './TouchDot.tsx';

/** Cảnh 4 (minh họa, sắp có): chia sẻ chính chuyến vừa xem — mời bằng liên kết, Mai/Bảo vào bằng tên hiển thị, Mai đề xuất, chủ chuyến chấp nhận hoặc từ chối; danh sách và ghim cập nhật cùng lúc. */
export function ShareScene({ dest, reduced, auto, onInteract, onCue }: SceneProps) {
  const baseDays = useMemo(() => buildTrip((id) => placeById(dest, id)), [dest]);
  const proposal = useMemo(() => placeById(dest, PROPOSAL.placeId), [dest]);
  const stage = useRef<HTMLDivElement | null>(null);
  const host = useRef<HTMLDivElement | null>(null);
  const copyRef = useRef<HTMLButtonElement | null>(null);
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  const shareRef = useRef<HTMLButtonElement | null>(null);
  const health = useMapHealth(host);
  const buttons = useMemo(() => ({ share: shareRef, copy: copyRef, accept: acceptRef }), []);
  const story = useShareStory({ baseDays, proposal, settled: health.settled, reduced, auto, onInteract, onCue, stage, buttons });
  const { state } = story;
  const [tab, setTab] = useState(PROPOSAL.dayIndex + 1);
  const day = state.days[tab - 1] ?? null;
  const ghost = tab === PROPOSAL.dayIndex + 1 && state.proposed && !state.decided && proposal;
  const markers = useMemo(() => {
    const all = day ? dayMarkers(day, Number.POSITIVE_INFINITY) : [];
    return ghost && ghost.lat !== null && ghost.lon !== null ? [...all, { id: ghost.id, lat: ghost.lat, lon: ghost.lon, label: ghost.name, thumb: onboardPhotoUrl(ghost), muted: true }] : all;
  }, [day, ghost]);
  const route = useMemo(() => (day ? dayRoute(day, stopsOf(day).length) : null), [day]);
  const focus = useMemo(() => {
    const ids = fitIds(day) ?? [];
    return ghost ? [...ids, ghost.id] : ids;
  }, [day, ghost]);
  const panelOpen = state.shared || (state.proposed && !state.decided);
  const playing = story.phase === 'playing';
  const cueShare = playing && !state.shared && !state.proposed && state.members.length === 1;
  const cueAccept = playing && state.proposed && !state.decided;
  const hot = state.decided === 'accepted' && tab === PROPOSAL.dayIndex + 1 ? 0 : -1;
  return (
    <div ref={stage} className="ob-scene ob-share" data-focus={panelOpen ? 'panel' : undefined}>
      <PlanMap destId={ONBOARD_DESTINATION} markers={markers} route={route} focus={focus} hostRef={host} health={health}>
        <p className="ob-concept">{T.share.concept}</p>
        <button ref={shareRef} type="button" className={`ob-sharebtn${cueShare ? ' cue' : ''}`} onClick={story.share}>
          <Icon name="share-2" size="s" />
          {T.share.button}
        </button>
      </PlanMap>
      <DaySheet days={state.days} tab={tab} rowsShown={Number.POSITIVE_INFINITY} hot={hot} onTab={(t) => { story.interrupt(); setTab(t); }} />
      <Members ids={state.members} />
      <InvitePanel open={state.shared} copied={state.copied} onCopy={story.copy} copyRef={copyRef} />
      <ProposalPanel open={state.proposed && !state.decided} place={proposal} onAccept={story.accept} onReject={story.reject} acceptRef={acceptRef} cue={cueAccept} />
      {story.toast ? <p className="ob-toast" role="status">{story.toast}</p> : null}
      <TouchDot mark={story.touch} />
      <ReplayButton story={story} onClick={story.replay} />
    </div>
  );
}
