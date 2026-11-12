#!/bin/sh
# Prepares a history rewrite that removes heavy binaries from ALL commits. Never pushes anything.
#
#   tools/rewrite-history.sh <mirror-dir> <out-dir> [branch]
#
# <mirror-dir>  a `git clone --mirror` backup of origin (made first, kept as the rollback copy)
# <out-dir>     where the rewritten clone is created (must not exist)
# [branch]      branch to check out at the end (default: portfolio-upgrade)
#
# Removes: the original catalog photos (*.jpg|jpeg|png under backend/src/main/resources/catalog/photos; the optimized *.webp files
# stay) and every binary file (images, video, audio, pdf, archives, fonts) that ever lived under the paths removed from the tree:
# docs/research, docs/UI-sample, .taste-skill, legacy/web-v1, tools/tvc, tools/video, tools/look, docs/autopilot.
# Needs Docker (git-filter-repo runs in a python:alpine container; no Python on the host required).
set -eu

MIRROR=${1:?usage: tools/rewrite-history.sh <mirror-dir> <out-dir> [branch]}
OUT=${2:?usage: tools/rewrite-history.sh <mirror-dir> <out-dir> [branch]}
BRANCH=${3:-portfolio-upgrade}
HERE=$(cd "$(dirname "$0")" && pwd)

[ -e "$OUT" ] && { echo "Refusing to overwrite existing $OUT" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "Docker is not running." >&2; exit 1; }

git clone --no-hardlinks "$MIRROR" "$OUT"
git -C "$OUT" checkout "$BRANCH"
echo "size before: $(du -sb "$OUT/.git" | cut -f1) bytes"

# MSYS_NO_PATHCONV keeps Git Bash from rewriting the container paths.
MSYS_NO_PATHCONV=1 docker run --rm -v "$OUT:/repo" -v "$HERE/rewrite-history.container.sh:/rewrite.sh:ro" python:3.12-alpine sh /rewrite.sh

echo "size after:  $(du -sb "$OUT/.git" | cut -f1) bytes"
echo "Tip tree (must equal the original branch tip's tree): $(git -C "$OUT" rev-parse "$BRANCH^{tree}")"
