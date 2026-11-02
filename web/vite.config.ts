import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const CATALOG_DIR = path.resolve(import.meta.dirname, '../backend/src/main/resources/catalog');
const PHOTO_DIR = path.join(CATALOG_DIR, 'photos');
const MIME_BY_EXT: Record<string, string> = { '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

/**
 * Pha FE chưa có backend: phục vụ kho biên tập THẬT (JSON và ảnh) từ thư mục tài nguyên của backend, cùng đường dẫn mà bản thật sẽ dùng
 * (`/catalog/photos/*`). Chỉ chạy khi phát triển/preview, không vào bản dựng.
 */
function catalogDevServer(): Plugin {
  /** Gắn middleware phục vụ tệp từ kho biên tập. */
  const attach = (use: (fn: (req: { url?: string }, res: { statusCode: number; setHeader: (k: string, v: string) => void; end: (b?: Buffer | string) => void }, next: () => void) => void) => void): void => {
    use((req, res, next) => {
      let url: string;
      try {
        url = decodeURIComponent((req.url ?? '').split('?')[0] ?? '');
      } catch {
        res.statusCode = 400;
        res.end('Invalid URL');
        return;
      }
      if (!url.startsWith('/catalog/photos/')) { next(); return; }
      const file = path.resolve(PHOTO_DIR, url.slice('/catalog/photos/'.length));
      if (!file.startsWith(PHOTO_DIR + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()
        || !fs.realpathSync(file).startsWith(fs.realpathSync(PHOTO_DIR) + path.sep)
        || !['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())) {
        next();
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME_BY_EXT[path.extname(file).toLowerCase()] ?? 'application/octet-stream');
      res.end(fs.readFileSync(file));
    });
  };
  return {
    name: 'wander-catalog-dev',
    configureServer: (s) => attach((fn) => s.middlewares.use(fn)),
    configurePreviewServer: (s) => attach((fn) => s.middlewares.use(fn)),
  };
}

// Giao diện gọi API cùng nguồn qua /api; khi phát triển, Vite chuyển tiếp tới backend Java (cổng 8787, xem README.md mục 3).
export default defineConfig({
  plugins: [react(), catalogDevServer()],
  server: { port: 5173, proxy: { '/api': process.env['WANDER_BASE_URL'] ?? 'http://127.0.0.1:8787' } },
});
