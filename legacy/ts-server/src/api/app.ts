import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { authenticate, createIdentityWithSession, listActiveSessions, revokeOwnSession } from './auth.ts';
import type { AuthContext } from './auth.ts';
import { ApiError, badRequest, notFound } from './errors.ts';
import { createLimiter } from './limiter.ts';
import { serveStatic } from './static.ts';
import {
  approveDeviceLink,
  approveStepUp,
  beginCodeReplacement,
  completeRecovery,
  confirmCodeReplacement,
  createDeviceLink,
  createStepUpRequest,
  deviceLinkStatus,
  issueInitialCode,
  recoveryCodeStatus,
  startRecovery,
} from './recovery.ts';
import {
  createItem,
  createTrip,
  getItemView,
  getTripDetail,
  listTrash,
  listTrips,
  permanentlyDeleteItem,
  reorderDay,
  requireTrip,
  restoreItem,
  setTaskDone,
  softDeleteItem,
  updateItem,
  updateTrip,
} from './store.ts';

const MAX_BODY_BYTES = 64 * 1024;

export interface AppOptions {
  /** Số danh tính được tạo tối đa cho mỗi địa chỉ trong một giờ (chống lạm dụng). */
  identityLimitPerHour?: number;
  /** Số lần gọi các điểm cuối khôi phục/ghép thiết bị chưa xác thực, tối đa cho mỗi địa chỉ trong một giờ. */
  recoveryLimitPerHour?: number;
  /** Số lần duyệt ghép thiết bị / xác thực lại tối đa cho mỗi phiên trong một giờ. */
  approvalLimitPerHour?: number;
  /** Thư mục giao diện đã build (web/dist); nếu có, phục vụ cùng nguồn gốc với API. */
  staticDir?: string;
}

interface PublicCtx {
  params: string[];
  body: Record<string, unknown>;
  ip: string;
}
interface AuthedCtx {
  auth: AuthContext;
  params: string[];
  body: Record<string, unknown>;
}

interface Route<C> {
  method: string;
  pattern: RegExp;
  handler: (ctx: C) => unknown;
  status: number;
}

function route<C>(method: string, path: string, handler: (ctx: C) => unknown, status = 200): Route<C> {
  const pattern = new RegExp('^' + path.replace(/:[a-zA-Z]+/g, '([^/]+)') + '$');
  return { method, pattern, handler, status };
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    size += buf.length;
    if (size > MAX_BODY_BYTES) throw new ApiError(413, 'BODY_TOO_LARGE', 'Nội dung gửi lên quá lớn.');
    chunks.push(buf);
  }
  if (size === 0) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw badRequest('INVALID_JSON', 'Nội dung không phải JSON hợp lệ.');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw badRequest('INVALID_JSON', 'Nội dung phải là một đối tượng JSON.');
  }
  return parsed as Record<string, unknown>;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

const rateLimited = () => new ApiError(429, 'RATE_LIMITED', 'Bạn thao tác quá nhanh. Hãy thử lại sau.');

