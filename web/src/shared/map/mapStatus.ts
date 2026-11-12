import { COPY } from '../const/copy.vi.ts';
import type { MapMarker } from './map.types.ts';
import { externalMapHref } from './mapUtil.ts';

/** The 'Loading the map...' line shows right from the start so the frame is not empty without an explanation. */
export function showMapLoading(host: HTMLElement): void {
  clearMapStatus(host);
  host.dataset['ready'] = '0';
  const box = Object.assign(document.createElement('div'), { className: 'tm-loading', textContent: COPY.map.loading });
  box.setAttribute('role', 'status');
  host.appendChild(box);
}

/** Removes the loading line and the full-frame error box (it does not remove the degraded-base warning). */
export function clearMapStatus(host: HTMLElement): void {
  host.querySelector('.tm-loading')?.remove();
  host.querySelector('.tm-err:not(.tm-degraded)')?.remove();
}

/**
 * Reports that the map could not open: gives the reason, a 'Retry' button and an external map link to the first pin.
 * The screen's place list is still usable; the frame is never left empty without an explanation.
 */
export function showMapUnavailable(host: HTMLElement, reason: string, markers: readonly MapMarker[], onRetry: () => void): void {
  clearMapStatus(host);
  host.dataset['ready'] = 'err';
  const box = Object.assign(document.createElement('div'), { className: 'tm-err' });
  box.setAttribute('role', 'alert');
  const retry = Object.assign(document.createElement('button'), { type: 'button', textContent: COPY.map.retry });
  retry.addEventListener('click', onRetry);
  const outside = Object.assign(document.createElement('a'), { href: externalMapHref(markers), target: '_blank', rel: 'noopener noreferrer', textContent: COPY.map.openOutside, className: 'tm-outside' });
  box.append(
    Object.assign(document.createElement('span'), { textContent: reason }),
    Object.assign(document.createElement('small'), { textContent: COPY.map.unavailableHint }),
    retry,
    outside,
  );
  host.appendChild(box);
}
