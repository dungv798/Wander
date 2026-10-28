import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Thử nghiệm độc lập: chỉ đọc catalog, chỉ ghi cạnh script; không cần khóa API.
const ownDir = path.dirname(fileURLToPath(import.meta.url));
const catalogDir = path.resolve(ownDir, '../../backend/src/main/resources/catalog');
const outDir = path.join(ownDir, '.logs');
const dryRun = process.argv.includes('--dry-run');
const month = process.argv.find(arg => /^--month=\d{6}$/.test(arg))?.split('=')[1] ?? '202609';
const start = `${month}0100`;
const end = `${month}${String(new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(4)), 0)).getUTCDate()).padStart(2, '0')}00`;
if (Number(month.slice(4)) < 1 || Number(month.slice(4)) > 12) throw new Error('Tháng không hợp lệ');
const rows = [];
for (const file of (await readdir(catalogDir)).filter(file => file.endsWith('.json')).sort()) {
  const catalog = JSON.parse(await readFile(path.join(catalogDir, file), 'utf8'));
  for (const place of catalog.places ?? []) {
    rows.push({ destinationId: catalog.id, placeId: place.id, title: place.wikipediaTitle ?? null });
  }
}
const titles = [...new Set(rows.map(row => row.title).filter(Boolean))];
const results = new Map();
let consecutiveFailures = 0;
for (const title of dryRun ? [] : titles) {
  const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/vi.wikipedia.org/all-access/user/${encodeURIComponent(title.replaceAll(' ', '_'))}/monthly/${start}/${end}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': process.env.WANDER_RESEARCH_USER_AGENT ?? 'WanderCatalogResearch/0.1 (local noncommercial pageviews experiment)', Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      results.set(title, { status: `HTTP_${response.status}`, views: null, url });
      if ([403, 429].includes(response.status)) break;
      consecutiveFailures = response.status >= 500 ? consecutiveFailures + 1 : 0;
    } else {
      const body = await response.json();
      const items = body.items;
      const valid = Array.isArray(items) && items.length === 1 && Number.isFinite(items[0].views);
      results.set(title, { status: valid ? 'OK' : 'NO_DATA', views: valid ? items[0].views : null, url });
      consecutiveFailures = 0;
    }
  } catch (error) {
    results.set(title, { status: 'NETWORK_ERROR', views: null, errorCode: error.cause?.code ?? error.name, url });
    consecutiveFailures++;
  }
  if (consecutiveFailures >= 3) break;
  await new Promise(resolve => setTimeout(resolve, 200));
}
const observations = rows.map(row => ({ ...row, ...(row.title ? results.get(row.title) ?? { status: dryRun ? 'DRY_RUN' : 'NOT_RUN', views: null } : { status: 'MISSING_TITLE', views: null }) }));
const values = observations.filter(row => row.status === 'OK').map(row => row.views).sort((a, b) => a - b);
const quantile = fraction => values.length ? values[Math.floor((values.length - 1) * fraction)] : null;
const summary = {
  mode: dryRun ? 'DRY_RUN' : 'NETWORK', generatedAt: new Date().toISOString(), month,
  catalogFiles: (await readdir(catalogDir)).filter(file => file.endsWith('.json')).length,
  places: rows.length, withTitle: rows.filter(row => row.title).length, uniqueTitles: titles.length,
  attemptedTitles: results.size,
  statuses: Object.fromEntries([...new Set(observations.map(row => row.status))].map(status => [status, observations.filter(row => row.status === status).length])),
  distribution: { samplePlaces: values.length, min: values[0] ?? null, p25: quantile(.25), median: quantile(.5), p75: quantile(.75), max: values.at(-1) ?? null },
  caution: 'Không suy ra điểm chất lượng. Chưa xác minh redirect, bài chung, độ phủ hay danh tính địa điểm. null không phải 0.',
};
await mkdir(outDir, { recursive: true });
const suffix = dryRun ? 'dry-run' : 'network';
await writeFile(path.join(outDir, `pageviews-${suffix}.json`), JSON.stringify({ summary, observations }, null, 2) + '\n');
console.log(JSON.stringify(summary));
if (!dryRun && values.length === 0) process.exitCode = 2;
