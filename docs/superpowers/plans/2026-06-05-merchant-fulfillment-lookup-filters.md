# Merchant Fulfillment Lookup Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local merchants locate their own fulfillment work by order number or fulfillment task number so local order-flow debugging does not require scanning every pending/completed card.

**Architecture:** Add optional `orderNo` and `taskNo` query parameters to `GET /api/orders/merchant/fulfillment`. The service trims both filters and the repository applies exact `FulfillmentTask.orderNo` / `FulfillmentTask.taskNo` filters alongside the existing merchant and task status filters. The Merchant app adds compact lookup fields that compose with the pending/completed tabs and preserve filters after completion refreshes.

**Tech Stack:** NestJS controller/service/repository, Prisma read model, React Merchant app, Jest/Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/src/order/order-fulfillment.service.ts`
- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-fulfillment.e2e-spec.ts`
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`
- Modify `apps/api/test/order/order-fulfillment.service.spec.ts`
- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`
- Modify `apps/merchant/src/styles.css`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing API and Merchant tests**

Add tests proving:

- Merchant fulfillment API passes `orderNo` and `taskNo` into the service.
- Merchant service trims optional lookup filters and passes them into the repository.
- Merchant repository filters fulfillment tasks by merchant, status, order number, and task number.
- Merchant UI requests lookup filters and keeps them composed with status tabs.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-fulfillment.repository.spec.ts test/order/order-fulfillment.service.spec.ts test/order/order-fulfillment.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/merchant run test --run src/App.test.tsx
```

Expected: FAIL because Merchant lookup filters are not wired yet.

### Task 2: Implementation

- [x] **Step 1: Add backend lookup filters**

Pass trimmed `orderNo` and `taskNo` from controller to service to repository, and compose them into `FulfillmentTask.findMany.where`.

- [x] **Step 2: Add Merchant lookup controls**

Extend `fetchMerchantFulfillmentOrders` and render order number / task number lookup inputs with apply/clear controls.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run the same focused test commands from RED. Expected: PASS.

- [x] **Step 2: Run local verification gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: filter merchant fulfillment by order and task
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

## Acceptance Boundary

This slice improves local Merchant fulfillment lookup only. It does not add fuzzy search, cross-merchant visibility, task assignment, batching, shipment labels, pickup codes, logistics tracking, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
