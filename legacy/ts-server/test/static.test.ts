import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { openDb } from '../src/api/db.ts';
import { createApp } from '../src/api/app.ts';
import { createLimiter } from '../src/api/limiter.ts';

function get(port: number, path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http
      .get({ host: '127.0.0.1', port, path }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
      })
      .on('error', reject);
  });
}

test('phục vụ giao diện: index.html, tệp có băm cache lâu, header bảo mật, SPA fallback', async () => {
  const root = mkdtempSync(join(tmpdir(), 'wander-web-'));
  mkdirSync(join(root, 'dist', 'assets'), { recursive: true });
  writeFileSync(join(root, 'secret.txt'), 'BÍ MẬT NGOÀI THƯ MỤC GỐC');
  writeFileSync(join(root, 'dist', 'index.html'), '<!doctype html><title>Wander</title>');
  writeFileSync(join(root, 'dist', 'assets', 'app-abc123.js'), 'console.log(1)');

  const server = createApp(openDb(':memory:'), { staticDir: join(root, 'dist') });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    const index = await get(port, '/');
    assert.equal(index.status, 200);
    assert.match(index.body, /Wander/);
    assert.equal(index.headers['cache-control'], 'no-cache');
    assert.match(String(index.headers['content-security-policy']), /default-src 'self'/);
    assert.match(String(index.headers['content-security-policy']), /frame-ancestors 'none'/);
    assert.equal(index.headers['x-content-type-options'], 'nosniff');
    assert.equal(index.headers['x-frame-options'], 'DENY');

    const asset = await get(port, '/assets/app-abc123.js');
    assert.equal(asset.status, 200);
    assert.match(String(asset.headers['content-type']), /javascript/);
    assert.match(String(asset.headers['cache-control']), /immutable/);

    assert.equal((await get(port, '/khong/co/trang/nay')).body, index.body); // SPA fallback
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('phục vụ giao diện: không đọc được tệp ngoài thư mục gốc (path traversal)', async () => {
  const root = mkdtempSync(join(tmpdir(), 'wander-web-'));
  mkdirSync(join(root, 'dist'), { recursive: true });
  writeFileSync(join(root, 'secret.txt'), 'BÍ MẬT NGOÀI THƯ MỤC GỐC');
  writeFileSync(join(root, 'dist', 'index.html'), '<!doctype html><title>Wander</title>');

  const server = createApp(openDb(':memory:'), { staticDir: join(root, 'dist') });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    for (const p of ['/..%2fsecret.txt', '/%2e%2e/secret.txt', '/..%5csecret.txt', '/assets/..%2f..%2fsecret.txt', '/%00']) {
      const r = await get(port, p);
      assert.ok(!r.body.includes('BÍ MẬT'), `không được lộ nội dung với đường dẫn ${p}`);
    }
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('API không bị che bởi phục vụ tĩnh; đường /api lạ cần phiên', async () => {
  const root = mkdtempSync(join(tmpdir(), 'wander-web-'));
  writeFileSync(join(root, 'index.html'), '<!doctype html>');
  const server = createApp(openDb(':memory:'), { staticDir: root });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  try {
    assert.equal((await get(port, '/api/trips')).status, 401);
    assert.equal((await get(port, '/api/khong-co')).status, 401);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('bộ giới hạn tần suất: chặn khi vượt, đặt lại sau cửa sổ, không phình bộ nhớ vô hạn', async () => {
  const l = createLimiter(2, 50);
  assert.equal(l.hit('a'), true);
  assert.equal(l.hit('a'), true);
  assert.equal(l.hit('a'), false);
  assert.equal(l.hit('b'), true); // khóa khác không bị ảnh hưởng
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(l.hit('a'), true);
  // nhiều khóa khác nhau: bộ đếm phải tự dọn
  const big = createLimiter(1, 10);
  for (let i = 0; i < 20_000; i++) big.hit(`ip-${i}`);
  await new Promise((r) => setTimeout(r, 30));
  for (let i = 0; i < 100; i++) big.hit(`new-${i}`);
  assert.ok(big.size() < 20_000, `bộ đếm phải được dọn, hiện còn ${big.size()}`);
});
