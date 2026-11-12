import { useMemo } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { MapMarker, MapRoute } from '../../../shared/map/map.types.ts';
import { TerrainMapView } from '../../../shared/map/TerrainMapView.tsx';
import type { MapFit } from '../../../shared/map/TerrainMapView.tsx';
import type { MapHealth } from '../hooks/useMapHealth.ts';
import { MAP_PADDING } from '../model/onboarding.const.ts';
import { ONBOARD_COPY as T } from '../model/onboarding.copy.ts';
import { SchematicMap } from './SchematicMap.tsx';

interface PlanMapProps {
  readonly destId: string;
  readonly markers: readonly MapMarker[];
  readonly route: MapRoute | null;
  /** The pin ids that must fit the frame (null = the whole trip). */
  readonly focus: readonly string[] | null;
  /** The container (to watch the map) and the map status watched by the scene, because the scene's script needs to wait for the map to be ready. */
  readonly hostRef: RefObject<HTMLDivElement | null>;
  readonly health: MapHealth;
  /** The scene's own overlay (the Share button, the illustrative label...). */
  readonly children?: ReactNode;
}

/** The itinerary map: the app's real map (with photo pins, numbers, a route), shows 'Loading...' while waiting and switches to an illustrative diagram when the base fails; always with the label 'Order of visits'. */
export function PlanMap({ destId, markers, route, focus, hostRef, health, children }: PlanMapProps) {
  const fit = useMemo<MapFit>(() => ({ ids: focus ? [...focus] : null, options: { animate: true, padding: MAP_PADDING } }), [focus]);
  return (
    <div ref={hostRef} className="ob-map">
      {health.state === 'fallback' ? (
        <SchematicMap markers={markers} route={route} focus={focus} label={T.trip.mapLabel} />
      ) : (
        <TerrainMapView dest={destId} label={T.trip.mapLabel} markers={markers} route={route} mode="route" fit={fit} interactive={false} towns={false} credit={false} />
      )}
      {health.state === 'loading' ? <p className="ob-maploading" role="status">{T.trip.mapLoading}</p> : null}
      {health.state === 'fallback' ? <p className="ob-mapnote" role="status">{T.trip.mapFallback}</p> : null}
      <p className="ob-maporder">{T.trip.order}</p>
      {children}
    </div>
  );
}
