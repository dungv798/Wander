import { COPY } from '../const/copy.vi.ts';
import type { MapMarker } from './map.types.ts';
import { externalMapHref } from './mapUtil.ts';

/** Dòng "Đang tải bản đồ…" hiện ngay từ đầu để khung không trống không lời giải thích. */
export function showMapLoading(host: HTMLElement): void {
  clearMapStatus(host);
  host.dataset['ready'] = '0';
  const box = Object.assign(document.createElement('div'), { className: 'tm-loading', textContent: COPY.map.loading });
  box.setAttribute('role', 'status');
  host.appendChild(box);
}

/** Gỡ dòng đang tải và hộp lỗi toàn khung (không gỡ cảnh báo nền suy giảm). */
export function clearMapStatus(host: HTMLElement): void {
  host.querySelector('.tm-loading')?.remove();
  host.querySelector('.tm-err:not(.tm-degraded)')?.remove();
}

/**
 * Báo bản đồ chưa mở được: nói lý do, có nút "Thử lại" và liên kết bản đồ ngoài tới ghim đầu tiên.
 * Danh sách địa điểm của màn vẫn dùng được; khung không bao giờ để trống mà không có lời giải thích.
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
