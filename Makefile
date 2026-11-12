# Cross-platform entry points (Linux, macOS, Windows with Git Bash/WSL + make). Mirrors tools/dev.ps1, which stays for PowerShell users.
# Docker must be running: backend integration tests use Testcontainers and e2e uses docker compose Postgres.
SHELL := /bin/sh
GRADLE := cd backend && sh ./gradlew --console=plain

.DEFAULT_GOAL := help
.PHONY: help doctor docker-check db-up test check backend-build web-build web-check gen-api run e2e perf verify

help: ## List the targets
	@grep -E '^[a-z0-9-]+:.*## ' $(MAKEFILE_LIST) | sed -E 's/:.*## /	/'

docker-check:
	@docker info >/dev/null 2>&1 || { echo "Docker is not running: start Docker Desktop (or the docker daemon) and retry." >&2; exit 1; }

doctor: docker-check ## Check the toolchain (Docker, Java, Node)
	@java -version 2>&1 | head -1
	@node --version
	@npm --version
	@docker --version

db-up: docker-check ## Start the local PostgreSQL (docker compose)
	docker compose up -d --wait postgres

test: docker-check ## Backend unit + integration tests (Testcontainers)
	$(GRADLE) test

check: docker-check ## Backend quality gate: tests + ArchUnit + Checkstyle + JaCoCo thresholds
	$(GRADLE) check

backend-build: ## Build backend/build/libs/wander-backend.jar
	$(GRADLE) bootJar

web-build: ## Install dependencies and build web/dist
	npm ci --no-audit --no-fund
	npm --prefix web ci --no-audit --no-fund
	npm --prefix web run build

web-check: ## Web typecheck, lint, unit tests
	npm --prefix web run typecheck
	npm --prefix web run lint
	npm --prefix web test

gen-api: docker-check ## Regenerate backend/openapi.yaml from the application, then the web TypeScript types
	cd backend && sh ./gradlew test --console=plain --tests com.wander.shared.OpenApiContractIT -Pwander.openapi.update=true
	npm run gen:api

run: db-up web-build ## Run backend (port 8787) serving web/dist; needs WANDER_RECOVERY_PEPPER (>= 32 bytes) in the environment
	@test -n "$$WANDER_RECOVERY_PEPPER" || { echo "Set WANDER_RECOVERY_PEPPER to a random string of at least 32 bytes." >&2; exit 1; }
	WANDER_WEB_DIR=$(CURDIR)/web/dist $(GRADLE) bootRun

perf: docker-check ## k6 load test (20 virtual users) against a running backend with raised rate limits; see docs/performance.md
	docker run --rm -i grafana/k6:latest run -e BASE_URL=$${BASE_URL:-http://host.docker.internal:8787} -e VUS=$${VUS:-20} - < tools/perf/k6-trip-flow.js

e2e: docker-check ## Browser end-to-end scenarios against the real backend (database wander_e2e)
	sh tools/e2e.sh

verify: check web-check e2e ## Everything: backend gate, web checks, end-to-end
