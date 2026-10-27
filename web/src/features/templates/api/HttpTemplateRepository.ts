import { ApiError } from '../../../shared/api/ApiError.ts';
import type { ApiClient } from '../../../shared/api/ApiClient.ts';
import { CLIENT_ERROR, HTTP } from '../../../shared/api/http.const.ts';
import type { TemplateRepository } from './TemplateRepository.ts';
import { TEMPLATES_API } from './templatesApi.const.ts';

/** Có phải đối tượng thường (không null, không mảng). */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Một ngày của API (`placeIds`, `note`) thành dạng thô mà bộ ánh xạ lịch mẫu của giao diện đọc (`places`, `note`); thiếu `placeIds` ⇒ danh sách rỗng. */
function toRawDay(day: unknown): unknown {
  if (!isRecord(day)) return day;
  const { placeIds, ...rest } = day;
  return { ...rest, places: Array.isArray(placeIds) ? placeIds : [] };
}

/** Một lịch mẫu của API thành dạng thô; phần tử không phải đối tượng bị bỏ (trả null để lọc). */
function toRawTemplate(template: unknown): Record<string, unknown> | null {
  if (!isRecord(template)) return null;
  const days = template['days'];
  return { ...template, days: Array.isArray(days) ? days.map(toRawDay) : days };
}

/**
 * Kho đọc lịch mẫu từ `GET /api/catalog/destinations/{id}/templates` (công khai). API trả `days[].placeIds`; giao diện đọc
 * `days[].places` nên đổi khóa ở đây, các bước kiểm tra và ghép với kho địa điểm vẫn do `toTemplateViews` đảm nhiệm.
 * Kết quả được NHỚ theo điểm đến (nhiều màn cùng cần); lỗi không được nhớ nên thử lại được.
 */
export class HttpTemplateRepository implements TemplateRepository {
  private readonly client: ApiClient;
  private readonly cache = new Map<string, Promise<unknown>>();

  /** Dùng máy khách HTTP đã cho (tiêm được khi test). */
  constructor(client: ApiClient) {
    this.client = client;
  }

  /** Lịch mẫu thô của một điểm đến; điểm đến không có (404) hoặc chưa có lịch thì không phải lỗi. Yêu cầu dùng chung nên không nhận tín hiệu hủy của từng người gọi. */
  templates(destId: string): Promise<unknown> {
    const hit = this.cache.get(destId);
    if (hit) return hit;
    const request = this.fetchTemplates(destId);
    this.cache.set(destId, request);
    request.catch(() => this.cache.delete(destId));
    return request;
  }

  /** Gọi API lịch mẫu và đổi sang dạng thô của giao diện. */
  private async fetchTemplates(destId: string): Promise<unknown> {
    let body: unknown;
    try {
      body = await this.client.get<unknown>(`${TEMPLATES_API.DESTINATIONS}/${encodeURIComponent(destId)}${TEMPLATES_API.SUFFIX}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === HTTP.NOT_FOUND) return {};
      throw e;
    }
    const list = isRecord(body) ? body['templates'] : undefined;
    if (!Array.isArray(list)) throw new ApiError(CLIENT_ERROR.INTERNAL);
    return { templates: list.map(toRawTemplate).filter((t) => t !== null) };
  }
}
