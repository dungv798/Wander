# Catalog photos — pipeline and optional object storage

Decision and trade-offs: [ADR-016](../architecture/adr/ADR-016-photo-delivery.md). This page is the runbook.

## 1. How photos are built (no accounts needed)

```bash
npm ci                                              # installs sharp (dev dependency of the repo root)
node tools/catalog/optimize-photos.mjs --src <dir with the ORIGINAL images>
```

- Reads every `file` in `backend/src/main/resources/catalog/**.json`, writes `-w480-` and `-w1280-` WebP files (never upscaled, metadata stripped, named by content hash) to `backend/src/main/resources/catalog/photos/`, and rewrites the JSON (`file` = large, `thumbFile` = small).
- Re-running with unchanged originals writes nothing (results are cached in `tools/catalog/data/photo-manifest.json`, keyed by the SHA-256 of each original).
- `--check` exits 1 when the JSON or manifest are out of date; `--dry-run` writes nothing.
- Originals are not stored in the repo. Each catalog entry keeps its `sourceUrl`/author/license, and the manifest records the SHA-256 of every original, so a download can be verified. Everything before the cleanup is also in git history: `git show pre-portfolio-cleanup:backend/src/main/resources/catalog/photos/<name>.jpg`.

## 2. Serving photos from object storage (Cloudflare R2) — steps for the maintainer

Nothing here has been done for you; it needs your Cloudflare account. The application works without it.

1. **Create the bucket.** Cloudflare dashboard → R2 → *Create bucket* → name e.g. `wander-photos` (location: automatic).
2. **Make it publicly readable through a domain you control.** Bucket → *Settings* → *Custom Domains* → add e.g. `photos.<your-domain>` (the domain must be on Cloudflare DNS). Prefer this over the `r2.dev` URL: `r2.dev` is rate-limited and meant for testing, and a custom domain gets Cloudflare's CDN caching.
3. **CORS (precaution).** Bucket → *Settings* → *CORS Policy*: allow `GET`/`HEAD` from your app origin (for example `https://wander-fx65.onrender.com`). Plain `<img>` tags do not need it, but map thumbnails load images with `crossOrigin="anonymous"`.
4. **Create an API token for uploads.** R2 → *Manage R2 API Tokens* → *Create API token* → permission **Object Read & Write**, scoped to this bucket only. Note the *Access Key ID*, *Secret Access Key* and the account's S3 endpoint `https://<account-id>.r2.cloudflarestorage.com`. Keep them out of the repo.
5. **Upload.** In a shell (values are read from the environment only):

   ```bash
   export S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   export S3_BUCKET=wander-photos
   export S3_ACCESS_KEY_ID=...        # from step 4
   export S3_SECRET_ACCESS_KEY=...    # from step 4
   node tools/catalog/upload-photos.mjs --dry-run    # shows how many files would upload
   node tools/catalog/upload-photos.mjs              # uploads only the missing keys; safe to re-run
   ```

   Objects get `Content-Type: image/webp` and `Cache-Control: public, max-age=31536000, immutable`. Keys are the bare file names (flat bucket).
6. **Check one URL** in a browser: `https://photos.<your-domain>/<any file name from backend/src/main/resources/catalog/photos>`. Expect HTTP 200, `content-type: image/webp`, the `cache-control` above, and (after a second request) `cf-cache-status: HIT`.
7. **Point the app at it.** In Render → the `wander` service → *Environment* → add `WANDER_PHOTO_BASE_URL=https://photos.<your-domain>` (https origin, no query string; a path prefix is allowed but then the objects must be uploaded under that prefix). Then trigger a **manual deploy** (auto-deploy is off). On boot the app validates the value and refuses to start if it is not a plain https URL.
8. **Verify.** Open the site; photo requests in the browser's Network tab go to `photos.<your-domain>`; the response CSP contains `img-src 'self' data: blob: https://images.unsplash.com https://photos.<your-domain>`.
9. **Roll back.** Remove `WANDER_PHOTO_BASE_URL` and redeploy: URLs return to `/catalog/photos/...` (the files are still on the classpath).

Re-running the upload after a catalog change is enough; existing keys are never overwritten (names are content-hashed).

## 3. Configuration reference

| Setting | Env var | Default | Effect |
|---|---|---|---|
| `wander.catalog.photo-base-url` | `WANDER_PHOTO_BASE_URL` | empty | Origin that serves local catalog photos; empty = this application at `/catalog/photos/`. Also added to CSP `img-src`. |

## 4. Troubleshooting

- *App refuses to start and the error names `wander.catalog.photo-base-url`* — the value is not a plain https origin (it has `http://`, credentials, a query/fragment, or spaces).
- *Photos 404 after enabling the base URL* — the upload did not complete or the custom domain points at another bucket; run `upload-photos.mjs --dry-run` and expect `toUpload: 0`.
- *Blocked by CSP in the browser console* — the deployed image is older than this change, or the env var has a different origin than the one in the photo URLs.
