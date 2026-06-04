# Docker Image Build Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Docker image build preflight gate so API, Admin, Merchant, and Portal images can be built from the current repository before target deployment work continues.

**Architecture:** Add a root script that calls a PowerShell verifier. The verifier keeps `COMPOSE_BAKE=false` for this Windows non-ASCII workspace path, validates the expected compose services, then runs `docker compose build` for API/Admin/Merchant/Portal without starting containers.

**Tech Stack:** pnpm root scripts, PowerShell, Docker Compose, existing service Dockerfiles.

---

## File Structure

- Modify `package.json`: add `docker:image-build:preflight`.
- Create `tools/verify-docker-image-build.ps1`: build preflight for API/Admin/Merchant/Portal images.
- Create `docs/superpowers/plans/2026-06-04-docker-image-build-preflight.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing Docker image build preflight command**

Add `docker:image-build:preflight` to `package.json` pointing at `tools/verify-docker-image-build.ps1`.

- [x] **Step 2: Run RED Docker image build preflight**

Run:

```powershell
pnpm run docker:image-build:preflight
```

Expected: FAIL because `tools/verify-docker-image-build.ps1` does not exist yet.

### Task 2: Build Preflight

- [x] **Step 1: Implement Docker image build preflight script**

Create `tools/verify-docker-image-build.ps1` so it:

- sets `COMPOSE_BAKE=false`
- verifies Docker Compose exposes `api`, `admin`, `merchant`, and `portal`
- builds each service image with `docker compose build`
- does not start or stop runtime containers

- [x] **Step 2: Run GREEN Docker image build preflight**

Run:

```powershell
pnpm run docker:image-build:preflight
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused deployment gates**

Run:

```powershell
pnpm run docker:image-build:preflight
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
pnpm run target:runtime:env-check
pnpm run target:deployment:handoff
```

Expected: PASS.

- [x] **Step 2: Run full verification and diff hygiene**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools/verify-docker-image-build.ps1 docs/superpowers/plans/2026-06-04-docker-image-build-preflight.md
git commit -m "build: add docker image build preflight"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-image-build-preflight
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice proves local Docker images for API/Admin/Merchant/Portal can be built from the current repository. It does not deploy to a target server, push images to a registry, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
