// Phục vụ giao diện đã build (web/dist) từ cùng một nguồn gốc với API. Chỉ GET/HEAD; chặn đi ra ngoài thư mục gốc.
import { readFileSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
};

/** Trả về true nếu đã xử lý yêu cầu. */
export function serveStatic(root: string, req: IncomingMessage, res: ServerResponse): boolean {
  const method = req.method ?? 'GET';
  if (method !== 'GET' && method !== 'HEAD') return false;
  const base = resolve(root);
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    return false;
  }
  if (pathname.includes('\0')) return false;

  let file = normalize(join(base, pathname));
  if (file !== base && !file.startsWith(base + sep)) return false;

  let isAsset = true;
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
  } catch {
    // Đường dẫn giao diện (băm trong URL nên thường không tới đây); trả về index.html.
    isAsset = false;
    file = join(base, 'index.html');
  }

  let data: Buffer;
  try {
    data = readFileSync(file);
  } catch {
    return false;
  }
  const headers: Record<string, string> = {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
    // Tệp có băm trong tên được cache lâu; index.html thì không.
    'Cache-Control': isAsset && file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
  };
  res.writeHead(200, headers);
  res.end(method === 'HEAD' ? undefined : data);
  return true;
}
