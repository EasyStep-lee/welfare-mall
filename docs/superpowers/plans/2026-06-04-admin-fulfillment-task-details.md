# Admin Fulfillment Task Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators inspect each fulfillment task behind an order, including task number, merchant, progress status, and relevant timestamps.

**Architecture:** Extend the Admin-only order read model with `fulfillmentTasks` derived from `FulfillmentTask` rows. Keep buyer order reads unchanged. Render compact task detail chips in Admin order cards while preserving the existing fulfillment summary and filters.

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

- Admin order reads select fulfillment task merchant and timestamps.
- Admin order records include ordered `fulfillmentTasks` details.
- Admin order cards render task number, merchant, task status, created time, and completed time.
- Buyer order reads still do not query fulfillment tasks.

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test --run src/App.test.tsx
```

Expected: FAIL because Admin orders do not yet include or render task details.

### Task 2: Implementation

- [x] **Step 1: Add Admin fulfillment task details read model**

Load `FulfillmentTask` rows for Admin-listed orders with `merchantId`, `createdAt`, and `completedAt`, then attach task details alongside the existing summary.

- [x] **Step 2: Render Admin fulfillment task details**

Extend the Admin order API type and order card rendering with business-facing task detail chips.

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
feat: show admin fulfillment task details
```

Expected: PR targets `main` and includes focused/full/Docker verification evidence.

Result:

- Feature PR: https://github.com/EasyStep-lee/welfare-mall/pull/111
- Feature branch commit: `ac65c00 feat: show admin fulfillment task details`
- Main squash merge commit: `0070d38 feat: show admin fulfillment task details`

## Acceptance Boundary

This slice improves local Admin visibility into existing fulfillment tasks only. It does not add task assignment, batching, logistics tracking, pickup code generation, inventory reservation, settlement, target-environment deployment, true-device checks, or formal acceptance.
