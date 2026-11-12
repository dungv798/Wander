import type { StyleSpecification } from 'maplibre-gl';
import { MAP } from './map.const.ts';
import { VIETNAM_ARCHIPELAGO_LABELS } from './vietnamLabels.const.ts';

/** Adds Vietnamese labels to every real map, independent of gaps in the base tile's labels. */
export function withVietnamLabels(style: StyleSpecification, ink: string, halo: string): StyleSpecification {
  if (!style.glyphs) return style;
  return {
    ...style,
    sources: { ...style.sources, 'wander-vietnam-geography': { type: 'geojson', data: { type: 'FeatureCollection', features: VIETNAM_ARCHIPELAGO_LABELS.map(label => ({ type: 'Feature', properties: { name: label.name }, geometry: { type: 'Point', coordinates: [...label.coordinates] } })) } } },
    layers: [...style.layers, { id: 'wander-vietnam-archipelago-labels', type: 'symbol', source: 'wander-vietnam-geography', minzoom: 3,
      layout: { 'text-field': ['get', 'name'], 'text-font': [...MAP.FONT], 'text-size': 12, 'text-line-height': 1.5, 'text-max-width': 13, 'text-allow-overlap': true },
      paint: { 'text-color': ink, 'text-halo-color': halo, 'text-halo-width': 2 },
    }],
  };
}
