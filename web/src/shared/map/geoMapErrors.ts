import type { Map as MlMap } from 'maplibre-gl';
import { COPY } from '../const/copy.vi.ts';
import { isBasemapError } from './geoMapPolicy.ts';

/** Shows at most one source/base-tile warning; retrying the current style reloads both the TileJSON and the tiles, keeping the camera and the route. */
export function showBasemapError(map: MlMap, host: HTMLElement, event: Parameters<typeof isBasemapError>[0]): void {
  if (!isBasemapError(event) || host.querySelector('.tm-degraded')) return;
  const box = Object.assign(document.createElement('div'), { className: 'tm-err tm-degraded' });
  box.setAttribute('role', 'status');
  const retry = Object.assign(document.createElement('button'), { type: 'button', textContent: COPY.map.retry });
  retry.addEventListener('click', () => {
    box.remove();
    map.setStyle(map.getStyle(), { diff: false });
  });
  box.append(Object.assign(document.createElement('span'), { textContent: COPY.map.degraded }), retry);
  host.appendChild(box);
}
