import type { SampleDay, SceneKind } from './onboarding.types.ts';

/** The destination of the intro. */
export const ONBOARD_DESTINATION = 'da-lat';

/** The order of the four scenes. */
export const SCENES: readonly SceneKind[] = ['discover', 'swipe', 'plan', 'share'];
/** The indexes of the scenes (matching `SCENES`). */
export const SCENE = { DISCOVER: 0, SWIPE: 1, PLAN: 2, SHARE: 3 } as const;

/** Prebuilt images of the illustration (served from `public/onboard`). */
export const ART = {
  PLANE: '/onboard/plane.webp',
  COMPASS: '/onboard/compass.webp',
  BINOCULARS: '/onboard/binoculars.webp',
  CLOUDS: ['/onboard/cloud1.webp', '/onboard/cloud2.webp', '/onboard/cloud3.webp', '/onboard/cloud1.webp'],
} as const;

/** The three destinations that make up the fanned cards of the opening scene (destination ids; the first card is the main one and is also the destination of the later story). */
export const FAN_DESTINATIONS: readonly string[] = ['da-lat', 'ha-giang', 'ta-xua'];

/** The deck of the swipe scene: card 1 is in the sample itinerary (the demo chooses it), card 2 is outside the sample itinerary (the demo skips it); the sample itinerary does NOT depend on the viewer's choices. */
export const DECK_IDS: readonly string[] = ['nha-tho-con-ga', 'thac-prenn', 'ga-da-lat', 'linh-phuoc', 'thac-datanla', 'cho-da-lat'];

/** The best photo of each place for the intro (an index in the catalog's photo list): chosen by resolution, sharpness and color vividness, and still sharp when cropped to portrait. A place not listed here uses the first photo. */
export const PLACE_PHOTO_INDEX: Readonly<Record<string, number>> = { 'nha-tho-con-ga': 1, 'thac-prenn': 1, 'thac-datanla': 1 };

/** A separate photo for the destination card in the opening scene (a photo with a license in the catalog) and the focal point when cropping a tall card. */
export const DESTINATION_PHOTOS: Readonly<Record<string, { readonly url: string; readonly position: string }>> = {
  'da-lat': { url: '/catalog/photos/nha-tho-con-ga-2-w1280-a1ffaede55.webp', position: 'center' },
  'ha-giang': { url: '/catalog/photos/hoang-su-phi-2-w800-635f36a91f.webp', position: 'center 60%' },
  'ta-xua': { url: '/catalog/photos/ta-xua-1-w1280-e935c21120.webp', position: '38% center' },
};

/** The geometry and rhythm of the swipe scene (px, ms). */
export const SWIPE = {
  DRAG_PX: 96,
  TILT_PER_PX: 0.06,
  USER_COMMIT_PX: 80,
  STAMP_FULL_PX: 90,
  LIT_AT: 0.45,
  INTRO_MS: 450,
  FINGER_IN_MS: 300,
  PRESS_MS: 140,
  DRAG_MS: 850,
  HOLD_MS: 350,
  RELEASE_MS: 100,
  AFTER_FLY_MS: 800,
  BUTTONS_HINT_MS: 1700,
  END_PAUSE_MS: 1500,
  SETTLE_MS: 460,
  FAR_DEPTH: 2,
  CHIP_MS: 720,
  FINGER_Y_RATIO: 0.7,
  DRAG_DY_PX: 6,
  USER_DY_RATIO: 0.35,
  LIT_USER_PX: 40,
  THUMB_STEP_PX: 25,
  THUMB_R_PX: 17,
  THUMB_LEFT_PX: 18,
  THUMB_BOTTOM_PX: 82,
} as const;

/** The fixed sample itinerary 'Da Lat - 2 relaxed days'. Day 1 goes around the center (west to east along the lake and back to the market in the evening); Day 2 goes one way north to south from the meditation monastery down to Datanla waterfall and then Tuyen Lam lake. The part of day follows the catalog's `bestSlots`. */
export const SAMPLE_TRIP: readonly SampleDay[] = [
  {
    theme: 'center',
    items: [
      { placeId: 'nha-tho-con-ga', slot: 'morning', note: 'church' },
      { placeId: 'quang-truong-lam-vien', slot: 'afternoon', note: 'square' },
      { placeId: 'ho-xuan-huong', slot: 'dusk', note: 'lake' },
      { placeId: 'cho-da-lat', slot: 'evening', note: 'market' },
    ],
  },
  {
    theme: 'south',
    items: [
      { placeId: 'thien-vien-truc-lam', slot: 'morning', note: 'monastery' },
      'lunch',
      { placeId: 'thac-datanla', slot: 'afternoon', note: 'waterfall' },
      { placeId: 'ho-tuyen-lam', slot: 'lateAfternoon', note: 'reservoir' },
    ],
  },
];

/** The member's suggestion in the share scene: adds a place in the same direction at the start of a day (the day index starts from 0). */
export const PROPOSAL = { placeId: 'ga-da-lat', dayIndex: 1, slot: 'morning', by: 'Mai' } as const;

/** The illustrative members of the share scene: the display name and the color key. */
export const MEMBERS = [
  { id: 'me', name: 'Bạn', tone: 'me' },
  { id: 'mai', name: 'Mai', tone: 'a' },
  { id: 'bao', name: 'Bảo', tone: 'b' },
] as const;

/** The rhythm of the map scene (ms) and the padding when fitting the frame (px). */
export const PLAN_TIMING = {
  OVERVIEW_MS: 1400,
  DAY_ZOOM_MS: 1000,
  PIN_MS: 1000,
  BREAK_MS: 650,
  DAY_END_MS: 500,
  LAST_DAY_END_MS: 900,
  FINALE_MS: 1800,
  MAP_WAIT_MS: 6000,
} as const;

/** The rhythm of the share scene (ms). */
export const SHARE_TIMING = {
  START_MS: 600,
  TAP_MOVE_MS: 500,
  TAP_PRESS_MS: 140,
  TAP_AFTER_MS: 250,
  AFTER_SHARE_MS: 700,
  JOIN_FIRST_MS: 450,
  JOIN_NEXT_MS: 650,
  JOIN_AFTER_MS: 550,
  BEFORE_PROPOSAL_MS: 250,
  PROPOSAL_READ_MS: 1500,
  END_MS: 2600,
  MANUAL_PROPOSAL_MS: 450,
} as const;

/** Auto-advance from the opening scene after (ms) when the viewer has not touched anything. */
export const DISCOVER_AUTO_MS = 3000;
/** The scene transition time (ms): the old scene slides out, the new scene slides in. */
export const TRANSITION_MS = 420;
/** The time the shared card flies from one scene to the other (ms); smaller than the opening beat of the swipe demo so the demo starts when the card is in place. */
export const MORPH_MS = 460;
/** A short notice turns off by itself after (ms). */
export const TOAST_MS = 2200;
/** If the map is not ready after this long, the illustrative diagram is shown instead. */
export const MAP_FALLBACK_MS = 6000;
/** The padding around the pins when fitting the map frame (px). */
export const MAP_PADDING = 36;