export function createApp(db: DatabaseSync, options: AppOptions = {}): Server {
  const HOUR = 3_600_000;
  const identityLimiter = createLimiter(options.identityLimitPerHour ?? 30, HOUR);
  const recoveryLimiter = createLimiter(options.recoveryLimitPerHour ?? 30, HOUR);
  const approvalLimiter = createLimiter(options.approvalLimitPerHour ?? 20, HOUR);

  // ---- Điểm cuối công khai (chưa có phiên): tạo danh tính, khôi phục bằng mã, ghép thiết bị ----
  const publicRoutes: Route<PublicCtx>[] = [
    route(
      'POST',
      '/api/identity',
      ({ ip, body }) => {
        if (!identityLimiter.hit(ip)) throw rateLimited();
        const { identityId, token } = createIdentityWithSession(db);
        // D26: mã chỉ hiển thị một lần khi tạo danh tính; người dùng được phép bỏ qua (khi đó chưa có mã, xem MĐ-2).
        const skip = body['skipRecoveryCode'] === true;
        return { identityId, token, recoveryCode: skip ? null : issueInitialCode(db, identityId) };
      },
      201,
    ),
    route('POST', '/api/recovery/start', ({ ip, body }) => {
      if (!recoveryLimiter.hit(ip)) throw rateLimited();
      return startRecovery(db, body);
    }),
    route('POST', '/api/recovery/complete', ({ ip, body }) => {
      if (!recoveryLimiter.hit(ip)) throw rateLimited();
      return completeRecovery(db, body);
    }),
    route(
      'POST',
      '/api/device-links',
      ({ ip, body }) => {
        if (!recoveryLimiter.hit(ip)) throw rateLimited();
        return createDeviceLink(db, body);
      },
      201,
    ),
    route('GET', '/api/device-links/:id', ({ ip, params }) => {
      if (!recoveryLimiter.hit(ip)) throw rateLimited();
      return deviceLinkStatus(db, params[0]!);
    }),
  ];

  // ---- Điểm cuối cần phiên hợp lệ ----
  const routes: Route<AuthedCtx>[] = [
    route('GET', '/api/sessions', ({ auth }) => ({ sessions: listActiveSessions(db, auth) })),
    route('DELETE', '/api/sessions/:id', ({ auth, params }) => {
      if (!revokeOwnSession(db, auth, params[0]!)) throw notFound();
      return undefined;
    }),
    route('POST', '/api/device-links/approve', ({ auth, body }) => {
      if (!approvalLimiter.hit(auth.sessionId)) throw rateLimited();
      return approveDeviceLink(db, auth, body);
    }),
    route('GET', '/api/recovery-code', ({ auth }) => recoveryCodeStatus(db, auth.identityId)),
    route('POST', '/api/recovery-code/begin', ({ auth, body }) => {
      if (!approvalLimiter.hit(auth.sessionId)) throw rateLimited();
      return beginCodeReplacement(db, auth, body);
    }),
    route('POST', '/api/recovery-code/confirm', ({ auth, body }) => {
      if (!approvalLimiter.hit(auth.sessionId)) throw rateLimited();
      return confirmCodeReplacement(db, auth, body);
    }),
    route(
      'POST',
      '/api/step-up/requests',
      ({ auth, body }) => {
        if (!approvalLimiter.hit(auth.sessionId)) throw rateLimited();
        return createStepUpRequest(db, auth, body);
      },
      201,
    ),
    route('POST', '/api/step-up/approve', ({ auth, body }) => {
      if (!approvalLimiter.hit(auth.sessionId)) throw rateLimited();
      return approveStepUp(db, auth, body);
    }),

    route('GET', '/api/trips', ({ auth }) => ({ trips: listTrips(db, auth.identityId).map(({ ownerIdentityId: _o, ...t }) => t) })),
    route(
      'POST',
      '/api/trips',
      ({ auth, body }) => {
        const { ownerIdentityId: _o, ...t } = createTrip(db, auth.identityId, body);
        return { trip: t };
      },
      201,
    ),
    route('GET', '/api/trips/:id', ({ auth, params }) => getTripDetail(db, auth.identityId, params[0]!)),
    route('PATCH', '/api/trips/:id', ({ auth, params, body }) => {
      const { ownerIdentityId: _o, ...t } = updateTrip(db, auth.identityId, params[0]!, body);
      return { trip: t };
    }),
    route(
      'POST',
      '/api/trips/:id/items',
      ({ auth, params, body }) => ({ item: createItem(db, auth.identityId, params[0]!, body) }),
      201,
    ),
    route('PATCH', '/api/trips/:id/items/:itemId', ({ auth, params, body }) => ({
      item: updateItem(db, auth.identityId, params[0]!, params[1]!, body),
    })),
    route('GET', '/api/trips/:id/items/:itemId', ({ auth, params }) => ({
      item: getItemView(db, auth.identityId, params[0]!, params[1]!),
    })),
    route('DELETE', '/api/trips/:id/items/:itemId', ({ auth, params }) => ({
      item: softDeleteItem(db, auth.identityId, params[0]!, params[1]!),
    })),
    route('POST', '/api/trips/:id/items/:itemId/restore', ({ auth, params }) => ({
      item: restoreItem(db, auth.identityId, params[0]!, params[1]!),
    })),
    route('DELETE', '/api/trips/:id/items/:itemId/permanent', ({ auth, params }) => {
      permanentlyDeleteItem(db, auth.identityId, params[0]!, params[1]!);
      return undefined;
    }),
    route('PUT', '/api/trips/:id/items/:itemId/done', ({ auth, params, body }) => ({
      item: setTaskDone(db, auth.identityId, params[0]!, params[1]!, body['done']),
    })),
    route('POST', '/api/trips/:id/days/:date/reorder', ({ auth, params, body }) => ({
      items: reorderDay(db, auth.identityId, params[0]!, params[1]!, body['orderedIds']),
    })),
    route('GET', '/api/trips/:id/trash', ({ auth, params }) => {
      requireTrip(db, auth.identityId, params[0]!);
      return { items: listTrash(db, auth.identityId, params[0]!) };
    }),
  ];

  return createServer((req, res) => {
    void handle(req, res);
  });

  function pick<C>(table: Route<C>[], method: string, path: string): { route: Route<C>; params: string[] } | 'method' | null {
    const matching = table.filter((r) => r.pattern.test(path));
    if (matching.length === 0) return null;
    const r = matching.find((x) => x.method === method);
    if (!r) return 'method';
    return { route: r, params: (r.pattern.exec(path) ?? []).slice(1).map((p) => decodeURIComponent(p)) };
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const method = req.method ?? 'GET';
      if (!url.pathname.startsWith('/api/')) {
        if (options.staticDir && serveStatic(options.staticDir, req, res)) return;
        throw notFound();
      }
      const readsBody = method !== 'GET' && method !== 'DELETE';

      // Điểm cuối công khai được khớp trước; các đường còn lại cần phiên hợp lệ.
      const pub = pick(publicRoutes, method, url.pathname);
      if (pub && pub !== 'method') {
        const body = readsBody ? await readJson(req) : {};
        const out = pub.route.handler({ params: pub.params, body, ip: req.socket.remoteAddress ?? 'unknown' });
        send(res, out === undefined ? 204 : pub.route.status, out);
        return;
      }

      const header = req.headers['authorization'];
      const m = typeof header === 'string' ? /^Bearer ([A-Za-z0-9_-]{20,128})$/.exec(header) : null;
      const auth = m ? authenticate(db, m[1]!) : null;
      if (!auth) throw new ApiError(401, 'UNAUTHENTICATED', 'Cần phiên hợp lệ.');

      const found = pick(routes, method, url.pathname);
      if (found === null && pub === null) throw notFound();
      if (found === null || found === 'method') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Phương thức không được hỗ trợ.');
      const body = readsBody ? await readJson(req) : {};
      const out = found.route.handler({ auth, params: found.params, body });
      send(res, out === undefined ? 204 : found.route.status, out);
    } catch (e) {
      if (e instanceof ApiError) {
        send(res, e.status, { error: { code: e.code, message: e.message, field: e.field, details: e.details } });
      } else {
        console.error('Lỗi không mong đợi:', e);
        send(res, 500, { error: { code: 'INTERNAL', message: 'Đã xảy ra lỗi.' } });
      }
    }
  }
}
