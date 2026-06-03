# Merchant Fulfillment Order Read Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let merchants see paid orders that contain their products so the rewrite has the first merchant-side fulfillment queue.

**Architecture:** Add a read-only merchant fulfillment projection under the order domain. The API filters paid orders by `merchantId` through the products referenced by order-line snapshots, returns buyer/fulfillment/payment/order-line data needed for picking, and exposes it as `GET /api/orders/merchant/fulfillment?merchantId=...`. The merchant web app adds a compact order queue panel using this endpoint. This slice does not create fulfillment task records, reserve inventory, mark shipment, generate pickup codes, or perform logistics handoff.

**Tech Stack:** NestJS order module, Prisma, Jest, React merchant app, Vitest.

---

## File Structure

- Create `apps/api/src/order/order-fulfillment.repository.ts`: product ownership lookup and paid order query.
- Create `apps/api/src/order/order-fulfillment.service.ts`: validate merchant input and return queue.
- Modify `apps/api/src/order/order.controller.ts`: expose merchant fulfillment queue endpoint before `/:orderNo`.
- Modify `apps/api/src/order/order.module.ts`: register and export fulfillment read service/repository.
- Create `apps/api/test/order/order-fulfillment.repository.spec.ts`: repository query and merchant-line filtering.
- Create `apps/api/test/order/order-fulfillment.service.spec.ts`: service validation and delegation.
- Create `apps/api/test/order/order-fulfillment.e2e-spec.ts`: HTTP contract.
- Modify `apps/merchant/src/api.ts`: add fulfillment queue client/types.
- Modify `apps/merchant/src/App.tsx`: render paid order fulfillment queue.
- Modify `apps/merchant/src/App.test.tsx`: prove merchant queue loads and displays fulfillment fields.
- Modify `apps/merchant/src/styles.css`: queue layout styles.

## Tasks

### Task 1: API Merchant Fulfillment Queue

- [ ] **Step 1: Write failing API tests**

Add tests proving:

- repository loads product IDs for a merchant and lists paid orders containing those products.
- repository filters each returned order's lines to merchant-owned products.
- service rejects blank `merchantId`.
- HTTP `GET /api/orders/merchant/fulfillment?merchantId=merchant-001` returns `{ orders }`.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment --runInBand
```

Expected: FAIL because the fulfillment read service, repository, and route do not exist.

- [ ] **Step 2: Implement API read behavior**

Add repository/service and register them in `OrderModule`. Place the controller route before `GET /:orderNo` so it cannot be captured as an order number.

- [ ] **Step 3: Re-run API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment --runInBand
```

Expected: PASS.

### Task 2: Merchant Web Queue

- [ ] **Step 1: Write failing merchant UI test**

Extend the merchant app test to mock `/orders/merchant/fulfillment`, assert the request uses `merchantId=merchant-001`, and assert the queue displays order number, receiver, paid amount, payment status, and merchant-owned line.

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: FAIL because the client and UI do not render fulfillment orders.

- [ ] **Step 2: Implement merchant UI read panel**

Add API client/types and render a compact paid-order fulfillment panel above or beside the existing product workbench.

- [ ] **Step 3: Re-run merchant tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: PASS.

### Task 3: Verification

- [ ] **Step 1: Run focused order and merchant tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
pnpm --filter @welfare-mall/merchant run test -- --run
```

- [ ] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-merchant-fulfillment-order-read.md apps/api/src/order apps/api/test/order apps/merchant
git commit -m "feat: add merchant fulfillment order queue"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/merchant-fulfillment-order-read
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local API and merchant-web source-level visibility of paid orders for merchant fulfillment. It does not prove inventory reservation, fulfillment task persistence, shipment, pickup code generation, logistics mini-program handoff, Docker/browser runtime behavior, target-environment deployment, true-device behavior, or formal business acceptance.
