# Docker Page Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a container-backed page smoke gate for Admin, Merchant, and Portal so local Docker runtime checks prove each frontend serves the expected business surface, not only an HTML shell.

**Architecture:** Keep the existing Docker runtime startup and live endpoint smoke unchanged. Add a separate Node-based page smoke script that fetches each Docker-served page, follows the built Vite JavaScript asset, and verifies stable business text and the compiled `http://localhost:3000/api` base URL in the runtime asset.

**Tech Stack:** Node.js HTTP client, Docker Compose runtime, Vite preview output, React Admin, React Merchant, Vue Portal.

---

## File Structure

- Modify `package.json`: add `docker:page-smoke`.
- Create `tools/verify-docker-page-smoke.cjs`: fetch Docker-served frontend pages and built assets.
- Create `docs/superpowers/plans/2026-06-04-docker-page-smoke.md`: track this slice.

## Tasks

### Task 1: Page Smoke Gate

- [x] **Step 1: Write failing page smoke command**

Add `docker:page-smoke` to `package.json` pointing at `tools/verify-docker-page-smoke.cjs`.

- [x] **Step 2: Run RED page smoke command**

Run:

```powershell
pnpm run docker:page-smoke
```

Expected: FAIL because `tools/verify-docker-page-smoke.cjs` does not exist yet.

- [x] **Step 3: Implement page smoke script**

Create `tools/verify-docker-page-smoke.cjs` so it verifies:

- Admin page on `http://localhost:5173/` exposes a built JavaScript asset containing `商品审核`, `订单管理`, and `http://localhost:3000/api`.
- Merchant page on `http://localhost:5174/` exposes a built JavaScript asset containing `商品提审`, `履约订单`, and `http://localhost:3000/api`.
- Portal page on `http://localhost:5175/` exposes a built JavaScript asset containing `企业福利商品目录`, `可选商品`, and `http://localhost:3000/api`.

- [x] **Step 4: Run GREEN page smoke command**

Run:

```powershell
pnpm run docker:page-smoke
```

Expected: PASS against the running Docker runtime.

### Task 2: Verification

- [x] **Step 1: Confirm Docker runtime and run full gates**

Run:

```powershell
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 3: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools/verify-docker-page-smoke.cjs docs/superpowers/plans/2026-06-04-docker-page-smoke.md
git commit -m "test: add docker page smoke gate"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-page-smoke
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice proves local Docker-served frontend page assets include expected business surfaces and API base URL wiring. It does not prove interactive browser clicks, visual screenshots, authenticated workflows, WeChat DevTools, true-device behavior, target-environment deployment, or formal business acceptance.
