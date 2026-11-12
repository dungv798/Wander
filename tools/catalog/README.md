# Catalog tooling

Offline scripts that build and curate the classpath catalog under `backend/src/main/resources/catalog`.
They are **not** part of the runtime or the CI build; the application only reads their output.

## Reproducible core

| Script | Purpose | Inputs |
|---|---|---|
| `build-catalog.mjs` | Builds the per-destination place catalog | `data/osm-candidates/<dest>.json` |
| `import-osm-places.mjs` | Imports reviewed OSM places | `data/osm-candidates/`, `osm-additions/` → writes `data/osm-additions/` |
| `build-poi.mjs` (+ `build-poi.test.mjs`) | Builds the Da Lat POI catalog | `data/da-lat-poi-trial/pois.json` |
| `poi-pipeline.mjs` | Fetches POI snapshots | writes `data/poi-snapshots/` |

`node --test tools/catalog/build-poi.test.mjs` runs the pipeline test.

## Historical curation scripts

Scripts whose names end in a date (`*-202611xx.mjs`) and the `curation-*`, `research-*`, `apply-*` families are the record
of one-off curation waves (photo sourcing, food venues, expansion). Their results are already applied to the catalog JSON.
They read working files that used to live in `docs/research/`; that folder was removed from the tree to keep the repository
focused. The last tree that still contained it is tagged `pre-portfolio-cleanup`:
`git show pre-portfolio-cleanup:docs/research/<file>` (or `git checkout pre-portfolio-cleanup`) to inspect or re-run a script.
