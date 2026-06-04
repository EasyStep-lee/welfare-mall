# Admin Fulfillment Merchant Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators filter order management by fulfillment merchant so they can quickly find orders involving one merchant without scanning every task chip.

**Architecture:** Add an optional `merchantId` query parameter to `GET /api/orders/admin`. The repository derives matching order numbers from `FulfillmentTask` rows and composes the filter with existing order status and fulfillment progress filters. The Admin app adds a compact merchant filter input that applies alongside existing order and fulfillment tabs while still showing all task details for matched orders.

**Tech Stack:** NestJS controller/service/repository, Prisma read model, React Admin app, Jest/Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/src/order/order-read.service.ts`
- Modify `apps/api/src/order/order-read.repository.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Modify `apps/api/test/order/order-read.repository.spec.ts`
- Modify `apps/api/test/order/order-read.service.spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`
- Modify `apps/admin/src/styles.css`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing API and Admin tests**

Add tests proving:

- Admin API passes `merchantId` into the service.
- Admin service trims optional `merchantId` and passes it into the repository.
- Admin repository filters orders by fulfillment task merchant.
- Admin UI requests orders with `merchantId` and composes it with existing status filters.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts test/order/order-read.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run src/App.test.tsx
```

Expected: FAIL because merchant fulfillment filtering is not wired yet.

### Task 2: Implementation

- [x] **Step 1: Add backend merchant fulfillment filter**

Validate and trim `merchantId` in the service, pass it through the controller, and filter Admin orders by matching `FulfillmentTask.merchantId`.

- [x] **Step 2: Add Admin merchant filter control**

Extend `fetchAdminOrders` and render a merchant ID filter input with apply/clear controls that composes with order and fulfillment status tabs.

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
feat: filter admin fulfillment orders by merchant
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

Result:

- Feature PR: #113 `feat: filter admin fulfillment orders by merchant`
- Feature branch commit: `813d22a`
- Main squash merge commit: `4adcd00`
- Remote CI: `docs-check` and `project-foundation-check` completed successfully.

## Acceptance Boundary

This slice improves local Admin order filtering only. It does not add merchant search/autocomplete, task assignment, batching, logistics tracking, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
