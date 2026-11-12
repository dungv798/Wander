import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';

/** Constants of the app frame's map (one persistent map behind the Discover / Destination / Selected / Trips screens). */
export const SHELL_MAP = {
  /** The screens that sit on the frame map; other screens (deck, trip, settings...) hide it. */
  VISIBLE_VIEWS: [VIEW.EXPLORE, VIEW.DEST, VIEW.DECK, VIEW.PICKED, VIEW.TRIPS] as readonly ViewName[],
  /** The fit-to-frame margin around a pin (px). */
  FIT_PADDING_PX: 16,
  /** The fit-to-frame margin for a scene with many destinations/trips: enough for the pin photo (half a side) and the name label, so North/South are not cut off on a small phone (px). */
  OVERVIEW_PADDING_PX: 24,
  /** The zoom ceiling of the whole-country scene so far-apart destinations still fit the frame. */
  OVERVIEW_MAX_ZOOM: 7,
  /** The top margin of the visible area (leaves room for the floating logo/search bar), px. */
  INSET_TOP_PX: 100,
  /** Wide screen: the width of the left panel that covers the map (matches `--shell-panel-width` + margin), px. */
  PANEL_INSET_PX: 556,
  /** Phone, panel open: the part of the frame height covered by the panel. */
  SHEET_OPEN_FRACTION: 0.7,
  /** Mobile home has a sheet starting at 39%, so the map must fit within the really visible range. */
  HOME_SHEET_COVER_FRACTION: 0.61,
  /** Phone, panel collapsed: the height of the title strip that still covers the bottom, px. */
  PEEK_INSET_PX: 140,
  /** The size of the phone page, matching the CSS tokens of the header and the preview map area. */
  DOCUMENT_HEADER_PX: 60,
  DOCUMENT_PREVIEW_PX: 160,
} as const;

/** Dragging the content sheet on a phone (collapse to see a wider map, drag up to open it again). */
export const SHEET_DRAG = {
  /** Dragging past this part of the distance between the two states switches the state on release. */
  COMMIT_FRACTION: 0.25,
  /** A flick faster than this speed (px/ms) switches the state even if the drag did not reach the threshold. */
  FLING_PX_PER_MS: 0.5,
  /** A movement shorter than this (px) is still a tap, not a drag. */
  TAP_SLOP_PX: 8,
  /** The height (px) of the sheet when open if it could not be measured. */
  FALLBACK_OPEN_TOP_FRACTION: 0.3,
} as const;
