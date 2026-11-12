import { useMemo } from 'react';
import { COPY } from '../../../shared/const/copy.vi.ts';
import { VIEW } from '../../../shared/const/routes.const.ts';
import type { ViewName } from '../../../shared/const/routes.const.ts';
import { useIsWide } from '../../../shared/hooks/useMediaQuery.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import { navigate, useRoute } from '../../../shared/router/hashRoute.ts';
import { useTrips } from '../../trips/index.ts';
import { useCurrentDestination } from '../hooks/CurrentDestinationProvider.tsx';
import { useDestination } from '../hooks/useDestination.ts';
import { useDiscover } from '../hooks/DiscoverProvider.tsx';
import { usePlaceSheet } from '../hooks/PlaceSheetProvider.tsx';
import type { SheetMode } from '../hooks/ShellSheetProvider.tsx';
import { SHELL_MAP } from '../model/shellMap.const.ts';
import { shellMapScene } from '../model/shellMapScene.ts';
import { useDiscoveryTopic } from '../hooks/DiscoveryTopicProvider.tsx';
import { matchesDiscoveryFilter } from '../model/discoveryFilters.ts';
import { useDeckSpotlight } from '../hooks/DeckSpotlightProvider.tsx';

/** The placeholder id for the map's `dest` option: one persistent map for the whole country so the id does not change with the destination (changing the id would destroy and rebuild the map). */
const SHELL_MAP_ID = 'vn';

/** The margin that the sheet covers on the map: a wide screen has a left panel, a phone has a bottom panel (when collapsed only the title bar remains). */
function useMapInsets(sheet: SheetMode, view: ViewName, documentScroll: boolean): { top: number; left: number; bottom: number } {
  const wide = useIsWide();
  return useMemo(() => {
    if (wide) return { top: SHELL_MAP.INSET_TOP_PX, left: SHELL_MAP.PANEL_INSET_PX, bottom: 0 };
    if (documentScroll) {
      const top = document.querySelector('.map-chrome')?.getBoundingClientRect().height ?? SHELL_MAP.DOCUMENT_HEADER_PX;
      return { top, left: 0, bottom: sheet === 'open' ? 0 : SHELL_MAP.PEEK_INSET_PX };
    }
    if (view === VIEW.EXPLORE) return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom: sheet === 'peek' ? SHELL_MAP.PEEK_INSET_PX : Math.round(window.innerHeight * SHELL_MAP.HOME_SHEET_COVER_FRACTION) };
    if (view === VIEW.DECK) return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom: 0 };
    const bottom = sheet === 'peek' ? SHELL_MAP.PEEK_INSET_PX : Math.round(window.innerHeight * SHELL_MAP.SHEET_OPEN_FRACTION);
    return { top: SHELL_MAP.INSET_TOP_PX, left: 0, bottom };
  }, [wide, sheet, view, documentScroll]);
}

/**
 * The PERSISTENT map of the app frame: a single MapLibre instance behind every screen, changing only the scene (pins + camera) by the current screen.
 * On other screens that cover it or have their own map it is only hidden (not destroyed) so coming back is instant, with no reload. It does not ask for the user's location.
 * Tapping a pin: on the whole-country scene it chooses that destination; on the destination/selected scene it opens that place's detail.
 */
export function ShellMap({ view, sheet, documentScroll = false }: { readonly view: ViewName; readonly sheet: SheetMode; readonly documentScroll?: boolean }) {
  const { destId, selectedId, destinations, select } = useCurrentDestination();
  const topic = useDiscoveryTopic();
  const { focus } = useDeckSpotlight();
  const { sub } = useRoute();
  const summaries = view === VIEW.EXPLORE ? topic.destinations : destinations;
  const { state: loaded } = useDestination(destId);
  const { state } = useDiscover();
  const place = usePlaceSheet();
  const { state: tripState } = useTrips();
  const insets = useMapInsets(sheet, view, documentScroll);
  const detail = useMemo(() => {
    if (loaded.status !== 'ready') return null;
    const places = loaded.data.places.filter(place => matchesDiscoveryFilter(place, sub));
    if (view === VIEW.DECK) {
      const active = focus?.destinationId === destId ? focus.placeId : null;
      return active ? { ...loaded.data, places: loaded.data.places.filter(place => place.id === active) } : loaded.data;
    }
    return view === VIEW.DEST && places.length ? { ...loaded.data, places } : loaded.data;
  }, [loaded, view, sub, focus, destId]);
  const pickedIds = useMemo(() => new Set(Object.entries(state.decisions).filter(([, decision]) => decision === 'like').map(([id]) => id)), [state.decisions]);
  const trips = useMemo(() => tripState.trips.map((trip) => ({ id: trip.id, name: trip.name, destinationId: trip.destinationId })), [tripState.trips]);
  const scene = useMemo(() => shellMapScene({ view, selectedId, destId, summaries, detail, pickedIds, trips }), [view, selectedId, destId, summaries, detail, pickedIds, trips]);
  // A NEW fit-to-frame object each time the scene is rebuilt or the sheet collapses/expands (the margin changes -> the camera flies again so the pins end up in the middle of the visible map part); an ordinary re-render keeps it.
  const fit = useMemo(() => (scene.fit ? { ...scene.fit } : null), [scene, sheet]); // eslint-disable-line react-hooks/exhaustive-deps -- `sheet` is only there to refresh the fit-to-frame request
  const hidden = scene.kind === 'hidden';
  /** Tapping a pin: a destination -> opens that destination's page; a trip -> opens the trip; a place -> opens the detail. */
  function onPin(id: string): void {
    if (scene.kind === 'overview') {
      select(id);
      navigate(VIEW.DEST, id);
    } else if (scene.kind === 'trips') navigate(VIEW.TRIP, id, 'ov');
    else place.open(id, view === VIEW.DECK && sub ? { noDecide: true } : undefined);
  }
  return (
    <div className="shell-map" data-scene={scene.kind} aria-hidden={hidden || (documentScroll && sheet === 'open') || undefined} inert={hidden || (documentScroll && sheet === 'open')}>
      <TerrainMapView className="shell-map-view" dest={SHELL_MAP_ID} label={COPY.map.shell} markers={scene.markers} fit={fit} insets={insets} creditBand={false} selected={place.placeId} onPin={onPin} />
    </div>
  );
}
