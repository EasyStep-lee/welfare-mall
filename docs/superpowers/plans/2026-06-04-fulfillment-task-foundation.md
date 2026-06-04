# Fulfillment Task Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist merchant fulfillment tasks after successful payment so local Merchant fulfillment no longer depends only on `OrderHeader.status = paid`.

**Architecture:** Add `FulfillmentTask` and `FulfillmentTaskLine` Prisma models. When a payment callback first moves an order to `paid`, create one pending task per merchant represented in the order lines, with task-line snapshots copied from order lines. Merchant fulfillment reads task records by merchant/status. Completing fulfillment marks the merchant task completed; when all tasks for the order are completed, update `OrderHeader` and `OrderState` to `completed`.

**Tech Stack:** NestJS order module, Prisma schema, Jest repository/service/e2e tests, React Merchant existing queue, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/order/order-payment.repository.ts`
- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-payment.repository.spec.ts`
- Modify `apps/api/test/order/order-fulfillment.repository.spec.ts`
- Verify `docker-compose.yml` keeps API startup schema sync before Node starts.
- Modify or add focused tests only as required by failing behavior.

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing backend tests**

Add tests proving:

- a first paid payment callback creates pending fulfillment tasks grouped by merchant.
- duplicate payment callbacks do not create tasks again.
- merchant fulfillment queue reads task records for the merchant/status instead of deriving solely from paid order headers.
- merchant completion updates the merchant task and completes the order only after all order tasks are completed.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts test/order/order-fulfillment.repository.spec.ts --runInBand
```

Expected: FAIL for missing fulfillment task persistence and task-backed read/complete behavior.

### Task 2: Implementation

- [x] **Step 1: Add fulfillment task schema**

Add task and task-line tables with order number, merchant ID, status, fulfillment snapshot fields, task-line snapshots, and useful indexes/uniques.

- [x] **Step 2: Create tasks on paid callback**

On the first paid callback only, load order lines and product merchant ownership, group lines by merchant, and create missing pending tasks idempotently.

- [x] **Step 3: Read and complete tasks**

Update merchant fulfillment read and complete methods to use `FulfillmentTask`. Keep the existing API shape stable for Admin/Merchant clients.

- [x] **Step 4: Confirm Docker runtime schema sync**

Confirm local Docker API startup still runs `prisma db push --skip-generate` before API starts so new local tables exist.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts test/order/order-fulfillment.repository.spec.ts test/order/order-fulfillment.e2e-spec.ts --runInBand
```

- [x] **Step 2: Run full local gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: add fulfillment task foundation
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

## Acceptance Boundary

This slice proves local API and Docker runtime fulfillment task persistence. It does not add inventory reservation, stock ledger, shipment tracking, pickup code generation, logistics mini-program handoff, target-environment deployment, true-device checks, settlement, or formal business acceptance.
