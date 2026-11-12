#!/usr/bin/env node
/**
 * Captures the screenshots used in README.md from a RUNNING app (real backend, real catalog, real Chrome).
 *
 * It creates a throw-away anonymous identity and one sample trip through the public API, then screenshots four screens on a
 * 390x844 phone viewport (device pixel ratio 2) and writes compressed WebP files.
 *
 * Usage (backend with the web build already running, on a scratch database):
 *   node web/scripts/readme-shots.mjs [--base http://127.0.0.1:8790] [--out docs/screenshots]
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const BASE = option('--base', 'http://127.0.0.1:8790');
const OUT = path.resolve(option('--out', 'docs/screenshots'));
const VIEWPORT = { width: 390, height: 844 };
const SETTLE_MS = 2500;
const WEBP_QUALITY = 80;
const TOKEN_KEY = 'wander.web.token.v1';
const ONBOARDING_KEY = 'wander.web.onboarding.v1';
const DESTINATION_KEY = 'wander.web.destination.v1';
const DESTINATION = 'da-lat';

/** Calls the API; throws with the response body on any non-2xx so a broken seed never produces a misleading screenshot. */
async function api(method, route, token, body) {
  const response = await fetch(`${BASE}${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route} -> ${response.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/** Creates the identity and a three-day Da Lat trip with a believable mix of places, meals and costs. */
async function seed() {
  const { token } = await api('POST', '/api/identity', null, { skipRecoveryCode: true, deviceName: 'Điện thoại' });
  const { destination } = await api('GET', `/api/catalog/destinations/${DESTINATION}`, null);
  const byCategory = category => destination.places.filter(p => p.category === category && p.photos.length > 0);
  const sights = [...byCategory('canh'), ...byCategory('van')];
  const foods = byCategory('am');
  const { trip } = await api('POST', '/api/trips', token, {
    name: 'Đà Lạt cuối tuần', destination: DESTINATION, startDate: '2026-12-05', endDate: '2026-12-07',
  });
  const plan = [
    ['2026-12-05', 'sightseeing', sights[0], '08:30', 120, 0],
    ['2026-12-05', 'food', foods[0], '12:00', 60, 90],
    ['2026-12-05', 'sightseeing', sights[1], '15:00', 90, 60],
    ['2026-12-06', 'sightseeing', sights[2], '09:00', 150, 80],
    ['2026-12-06', 'food', foods[1], '12:30', 60, 120],
    ['2026-12-06', 'sightseeing', sights[3], '15:30', 120, 0],
    ['2026-12-07', 'food', foods[2], '08:00', 45, 50],
  ];
  for (const [day, type, place, timeOfDay, durationMin, cost] of plan) {
    if (!place) continue;
    await api('POST', `/api/trips/${trip.id}/items`, token, { type, title: place.name, placeId: place.id, day, timeOfDay, durationMin, cost });
  }
  return { token, tripId: trip.id };
}

/** Screenshots one route and writes a WebP file; returns the file size. */
async function shoot(page, route, name) {
  await page.goto(`${BASE}/${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(SETTLE_MS);
  const png = await page.screenshot({ type: 'png' });
  const file = path.join(OUT, `${name}.webp`);
  await sharp(png).webp({ quality: WEBP_QUALITY, effort: 5 }).toFile(file);
  return fs.statSync(file).size;
}

const { token, tripId } = await seed();
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch({ channel: 'msedge', headless: true }));
try {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2, locale: 'vi-VN' });
  await context.addInitScript(([tokenKey, onboardingKey, destinationKey, secret, destination]) => {
    localStorage.setItem(tokenKey, JSON.stringify({ token: secret }));
    localStorage.setItem(onboardingKey, '{"done":true}');
    localStorage.setItem(destinationKey, destination);
  }, [TOKEN_KEY, ONBOARDING_KEY, DESTINATION_KEY, token, DESTINATION]);
  const page = await context.newPage();
  const sizes = {
    home: await shoot(page, '#/', 'home'),
    destination: await shoot(page, `#/dest/${DESTINATION}`, 'destination'),
    deck: await shoot(page, '#/deck', 'deck'),
    trip: await shoot(page, `#/trip/${tripId}`, 'trip'),
  };
  console.log(JSON.stringify({ out: OUT, bytes: sizes }));
} finally {
  await browser.close();
}
