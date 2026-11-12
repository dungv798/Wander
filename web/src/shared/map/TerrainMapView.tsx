import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoMap } from './GeoMap.ts';
import type { FitOptions, Insets, MapMarker, MapMode, MapRoute } from './map.types.ts';

/** A fit-to-frame request: the pins (null = all) and options. The caller should `useMemo` so it does not re-fit on every render. */
export interface MapFit {
  readonly ids: readonly string[] | null;
  readonly options?: FitOptions;
}

interface TerrainMapViewProps {
  readonly dest: string;
  /** The accessible label of the map area (read by screen readers). */
  readonly label: string;
  readonly markers: readonly MapMarker[];
  readonly route?: MapRoute | null;
  readonly mode?: MapMode;
  readonly insets?: Partial<Insets>;
  readonly fit?: MapFit | null;
  readonly selected?: string | null;
  readonly interactive?: boolean;
  readonly cooperativeGestures?: boolean;
  readonly towns?: boolean;
  readonly credit?: boolean;
  /** Leaves the attribution strip at the bottom when fitting (default by `credit`). */
  readonly creditBand?: boolean;
  readonly onPin?: (id: string) => void;
  readonly onSegment?: (id: string) => void;
  readonly onMapDismiss?: () => void;
  readonly selectedSegment?: string | null;
  readonly className?: string;
}

const NO_ROUTE_LABELS: readonly string[] = [];

/**
 * The terrain map area used in React. The map is an imperative object (`GeoMap`) that lives by the element's lifecycle:
 * created when the element enters the DOM, destroyed when it leaves; the properties (pins, route, mode, fit) are pushed in by effects.
 */
export function TerrainMapView({ dest, label, markers, route = null, mode = 'browse', insets, fit = null, selected = null, interactive = true, cooperativeGestures = false, towns = true, credit = true, creditBand, onPin, onSegment, onMapDismiss, selectedSegment = null, className }: TerrainMapViewProps) {
  const [map, setMap] = useState<GeoMap | null>(null);
  const onPinRef = useRef(onPin);
  const onSegmentRef = useRef(onSegment);
  const onDismissRef = useRef(onMapDismiss);
  const hasSegmentAction = Boolean(onSegment);
  const hasPinAction = Boolean(onPin);
  useEffect(() => {
    onPinRef.current = onPin;
    onSegmentRef.current = onSegment;
    onDismissRef.current = onMapDismiss;
  });

  const attach = useCallback(
    /** Creates the map when the element enters the DOM; returns a destroy function when the element leaves (React 19's ref callback with cleanup). */
    (el: HTMLDivElement | null) => {
      if (!el) return undefined;
      const m = new GeoMap(el, { dest, label, interactive, cooperativeGestures, towns, credit, ...(creditBand === undefined ? {} : { creditBand }), onMapDismiss: () => onDismissRef.current?.(), ...(hasSegmentAction ? { onSegment: (id: string) => onSegmentRef.current?.(id) } : {}), ...(hasPinAction ? { onPin: (id: string) => onPinRef.current?.(id) } : {}) });
      setMap(m);
      return () => {
        m.destroy();
        setMap(null);
      };
    },
    [dest, label, interactive, cooperativeGestures, towns, credit, creditBand, hasPinAction, hasSegmentAction],
  );

  useEffect(() => {
    map?.setMode(mode);
  }, [map, mode]);
  useEffect(() => {
    if (insets) map?.setInsets(insets);
  }, [map, insets]);
  useEffect(() => {
    map?.setMarkers(markers);
  }, [map, markers]);
  useEffect(() => {
    map?.setRoute(route ? route.ids : null, route?.labels ?? NO_ROUTE_LABELS, route ?? undefined);
  }, [map, route]);
  useEffect(() => {
    map?.select(selected);
  }, [map, selected]);
  useEffect(() => {
    if (fit) map?.fitTo(fit.ids, fit.options);
  }, [map, fit]);

  useEffect(() => {
    map?.selectSegment(selectedSegment);
  }, [map, selectedSegment]);

  return <div ref={attach} className={className} />;
}
