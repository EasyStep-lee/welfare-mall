# Admin Fulfillment Progress Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators filter order management by fulfillment progress so pending merchant work can be found without scanning every order card.

**Architecture:** Add an optional `fulfillmentStatus=pending|completed` query parameter to `GET /api/orders/admin`. The repository derives matching order numbers from `FulfillmentTask` rows, keeps existing order status filtering composable, and still attaches the Admin fulfillment summary to returned orders. The Admin app adds compact fulfillment progress tabs next to the existing order status tabs.

**Tech Stack:** NestJS controller/service/repository, Prisma read model, React Admin app, Jest/Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/src/order/order-read.service.ts`
- Modify `apps/api/src/order/order-read.repository.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Modify `apps/api/test/order/order-read.repository.spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing API and Admin tests**

Add tests proving:

- Admin API passes `fulfillmentStatus` query params into the service.
- Admin repository filters pending fulfillment orders by fulfillment task summaries.
- Admin UI requests filtered orders when the pending fulfillment tab is clicked.
- Existing order status filtering remains composable with fulfillment filtering.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts test/order/order-read.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run src/App.test.tsx
```

Expected: FAIL because fulfillment progress filters are not wired yet.

### Task 2: Implementation

- [x] **Step 1: Add backend fulfillment progress filter**

Validate `fulfillmentStatus` in the service and apply pending/completed task summary filtering in Admin order repository reads.

- [x] **Step 2: Add Admin fulfillment filter tabs**

Extend `fetchAdminOrders` and render fulfillment progress tabs that compose with the existing order status tabs.

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

- [x] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: add admin fulfillment progress filters
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

Result:

- Feature PR: https://github.com/EasyStep-lee/welfare-mall/pull/109
- Feature branch commit: `5af84da feat: add admin fulfillment progress filters`
- Main squash merge commit: `8cc7c0c feat: add admin fulfillment progress filters`

## Acceptance Boundary

This slice improves local Admin order filtering only. It does not add task assignment, logistics tracking, SLA alerts, batch operations, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
