#!/bin/sh
# Runs INSIDE the python:alpine container started by tools/rewrite-history.sh, with the clone mounted at /repo.
set -eu
apk add -q --no-cache git >/dev/null
pip install -q git-filter-repo >/dev/null 2>&1
git config --global --add safe.directory /repo
cd /repo

ARGS=""
# 1) original catalog photos (the optimized .webp files are kept)
for ext in jpg jpeg png; do ARGS="$ARGS --path-glob backend/src/main/resources/catalog/photos/*.$ext"; done
# 2) binaries under every path removed from the tree
for dir in docs/research docs/UI-sample .taste-skill legacy/web-v1 tools/tvc tools/video tools/look docs/autopilot; do
  for ext in jpg jpeg png webp gif avif mp4 webm mov mp3 wav pdf zip ico woff woff2 ttf otf; do ARGS="$ARGS --path-glob $dir/*.$ext"; done
done

# shellcheck disable=SC2086 -- word splitting of the generated glob list is intended
git filter-repo --force --invert-paths $ARGS
git reflog expire --expire=now --all
git gc --prune=now -q
