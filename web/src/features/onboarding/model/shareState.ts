import type { PlaceView } from '../../discover/index.ts';
import type { TripDay } from './onboarding.types.ts';
import { applyProposal } from './sampleTrip.ts';

/** The illustrative state of the share scene (no real link, no data sent out). */
export interface ShareState {
  readonly days: readonly TripDay[];
  /** The invite panel is open; the link was 'copied'; the members who joined (ids); there is a suggestion; whether the trip owner has decided. */
  readonly shared: boolean;
  readonly copied: boolean;
  readonly members: readonly string[];
  readonly proposed: boolean;
  readonly decided: 'accepted' | 'rejected' | null;
}

/** The share scene actions in the exact order of the mechanism in plan 1b: invite by link -> a member joins with a display name -> suggests -> the trip owner accepts or rejects. */
export type ShareAction =
  | { readonly type: 'share' }
  | { readonly type: 'copy' }
  | { readonly type: 'join'; readonly member: string }
  | { readonly type: 'propose' }
  | { readonly type: 'accept'; readonly place: PlaceView }
  | { readonly type: 'reject' }
  | { readonly type: 'reset'; readonly state: ShareState };

/** The initial state: only the trip owner, the original itinerary, the invite panel not open. */
export function initialShare(days: readonly TripDay[], owner: string): ShareState {
  return { days, shared: false, copied: false, members: [owner], proposed: false, decided: null };
}

/** Updates the state; an action out of order or repeated is ignored so watching the scene again does not create a duplicate place or member. */
export function shareReducer(state: ShareState, action: ShareAction): ShareState {
  switch (action.type) {
    case 'reset':
      return action.state;
    case 'share':
      return state.shared || state.proposed ? state : { ...state, shared: true };
    case 'copy':
      return !state.shared || state.copied ? state : { ...state, copied: true };
    case 'join':
      return state.members.includes(action.member) ? state : { ...state, members: [...state.members, action.member] };
    case 'propose':
      return state.proposed ? state : { ...state, shared: false, proposed: true };
    case 'accept':
      return !state.proposed || state.decided ? state : { ...state, decided: 'accepted', days: applyProposal(state.days, action.place) };
    case 'reject':
      return !state.proposed || state.decided ? state : { ...state, decided: 'rejected' };
  }
}
