# Docker Runtime Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put API, Admin, Merchant, and Portal into the current local Docker Compose runtime with health checks, port mappings, API base URL wiring, and smoke verification.

**Architecture:** Keep the existing `welfare-mall-v2` compose project and extend it from MySQL/Redis-only into a five-service local runtime. API runs the built NestJS app on port `3000`; Admin, Merchant, and Portal build their Vite apps with browser-facing API base URLs and serve built assets through `vite preview` on `5173`, `5174`, and `5175`.

**Tech Stack:** Docker Compose, Node 22, pnpm 10.12.1, NestJS, Vite, React Admin, React Merchant, Vue Portal.

---

## File Structure

- Create `.dockerignore`: keep Docker build context small and exclude local build/runtime artifacts.
- Create `apps/api/Dockerfile`: install API workspace dependencies, generate Prisma client, build NestJS, run `node apps/api/dist/src/main.js`.
- Create `apps/admin/Dockerfile`: build Admin with `VITE_ADMIN_API_BASE_URL`, serve through `vite preview` on `5173`.
- Create `apps/merchant/Dockerfile`: build Merchant with `VITE_MERCHANT_API_BASE_URL`, serve through `vite preview` on `5174`.
- Create `apps/portal/Dockerfile`: build Portal with `VITE_API_BASE_URL`, serve through `vite preview` on `5175`.
- Modify `docker-compose.yml`: add API/Admin/Merchant/Portal services, dependencies, ports, env, and health checks.
- Modify `package.json`: add `verify:docker-runtime`.
- Create `tools/verify-docker-runtime.cjs`: static config gate and optional live smoke gate.
- Create `tools/start-docker-runtime.ps1`: Windows-safe compose startup with `COMPOSE_BAKE=false` for this non-ASCII workspace path.

## Tasks

### Task 1: Docker Runtime Static Gate

- [x] **Step 1: Write failing runtime verification script**

Create `tools/verify-docker-runtime.cjs` and `verify:docker-runtime` so the script requires:

- API/Admin/Merchant/Portal Dockerfiles
- compose services for `api`, `admin`, `merchant`, and `portal`
- ports `3000`, `5173`, `5174`, and `5175`
- API CORS and frontend API base URL wiring

- [x] **Step 2: Run RED static gate**

Run:

```powershell
pnpm run verify:docker-runtime
```

Expected: FAIL because `apps/api/Dockerfile` and the compose runtime services do not exist yet.

### Task 2: Compose Runtime Implementation

- [x] **Step 1: Add Dockerfiles and compose services**

Add Dockerfiles for API/Admin/Merchant/Portal and extend `docker-compose.yml` with service builds, env, health checks, and port mappings.

- [x] **Step 2: Run GREEN static gate**

Run:

```powershell
pnpm run verify:docker-runtime
docker compose config
```

Expected: PASS.

### Task 3: Local Docker Runtime Smoke

- [x] **Step 1: Free local runtime ports**

If local Vite processes are listening on `5173`, `5174`, or `5175`, stop those Node processes before starting Docker services so compose can bind the intended ports.

- [x] **Step 2: Build and start runtime**

Run:

```powershell
docker compose up -d --build api admin merchant portal
```

Expected: containers start and become healthy.

If Docker Compose fails in this Windows workspace with `x-docker-expose-session-sharedkey`, run:

```powershell
pnpm run docker:runtime:up
```

Expected: the script sets `COMPOSE_BAKE=false` and starts the same compose services.

- [x] **Step 3: Run live smoke**

Run:

```powershell
pnpm run verify:docker-runtime -- --live
```

Expected: `/api/health`, Admin shell, Merchant shell, and Portal shell all return HTTP 200.

### Task 4: Repository Verification

- [x] **Step 1: Run full local gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 5: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add .dockerignore docker-compose.yml package.json tools/verify-docker-runtime.cjs apps/api/Dockerfile apps/admin/Dockerfile apps/merchant/Dockerfile apps/portal/Dockerfile docs/superpowers/plans/2026-06-03-docker-runtime-foundation.md
git commit -m "build: add docker runtime foundation"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-runtime-foundation
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice proves local Docker Compose runtime wiring for API, Admin, Merchant, and Portal on the developer machine. It does not prove staging or production deployment, HTTPS/domain configuration, Nginx/CDN hardening, WeChat DevTools, true-device behavior, real payment/refund provider execution, target-environment readiness, or formal business acceptance.
