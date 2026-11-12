import type { RefObject } from 'react';
import { fill } from '../../../shared/const/copy.vi.ts';
import { Button } from '../../../shared/ui/Button.tsx';
import { onboardPhotoUrl } from '../model/onboardPhotos.ts';
import type { PlaceView } from '../../discover/index.ts';
import { MEMBERS, PROPOSAL } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';

interface InvitePanelProps {
  readonly open: boolean;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly copyRef: RefObject<HTMLButtonElement | null>;
}

/** The panel that invites travel companions: an illustrative link (not real) and the Copy button. */
export function InvitePanel({ open, copied, onCopy, copyRef }: InvitePanelProps) {
  return (
    <div className={`ob-panel invite${open ? ' on' : ''}`} aria-hidden={!open}>
      <b className="ob-ptitle">{T.share.invite}</b>
      <div className="ob-link">
        <span>{T.share.link}</span>
        <Button ref={copyRef} kind="secondary" className={copied ? 'done' : undefined} tabIndex={open ? 0 : -1} onClick={onCopy}>
          {copied ? T.share.copied : T.share.copy}
        </Button>
      </div>
      <small>{T.share.note}</small>
    </div>
  );
}

interface ProposalPanelProps {
  readonly open: boolean;
  readonly place: PlaceView | null;
  readonly onAccept: () => void;
  readonly onReject: () => void;
  readonly acceptRef: RefObject<HTMLButtonElement | null>;
  /** A light hint (a glowing ring) on the Accept button when the story is about to press it. */
  readonly cue: boolean;
}

/** The place a member wants to visit has no day yet; the illustrative trip owner chooses a day or leaves it for later, and promises no flow for approving extra places. */
export function ProposalPanel({ open, place, onAccept, onReject, acceptRef, cue }: ProposalPanelProps) {
  const member = MEMBERS.find((m) => m.name === PROPOSAL.by);
  return (
    <div className={`ob-panel proposal${open ? ' on' : ''}`} aria-hidden={!open} role="group" aria-label={T.share.proposalMeta}>
      <p className="ob-who">
        <i className={`ob-av ${member?.tone ?? 'a'}`}>{PROPOSAL.by.slice(0, 1)}</i>
        <span>{fill(T.share.proposalBy, { name: PROPOSAL.by, day: fill(T.trip.day, { n: PROPOSAL.dayIndex + 1 }), slot: T.trip.slots[PROPOSAL.slot] })}</span>
      </p>
      <div className="ob-pcard">
        <span className="ob-pimg" style={{ backgroundImage: place ? `url(${onboardPhotoUrl(place)})` : undefined }} />
        <span>
          <b>{place?.name}</b>
          <small>{T.share.proposalMeta}</small>
          <small className="why">{T.share.proposalWhy}</small>
        </span>
      </div>
      <div className="ob-btns">
        <Button kind="ghost" className="no" tabIndex={open ? 0 : -1} onClick={onReject}>
          {T.share.reject}
        </Button>
        <Button ref={acceptRef} className={`ok${cue ? ' cue' : ''}`} tabIndex={open ? 0 : -1} onClick={onAccept}>
          {T.share.accept}
        </Button>
      </div>
    </div>
  );
}

/** The members who have joined the trip (a round dot by display name) and the count. */
export function Members({ ids }: { readonly ids: readonly string[] }) {
  const list = MEMBERS.filter((m) => ids.includes(m.id));
  return (
    <div className="ob-members" aria-label={fill(T.share.members, { n: list.length })}>
      {list.map((m) => (
        <i key={m.id} className={`ob-av ${m.tone}`}>
          {m.id === 'me' ? m.name : m.name.slice(0, 1)}
        </i>
      ))}
    </div>
  );
}
