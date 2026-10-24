import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { openDb } from '../src/api/db.ts';
import { createApp } from '../src/api/app.ts';
import type { AppOptions } from '../src/api/app.ts';

export interface Res {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

export async function startApp(options: AppOptions = {}) {
  const db = openDb(':memory:');
  const server = createApp(db, options);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  async function call(method: string, path: string, token?: string, body?: unknown, raw?: string): Promise<Res> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined || raw !== undefined) headers['Content-Type'] = 'application/json';
    const res = await fetch(base + path, {
      method,
      headers,
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : undefined };
  }

  async function newUser() {
    const r = await call('POST', '/api/identity');
    assert.equal(r.status, 201);
    return { token: r.body.token as string, identityId: r.body.identityId as string, recoveryCode: r.body.recoveryCode as string | null };
  }

  async function newTrip(token: string, extra: Record<string, unknown> = {}) {
    const r = await call('POST', '/api/trips', token, {
      name: 'Hà Giang – Tà Xùa',
      destination: 'Hà Giang',
      startDate: '2026-08-29',
      endDate: '2026-09-06',
      ...extra,
    });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return r.body.trip.id as string;
  }

  async function newItem(token: string, tripId: string, fields: Record<string, unknown>) {
    const r = await call('POST', `/api/trips/${tripId}/items`, token, { day: '2026-08-30', type: 'sightseeing', title: 'Mục', ...fields });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    return r.body.item as { id: string; position: number };
  }

  const close = () => new Promise<void>((resolve) => server.close(() => resolve()));
  return { db, call, newUser, newTrip, newItem, close };
}

export async function withApp(fn: (a: Awaited<ReturnType<typeof startApp>>) => Promise<void>, options: AppOptions = {}) {
  const a = await startApp(options);
  try {
    await fn(a);
  } finally {
    await a.close();
  }
}

