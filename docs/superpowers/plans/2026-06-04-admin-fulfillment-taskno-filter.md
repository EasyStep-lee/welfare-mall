# Admin Fulfillment Task Number Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators locate an order by a known fulfillment task number so payment, refund, and merchant fulfillment debugging can jump straight to the affected order.

**Architecture:** Add an optional `taskNo` query parameter to `GET /api/orders/admin`. The repository derives matching order numbers from `FulfillmentTask.taskNo` and composes the filter with existing order status, fulfillment progress, and fulfillment merchant filters. The Admin app adds a compact fulfillment task number input next to the existing merchant filter while keeping task details visible on matched order cards.

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

- Admin API passes `taskNo` into the service.
- Admin service trims optional `taskNo` and passes it into the repository.
- Admin repository filters orders by fulfillment task number.
- Admin UI requests orders with `taskNo` and composes it with existing fulfillment progress and merchant filters.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts test/order/order-read.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run src/App.test.tsx
```

Expected: FAIL because fulfillment task number filtering is not wired yet.

### Task 2: Implementation

- [x] **Step 1: Add backend task number filter**

Validate and trim `taskNo` in the service, pass it through the controller, and filter Admin orders by matching `FulfillmentTask.taskNo`.

- [x] **Step 2: Add Admin task number filter control**

Extend `fetchAdminOrders` and render a task number filter input with apply/clear controls that composes with order, fulfillment, and merchant filters.

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
feat: filter admin fulfillment orders by task number
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

Result:

- Feature PR: #115 `feat: filter admin fulfillment orders by task number`
- Feature branch commit: `e73fd1d`
- Main squash merge commit: `b6f7162`
- Remote CI: `docs-check` and `project-foundation-check` completed successfully.

## Acceptance Boundary

This slice improves local Admin order lookup only. It does not add fuzzy task search, merchant autocomplete, task assignment, batching, logistics tracking, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
