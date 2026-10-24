import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createApp } from './app.ts';
import { openDb } from './db.ts';

const dbPath = process.env['WANDER_DB'] ?? 'data/wander.db';
const port = Number(process.env['PORT'] ?? 8787);
const staticDir = process.env['WANDER_WEB_DIR'] ?? 'web/dist';

if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
const db = openDb(dbPath);
const server = createApp(db, existsSync(staticDir) ? { staticDir } : {});
server.listen(port, '127.0.0.1', () => {
  console.log(`Wander API: http://127.0.0.1:${port} (db: ${dbPath})`);
});
