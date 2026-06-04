# Admin Order Fulfillment Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show task-backed fulfillment progress in Admin order management so local operators can see whether paid orders have pending or completed merchant fulfillment tasks.

**Architecture:** Extend the Admin order read model with a fulfillment task summary derived from `FulfillmentTask` rows. Keep buyer order list/detail APIs unchanged. Render the summary in Admin order cards alongside payment and refund facts.

**Tech Stack:** NestJS order read repository, Prisma read model, React Admin app, Jest/Vitest, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/api/src/order/order-read.repository.ts`
- Modify `apps/api/test/order/order-read.repository.spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing API and Admin tests**

Add tests proving:

- Admin order reads query fulfillment tasks for listed orders.
- Admin order records include total, pending, completed, and task number summary.
- Admin order cards render the fulfillment summary and task numbers.
- Buyer order reads remain scoped to buyer-facing facts.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run src/App.test.tsx
```

Expected: FAIL because Admin orders do not yet include or render fulfillment task summaries.

### Task 2: Implementation

- [x] **Step 1: Add Admin fulfillment summary read model**

Load `FulfillmentTask` rows for Admin-listed orders and attach `fulfillmentSummary` with totals and task numbers.

- [x] **Step 2: Render Admin fulfillment summary**

Extend the Admin order API type and order card rendering with compact fulfillment progress and task number display.

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
feat: add admin order fulfillment summary
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

## Acceptance Boundary

This slice improves local Admin visibility into task-backed order fulfillment. It does not add task assignment, logistics tracking, pickup code generation, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
