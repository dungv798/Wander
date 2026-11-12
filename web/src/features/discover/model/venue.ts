import type { VenueView } from './Catalog.types.ts';

/** Only a public HTTPS URL may be used as a link to an establishment; a URL with embedded login information is not accepted. */
function safeWeb(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

/** Additive metadata must have a full source/address and a kind code, to avoid turning bad data into an arbitrary website button. */
export function isVenueView(value: unknown): value is VenueView {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return ['restaurant', 'cafe', 'bar', 'lodging'].includes(String(v['kind'])) && typeof v['kindName'] === 'string'
    && typeof v['address'] === 'string' && v['address'].trim().length > 0
    && (v['website'] === '' || safeWeb(v['website'])) && safeWeb(v['sourceUrl'])
    && typeof v['checkedAt'] === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v['checkedAt'])
    && ['phone', 'serviceHours', 'priceNote'].every(key => v[key] === undefined || typeof v[key] === 'string');
}
