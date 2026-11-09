// Máy chủ tĩnh tối thiểu cho workflow thử trên iOS Simulator: phục vụ một thư mục (mặc định web/public) ở 127.0.0.1:<cổng>.
// Dùng: node tools/ios-sim/serve-public.mjs <thư-mục> <cổng>. Không phụ thuộc python hay gói ngoài.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png' };
const root = path.resolve(process.argv[2] ?? 'web/public');
const port = Number(process.argv[3] ?? 8080);

/** Phục vụ một tệp trong `root`; chặn đường dẫn đi ra ngoài thư mục gốc. */
function handle(request, response) {
  const urlPath = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const file = path.resolve(root, '.' + urlPath);
  if (!file.startsWith(root + path.sep) && file !== root) { response.writeHead(403).end('forbidden'); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404).end('not found'); return; }
    response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }).end(data);
  });
}

http.createServer(handle).listen(port, '127.0.0.1', () => console.log(`phục vụ ${root} ở http://127.0.0.1:${port}`));
