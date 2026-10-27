#!/usr/bin/env node
// Wander project status snapshot (read-only, no dependencies, always exits 0).
// Used by the /wander-status skill (dynamic context) and by humans:
//   node tools/wander-status.mjs            git + verification + tests + decisions + gates
//   node tools/wander-status.mjs --tests    also list failing test cases
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const showFailures = process.argv.includes('--tests');
const out = [];
const p = (...s) => out.push(s.join(''));
const rel = (...s) => path.join(ROOT, ...s);
const read = (f) => { try { return fs.readFileSync(f, 'utf8').replace(/^﻿/, ''); } catch { return null; } };
const fmt = (d) => {
  const z = (n) => String(n).padStart(2, '0');
  return `${z(d.getDate())}/${z(d.getMonth() + 1)} ${z(d.getHours())}:${z(d.getMinutes())}`;
};
const git = (...args) => {
  const r = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', timeout: 5000 });
  return r.status === 0 ? r.stdout.replace(/\s+$/, '') : null; // keep leading spaces (porcelain status)
};

function section(title, fn) {
  p(`\n## ${title}`);
  try { fn(); } catch (e) { p(`- (không đọc được: ${e.message})`); }
}

p('# Wander — trạng thái hiện tại');

// Newest modification time of the code a test run depends on (file mtimes, so a commit alone does not make results stale).
const CODE = ['backend/src', 'backend/build.gradle.kts', 'backend/settings.gradle.kts', 'web/src', 'e2e', 'docker-compose.yml', 'package.json'];
function newestMtime(p0) {
  let best = 0;
  const walk = (p1) => {
    let st; try { st = fs.statSync(p1); } catch { return; }
    if (st.isDirectory()) { for (const e of fs.readdirSync(p1)) if (e !== 'node_modules' && e !== 'build') walk(path.join(p1, e)); }
    else best = Math.max(best, st.mtimeMs);
  };
  walk(p0);
  return best;
}
const codeMtime = Math.max(0, ...CODE.map((c) => newestMtime(rel(c))));
section('Git', () => {
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  if (!branch) { p('- Không đọc được git (chưa có repo hoặc thiếu git).'); return; }
  const last = git('log', '-1', '--format=%h %ad %s', '--date=format:%d/%m %H:%M');
  const dirty = (git('status', '--porcelain') || '').split('\n').filter(Boolean);
  const remote = git('remote');
  p(`- Nhánh \`${branch}\` · commit cuối: ${last || '—'}`);
  p(`- Thay đổi chưa commit: ${dirty.length}${dirty.length ? ' (' + dirty.slice(0, 5).map((l) => l.slice(3)).join(', ') + (dirty.length > 5 ? ', …' : '') + ')' : ''}`);
  p(`- Remote: ${remote ? remote.split('\n').join(', ') : 'chưa có (chưa push lên GitHub)'}`);
});

section('Lần chạy kiểm tra gần nhất (`.logs/*.status`)', () => {
  const dir = rel('.logs');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.status')) : [];
  if (!files.length) { p('- Chưa có log nào. Chạy `tools/dev.ps1 verify` (hoặc `/wander-verify`).'); return; }
  // `verify` runs doctor + tools-check + backend-test + e2e; an older single-step status is superseded by it.
  const COVERED_BY_VERIFY = ['doctor', 'tools-check', 'backend-test', 'backend-build', 'web-build', 'e2e'];
  const rows = files.map((f) => ({ name: f.replace(/\.status$/, ''), mtime: fs.statSync(path.join(dir, f)).mtime, v: (read(path.join(dir, f)) || '').trim() || '?' }))
    .sort((a, b) => b.mtime - a.mtime);
  const verify = rows.find((r) => r.name === 'verify');
  for (const r of rows) {
    const notes = [];
    if (verify && r !== verify && COVERED_BY_VERIFY.includes(r.name) && r.mtime < verify.mtime) notes.push(`đã được \`verify\` lúc ${fmt(verify.mtime)} chạy lại`);
    if (codeMtime && r.mtime.getTime() < codeMtime) notes.push(`code đã sửa sau lần chạy này (${fmt(new Date(codeMtime))})`);
    p(`- ${r.name}: **${r.v}** (${fmt(r.mtime)})${notes.length ? ' · *' + notes.join('; ') + '*' : ''}`);
  }
});

