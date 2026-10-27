// Máy chủ tĩnh cục bộ cho prototype thiết kế (không phải backend). Phục vụ:
//   /                      -> docs/ux/prototype/
//   /catalog/photos/<tệp>  -> backend/src/main/resources/catalog/photos/   (ảnh thật của kho biên tập)
//   /data/catalog/<id>.json-> backend/src/main/resources/catalog/<id>.json (dữ liệu thật của kho biên tập)
// Chạy: node docs/ux/tools/serve.mjs [cổng]   (mặc định 4177). Chỉ nghe 127.0.0.1.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(here, '../../..');
const PROTO = path.join(ROOT, 'docs/ux/prototype');
const CATALOG = path.join(ROOT, 'backend/src/main/resources/catalog');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function inside(base, rel) {
  const full = path.resolve(base, rel);
  return full === base || full.startsWith(base + path.sep) ? full : null;
}

function resolveUrl(urlPath) {
  const p = decodeURIComponent(urlPath.split('?')[0]);
  if (p.startsWith('/catalog/photos/')) return inside(path.join(CATALOG, 'photos'), p.slice('/catalog/photos/'.length));
  if (p.startsWith('/data/catalog/') && p.endsWith('.json')) return inside(CATALOG, p.slice('/data/catalog/'.length));
  if (p.startsWith('/fonts/')) return inside(path.join(ROOT, 'web/public/fonts'), p.slice('/fonts/'.length));
  return inside(PROTO, p === '/' ? 'index.html' : p.slice(1));
}

function handler(req, res) {
  if ((req.url ?? '').split('?')[0] === '/favicon.ico') {
    // Trình duyệt tự xin favicon; không để nó thành lỗi 404 làm nhiễu kiểm tra console.
    res.writeHead(204);
    res.end();
    return;
  }
  let file = null;
  try {
    file = resolveUrl(req.url ?? '/');
  } catch {
    /* URL hỏng */
  }
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Không tìm thấy');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}

/** Mở máy chủ ở cổng (0 = tự chọn). Trả về { server, url, close }. */
export function startServer(port = 0) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handler);
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${server.address().port}`;
      resolve({ server, url, close: () => new Promise((r) => server.close(() => r())) });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { url } = await startServer(Number(process.argv[2] ?? 4177));
  console.log(`Prototype: ${url}  (Ctrl+C để dừng)`);
}
