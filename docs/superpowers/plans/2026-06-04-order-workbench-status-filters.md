# Order Workbench Status Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local-runtime order status filters to Admin order management and Merchant fulfillment queues so developers can inspect pending payment, paid, refund, refunded, and completed orders quickly while running on localhost.

**Architecture:** Add optional `status` query parameters to the Admin order list and Merchant fulfillment list endpoints, thread the filter through services and repositories, then expose small status tabs in Admin and Merchant frontends. The Merchant fulfillment default remains `paid` so the existing "待履约" view is unchanged.

**Tech Stack:** NestJS controller/service/repository, Prisma query filters, React frontend state, Vitest/Jest e2e tests, Docker local smoke.

---

## File Structure

- Modify `apps/api/src/order/order.controller.ts`
- Modify `apps/api/src/order/order-read.service.ts`
- Modify `apps/api/src/order/order-read.repository.ts`
- Modify `apps/api/src/order/order-fulfillment.service.ts`
- Modify `apps/api/src/order/order-fulfillment.repository.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Modify `apps/api/test/order/order-fulfillment.e2e-spec.ts`
- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`
- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add failing API and frontend tests**

Add tests for:

- `GET /api/orders/admin?status=refund_processing`
- `GET /api/orders/merchant/fulfillment?merchantId=merchant-001&status=completed`
- Admin status tab requesting filtered orders
- Merchant status tab requesting filtered fulfillment orders

- [x] **Step 2: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts test/order/order-fulfillment.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/admin run test -- src/App.test.tsx --run
pnpm --filter @welfare-mall/merchant run test -- src/App.test.tsx --run
```

Expected: FAIL for missing status propagation and UI controls.

### Task 2: Implementation

- [x] **Step 1: Add backend status filtering**

Accept and validate known order statuses in Admin and Merchant list query params. Default Merchant fulfillment to `paid`.

- [x] **Step 2: Add frontend status filters**

Add compact status tabs above Admin order cards and Merchant fulfillment cards. Keep existing default views unchanged.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run the same focused test commands from RED. Expected: PASS.

- [x] **Step 2: Run local verification gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, PR, merge**

Commit message:

```text
feat: add order workbench status filters
```

Expected: PR targets `main` and includes focused/local verification evidence.

Result: PR #101 merged into `main` as `296bce1 feat: add order workbench status filters`.

## Acceptance Boundary

This slice improves local Admin and Merchant order workbench filtering only. It does not add formal auth, real payment provider behavior, target deployment, true-device checks, or production domain configuration.
