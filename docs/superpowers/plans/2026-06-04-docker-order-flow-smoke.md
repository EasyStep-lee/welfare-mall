# Docker Order Flow Smoke Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a live Docker API smoke gate that proves the containerized API can run the core local order flow against the Docker MySQL data, not only serve health and frontend shells.

**Architecture:** Keep business API code unchanged. Add a Node-based live smoke script that calls the running Docker API on `http://localhost:3000/api`, reads the local product-pool catalog, creates a unique order from the local review product pool item, creates a payment, processes a paid callback, verifies buyer/Admin/merchant reads, completes merchant fulfillment, and verifies the buyer detail moves to `completed`.

**Tech Stack:** Node.js HTTP client, Docker Compose runtime, NestJS order APIs, MySQL-backed local seed data.

---

## File Structure

- Modify `package.json`: add `docker:order-flow-smoke`.
- Create `tools/verify-docker-order-flow-smoke.cjs`: run the live container-backed order flow.
- Create `docs/superpowers/plans/2026-06-04-docker-order-flow-smoke.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing command**

Add `docker:order-flow-smoke` to `package.json` pointing at `tools/verify-docker-order-flow-smoke.cjs`.

- [x] **Step 2: Run RED smoke command**

Run:

```powershell
pnpm run docker:order-flow-smoke
```

Expected: FAIL because `tools/verify-docker-order-flow-smoke.cjs` does not exist yet.

### Task 2: Live Order Flow Smoke

- [x] **Step 1: Implement live smoke script**

Create `tools/verify-docker-order-flow-smoke.cjs` so it:

- reads `GET /api/product-pools/catalog`
- requires a product-pool item for `product-local-review`
- creates a unique delivery order through `POST /api/orders`
- creates a matching payment through `POST /api/orders/payments`
- confirms payment through `POST /api/orders/payments/callbacks`
- verifies buyer detail and Admin order list expose the paid order
- verifies merchant fulfillment queue exposes the paid order for `merchant-local-review`
- completes fulfillment through `POST /api/orders/merchant/fulfillment/:orderNo/complete`
- verifies buyer detail exposes `completed`

- [x] **Step 2: Run GREEN smoke command**

Run:

```powershell
pnpm run docker:order-flow-smoke
```

Expected: PASS against the running Docker runtime with local review product pool data.

### Task 3: Verification

- [x] **Step 1: Run focused Docker smoke gates**

Run:

```powershell
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
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
git add package.json tools/verify-docker-order-flow-smoke.cjs docs/superpowers/plans/2026-06-04-docker-order-flow-smoke.md
git commit -m "test: add docker order flow smoke"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-order-flow-smoke
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice proves local Docker API order creation, payment callback, order reads, and merchant fulfillment completion against the current Docker MySQL runtime. It does not prove real payment providers, actual funds movement, browser clicks, visual screenshots, WeChat DevTools, true-device behavior, target-environment deployment, settlement, logistics handoff, or formal business acceptance.