section('Test backend (JUnit XML)', () => {
  const dir = rel('backend', 'build', 'test-results', 'test');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^TEST-.*\.xml$/.test(f)) : [];
  if (!files.length) { p('- Chưa có kết quả (`backend/build/test-results/test` trống). Kết quả: `UNVERIFIED`.'); return; }
  let tests = 0, failures = 0, errors = 0, skipped = 0, newest = 0;
  const failed = [];
  for (const f of files) {
    const full = path.join(dir, f);
    newest = Math.max(newest, fs.statSync(full).mtimeMs);
    const xml = read(full) || '';
    const suite = xml.match(/<testsuite\b[^>]*>/);
    if (!suite) continue;
    const attr = (n) => Number((suite[0].match(new RegExp(`\\b${n}="(\\d+)"`)) || [])[1] || 0);
    tests += attr('tests'); failures += attr('failures'); errors += attr('errors'); skipped += attr('skipped');
    if (showFailures) {
      for (const m of xml.matchAll(/<testcase\b[^>]*name="([^"]*)"[^>]*classname="([^"]*)"[^>]*>([\s\S]*?)<\/testcase>/g)) {
        const fail = m[3].match(/<(failure|error)\b[^>]*message="([^"]*)"/);
        if (fail) failed.push(`${m[2].split('.').pop()} › ${m[1]}: ${fail[2].split('&#10;')[0].slice(0, 160)}`);
      }
    }
  }
  const pass = tests - failures - errors - skipped;
  p(`- ${pass}/${tests} PASS · lỗi ${failures + errors} · bỏ qua ${skipped} · ${files.length} lớp test · lúc ${fmt(new Date(newest))}${codeMtime > newest ? ` · *code đã sửa sau đó (${fmt(new Date(codeMtime))}) — chạy lại để chắc*` : ''}`);
  if (showFailures) failed.length ? failed.slice(0, 20).forEach((l) => p(`  - ✗ ${l}`)) : p('  - Không có test nào lỗi.');
});

section('Quyết định kỹ thuật đang mở (`docs/architecture/open-decisions.md`)', () => {
  const md = read(rel('docs', 'architecture', 'open-decisions.md'));
  if (!md) { p('- Không có file.'); return; }
  const rows = md.split('\n').filter((l) => /^\|\s*AD-\d+\s*\|/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
  const open = rows.filter((c) => /`OPEN`/.test(c[c.length - 2] || ''));
  p(`- ${open.length}/${rows.length} còn OPEN: ${open.map((c) => c[1]).join(', ') || '—'}`);
  for (const c of open) p(`  - ${c[1]} — ${c[2].slice(0, 110)}${c[2].length > 110 ? '…' : ''} · cần quyết: ${c[4] || '—'}`);
});

section('Cổng phát hành (`docs/implementation/decisions.md`)', () => {
  const md = read(rel('docs', 'implementation', 'decisions.md'));
  if (!md) { p('- Không có file.'); return; }
  const gates = md.split('\n').filter((l) => /^\|\s*RG-\d+\s*\|/.test(l)).map((l) => l.split('|').map((c) => c.trim()));
  const open = gates.filter((c) => !/Đóng|Closed/i.test(c[c.length - 2] || ''));
  p(`- ${open.length}/${gates.length} chưa đóng: ${open.map((c) => `${c[1]} (${c[c.length - 2]})`).join(', ') || '—'}`);
});

process.stdout.write(out.join('\n') + '\n');
process.exit(0);
