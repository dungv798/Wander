#!/bin/sh
# End-to-end run: builds the jar and the web app, starts the real backend against a dedicated database
# (wander_e2e, never the dev database) and runs the browser scenarios in web/e2e. POSIX sh; mirrors `tools/dev.ps1 e2e`.
# Requires: Docker running, JDK 21, Node, a Chrome/Edge install for Playwright.
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

E2E_DB=wander_e2e
PORT=${PORT:-8787}
JAR="$ROOT/backend/build/libs/wander-backend.jar"
LOGS="$ROOT/.logs"
mkdir -p "$LOGS"

docker info >/dev/null 2>&1 || { echo "Docker is not running: start Docker Desktop (or the docker daemon) and retry." >&2; exit 1; }

# Postgres is shared with local dev; CI provides the same service on 5433 through docker compose.
docker compose up -d --wait postgres
docker compose exec -T postgres psql -U wander -d postgres -v ON_ERROR_STOP=1 -q -c "DROP DATABASE IF EXISTS $E2E_DB WITH (FORCE)"
docker compose exec -T postgres psql -U wander -d postgres -v ON_ERROR_STOP=1 -q -c "CREATE DATABASE $E2E_DB"

(cd backend && sh ./gradlew bootJar --no-daemon --console=plain)
npm ci --no-audit --no-fund
npm --prefix web ci --no-audit --no-fund
npm --prefix web run build

# Recovery-code HMAC key: use the environment's, else keep a random local one in .logs (git-ignored). Never printed.
if [ -z "${WANDER_RECOVERY_PEPPER:-}" ]; then
  [ -f "$LOGS/dev-recovery-pepper.txt" ] || head -c 48 /dev/urandom | base64 | tr -d '\n' > "$LOGS/dev-recovery-pepper.txt"
  WANDER_RECOVERY_PEPPER=$(cat "$LOGS/dev-recovery-pepper.txt")
fi

export PORT WANDER_RECOVERY_PEPPER
export WANDER_WEB_DIR="$ROOT/web/dist"
export WANDER_LIMIT_IDENTITY=1000 WANDER_LIMIT_RECOVERY=1000 WANDER_LIMIT_APPROVAL=1000
export WANDER_LIMIT_APPROVAL_REQUESTS=1000 WANDER_LIMIT_CATALOG=100000
export WANDER_DB_URL="jdbc:postgresql://localhost:5433/$E2E_DB"
export WANDER_E2E_DB=$E2E_DB

java -jar "$JAR" >"$LOGS/e2e-backend.out.log" 2>"$LOGS/e2e-backend.err.log" &
BACKEND_PID=$!
trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM

i=0
until curl -fs -o /dev/null "http://127.0.0.1:$PORT/actuator/health"; do
  i=$((i + 1))
  if [ "$i" -gt 240 ]; then echo "Backend did not become healthy in 120 s; see .logs/e2e-backend.*.log" >&2; exit 1; fi
  kill -0 "$BACKEND_PID" 2>/dev/null || { echo "Backend exited early; see .logs/e2e-backend.*.log" >&2; exit 1; }
  sleep 0.5
done

export WANDER_BASE_URL="http://127.0.0.1:$PORT"
(cd web && npm run e2e)
