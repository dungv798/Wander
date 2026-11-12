# ADR-016 — Catalog photo delivery: optimized WebP in the jar now, object storage + CDN when configured

- **Status:** `APPROVED` — decided by the product owner in the portfolio-upgrade brief of 12/11/2026 ("optimized classpath now, R2 when configured; no DB table").
- **Summary (EN):** Catalog photos are re-encoded to content-hashed WebP variants (480 px and 1280 px, metadata stripped) and shipped on the classpath with a one-year `immutable` cache. If `WANDER_PHOTO_BASE_URL` is set, the same files are served from that origin (Cloudflare R2 behind a CDN) instead. Photos never go into the database.
- **Related:** ADR-010 (catalog module, photos served at `/catalog/photos/**`), ADR-009 (attribution is mandatory), ADR-012 (cache strategy), `docs/operations/photos.md`.

## Context

Measured on 2026-11-12 (`docs/baseline.md`): 602 JPGs = 261,159,915 bytes, 81 % of the 306 MiB `wander-backend.jar`; image 518 MiB; cold start 21.6 s unconstrained and 70.9 s at the Render-free shape (0.25 CPU, 512 MB). Photos were served with `max-age=1 day`, so every visitor re-validated large originals (up to 11.8 MB). The catalog is editorial data that ships with the application (ADR-010); photo metadata (author, license, source URL) lives in the catalog JSON and must stay next to each photo (ADR-009).

Constraints: Render free (512 MB RAM, 0.25 CPU, no persistent disk), Neon free Postgres (small storage quota), a single deployable image, and a licence obligation to show attribution wherever a photo is shown.

## Options

| Option | For | Against |
|---|---|---|
| **A. Keep originals in the jar** | Zero change | Largest jar/image and slowest deploys; browsers download originals; 1-day cache |
| **B. Photos as BLOBs in PostgreSQL** | One datastore, transactional | Neon free quota is small; every image request becomes a DB read on a 0.25 CPU instance; no CDN caching without extra layers; catalog is *not* user data and has no write path, so a table adds schema, migrations and backups for nothing |
| **C. Object storage + CDN (R2/S3)** | Smallest jar, long CDN caching, free egress on R2 | Needs an account, bucket, credentials and an upload step; one more moving part; local dev and tests still need a fallback |
| **D. Optimize and keep on the classpath, with C as an opt-in switch** | Works with no external account; big wins from format/size alone; same URLs and attribution; C can be switched on by configuration | The jar still carries the (smaller) photos until C is enabled |

## Decision

**D.** Two steps, both behind the same URLs contract:

1. **Optimize (`tools/catalog/optimize-photos.mjs`).** For every photo referenced by the catalog JSON, produce WebP at 480 px and 1280 px (never upscaled), re-encoded from pixels so EXIF/GPS is dropped, named `<slug>-w<width>-<sha256[:10]>.webp`. The JSON `file` points at the 1280 px variant, `thumbFile` at the 480 px one; `author`, `license`, `sourceUrl` are untouched. A manifest (`tools/catalog/data/photo-manifest.json`) records the SHA-256 and `sourceUrl` of every original. Originals leave the jar (they remain in git history under the tag `pre-portfolio-cleanup`).
2. **Serve.** `/catalog/photos/**` sends `Cache-Control: public, max-age=31536000, immutable`; this is safe because a name changes exactly when its bytes do (a data test asserts every shipped name is hashed and every file is referenced).
3. **Switch (`WANDER_PHOTO_BASE_URL`).** When set, the API emits `<base>/<file>` URLs and the CSP `img-src` gains exactly that origin; when empty (default for dev, tests and the current Render deployment) nothing changes. `tools/catalog/upload-photos.mjs` copies the files to an S3-compatible bucket, skipping keys that already exist.

The API contract keeps `PhotoView.url` (the 1280 px image) and adds `thumbUrl`, `srcSet` and a stable `id`. The `id` is the original file's base name, because trip covers persist `photo:<slug>`; hashing the file names must not orphan stored covers.

## Consequences

- No database table for photos, by design: the catalog is read-only classpath data loaded and validated at startup (including that every referenced file exists).
- Render free RAM is unaffected (static files are streamed from the jar, never held in the heap); Neon storage is untouched.
- Attribution stays in the catalog JSON and in `PhotoView`, so moving files to a CDN cannot separate a photo from its licence.
- Changing an image means re-running the optimizer: new bytes → new hash → new URL; CDN and browser caches never need purging.
- When the bucket is enabled, the jar can drop `catalog/photos/` in a later change (the loader would then validate against the base URL instead of the classpath). That is deliberately **not** done now, so the application keeps working with no external dependency.
- Remaining risk: a bucket that is public by design serves the photos to anyone; that matches the licences (CC / Unsplash) and the data is already public in the app.
