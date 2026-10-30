import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { ApiError } from '../../../shared/api/ApiError.ts';
import { apiClient } from '../../../shared/api/defaultClient.ts';
import { MEAL_SUGGEST as R } from '../model/mealSuggest.const.ts';

/** POI rộng chỉ dùng làm bản nháp tự do; distanceM là mét đường chim bay chưa làm tròn. */
export interface PoiSuggestion {
  readonly id: string;
  readonly name: string;
  readonly kind: 'food' | 'cafe' | 'fast_food' | 'bar' | 'other';
  readonly lat: number;
  readonly lon: number;
  readonly distanceM: number;
  readonly address: string | null;
  readonly openingHoursRaw: string | null;
  readonly openingHoursStatus: 'RAW' | 'UNKNOWN';
  readonly phone: string | null;
  readonly website: string | null;
  readonly verificationStatus: 'SNAPSHOT_UNVERIFIED';
  readonly attribution: { readonly sourceKind: string; readonly sourceUrl: string; readonly snapshotAt: string; readonly license: string; readonly licenseUrl: string; readonly credit: string };
}

/** Xác nhận hình dạng tối thiểu trước khi hiển thị; raw giờ và địa chỉ giữ nguyên, không parse. */
function isPoi(value: unknown): value is PoiSuggestion {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  const nullableText = ['address', 'openingHoursRaw', 'phone', 'website'].every(k => p[k] === null || typeof p[k] === 'string');
  const attribution = p['attribution'] as Record<string, unknown> | null;
  return typeof p['id'] === 'string' && typeof p['name'] === 'string' && p['name'].trim().length > 0
    && ['food', 'cafe', 'fast_food', 'bar', 'other'].includes(String(p['kind']))
    && ['lat', 'lon', 'distanceM'].every(k => typeof p[k] === 'number' && Number.isFinite(p[k])) && (p['distanceM'] as number) >= 0
    && nullableText && ['RAW', 'UNKNOWN'].includes(String(p['openingHoursStatus'])) && p['verificationStatus'] === 'SNAPSHOT_UNVERIFIED'
    && !!attribution && ['sourceKind', 'sourceUrl', 'snapshotAt', 'license', 'licenseUrl', 'credit'].every(k => typeof attribution[k] === 'string');
}

/** Hợp đồng đọc POI công khai qua ApiClient chung; tiêm client để thử lỗi mạng và hủy. */
export class PoiApi {
  private readonly client: ApiClient;

  /** Dùng máy khách chung, không tự tạo fetch hoặc cơ chế phiên mới. */
  constructor(client: ApiClient = apiClient) { this.client = client; }

  /** Lấy tối đa 12 quán trong bán kính mét; phản hồi hỏng là lỗi rõ ràng thay vì danh sách rỗng giả. */
  async nearby(destination: string, kind: 'food' | 'cafe' | 'rest' | 'all', near: { readonly lat: number; readonly lon: number }, radiusM: number = R.radiusM, signal?: AbortSignal): Promise<readonly PoiSuggestion[]> {
    const query = new URLSearchParams({ kind, near: `${near.lat},${near.lon}`, radiusM: String(radiusM), limit: String(R.limit) });
    const body = await this.client.get<{ poi?: unknown }>(`/api/catalog/destinations/${encodeURIComponent(destination)}/poi?${query}`, signal);
    if (!body || !Array.isArray(body.poi) || !body.poi.every(isPoi)) throw new ApiError('INTERNAL');
    return body.poi.slice().sort((a, b) => a.distanceM - b.distanceM || a.id.localeCompare(b.id));
  }
}
