/** Constants of the MapLibre map and the native pin layer (unit px unless noted). */
export const MAP = {
  THUMB_PX: 96,
  PIN_PX: 44,
  PIN_RADIUS: 22,
  HUB_RADIUS: 13,
  PIN_BORDER: 3,
  SELECT_BORDER: 6,
  MUTED_OPACITY: 0.8,
  MUTED_SCALE: 0.62,
  LABEL_SIZE: 12.5,
  LABEL_MAX_WIDTH: 8,
  NUMBER_SIZE: 17,
  LABEL_OFFSET: 2,
  TEXT_HALO: 2,
  CIRCLE_RADIANS: Math.PI * 2,
  RGB_MAX: 255,
  COORD_DIGITS: 1,
  PIN_SOURCES: ['wander-pins-clustered', 'wander-pins-plain'],
  PIN_LAYER_PREFIX: 'wander-pins-',
  CLUSTER_LAYER: 'wander-clusters',
  CLUSTER_TEXT_LAYER: 'wander-clusters-count',
  FONT: ['Noto Sans Regular'],
  EMPTY_IMAGE: 'wander-empty-pin',
  IMAGE_CHANNELS: 4,
  FIT_PADDING: 24,
  FIT_LABEL_SPACE: 32,
  FIT_LABEL_SIDE: 56,
  FIT_SMALL_COUNT: 2,
  FIT_NEAR_KM: 0.25,
  FIT_LOCAL_KM: 2,
  FIT_CITY_KM: 8,
  FIT_NEAR_ZOOM: 17,
  FIT_LOCAL_ZOOM: 16,
  FIT_CITY_ZOOM: 15,
  FIT_REGION_ZOOM: 14,
  FLY_MS: 750,
  /** Past this time if the map is not ready, it reports 'could not open yet' with an alternative (slow/blocked network, no WebGL). */
  LOAD_TIMEOUT_MS: 15000,
  /** The zoom level of the external map link. */
  EXTERNAL_ZOOM: 13,
  /** The center and zoom level for the nationwide link when there is no pin. */
  EXTERNAL_COUNTRY: '6/16.2/106.0',
  /** Two pins closer than this are merged into a cluster (browse mode). */
  CLUSTER_PX: 34,
  CLUSTER_BADGE_RADIUS: 10,
  CLUSTER_BADGE_OFFSET: 17,
  CLUSTER_BADGE_TEXT: 10,
  LABEL_GAP: 4,
  /** The curvature of the connecting line (a ratio of the length). */
  ARC_CURVE: 0.18,
  /** Half the side of the cell a pin / cluster pin occupies (used when placing labels). */
  PIN_HALF: 20,
  CLUSTER_HALF: 18,
  LABEL_X: 24,
  LABEL_Y: 22,
  EDGE_PAD: 4,
  CLUSTER_FIT_PADDING: 60,
  /** The margin (px) around the visible area when checking 'the point is already in view' so it does not re-fit (a pin right at the edge counts as not clearly seen). */
  KEEP_VISIBLE_MARGIN: 40,
  /** The OpenFreeMap vector base style (ADR-015); public, no API key, no SLA. */
  STYLE_URL: 'https://tiles.openfreemap.org/styles/liberty',
  /** The whole-country view [west, south, east, north] in degrees (the map of Vietnam when there is no pin). */
  VIETNAM_BOUNDS: [102.1, 8.4, 115.5, 23.4],
  /** The MapLibre zoom limits: the farthest sees the whole country, the nearest sees the street. */
  GL_MIN_ZOOM: 3.4,
  GL_MAX_ZOOM: 17,
  /** The zoom ceiling of a single pin; a pair of pins is still adjusted by distance in geoMapPolicy. */
  GL_FIT_MAX_ZOOM: 16,
  /** The number of decimal places of the zoom-level checkpoint. */
  ZOOM_DIGITS: 2,
  GESTURE_LOCALE: {
    'CooperativeGesturesHandler.WindowsHelpText': 'Giữ Ctrl và cuộn để thu phóng bản đồ',
    'CooperativeGesturesHandler.MacHelpText': 'Giữ ⌘ và cuộn để thu phóng bản đồ',
    'CooperativeGesturesHandler.MobileHelpText': 'Dùng hai ngón để di chuyển bản đồ',
  },
  /** The route stroke width and the light outline around it (px). */
  ROUTE_WIDTH: 4.5,
  ROUTE_HALO_WIDTH: 9,
  ROUTE_HALO_OPACITY: 0.9,
  /** A flat background per PO 29/10; the colors are mixed from existing tokens, no separate palette is added. */
  BASE_TOKENS: { water: '--map-water', land: '--map-land', park: '--map-low', road: '--map-road', mainRoad: '--map-main-road', casing: '--map-road-casing', label: '--map-label', halo: '--surface', boundary: '--map-boundary' },
  LAND_TINT: 1,
  PARK_TINT: 1,
  CASING_TINT: 1,
  BOUNDARY_TINT: 1,
  BASE_LABEL_HALO: 1.4,
  MINOR_ROAD_ZOOM: 11,
  SMALL_LABEL_ZOOM: 13,
  DETAIL_FADE_ZOOMS: 1,
  /** The height (px) of the attribution strip overlaying the bottom of the map: the fit-to-frame area leaves this much extra at the bottom. */
  CREDIT_BAND: 44,
  /** The names of the sources/layers that Wander adds to the map style. */
  ROUTE_SOURCE_ID: 'wander-route',
  ROUTE_HALO_LAYER_ID: 'wander-route-halo',
  ROUTE_LINE_LAYER_ID: 'wander-route-line',
} as const;
