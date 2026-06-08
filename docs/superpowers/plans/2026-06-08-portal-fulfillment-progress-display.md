# Portal Fulfillment Progress Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers see fulfillment progress after an order is paid and merchant fulfillment tasks exist.

**Architecture:** Extend the buyer order read model with the same fulfillment summary/task data already used by Admin, then render a buyer-facing fulfillment block in Portal order list/detail. Keep the scope read-only for Portal; merchant completion remains in Merchant Vue and the existing API.

**Tech Stack:** NestJS, Prisma, Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing API Buyer Fulfillment Read Test

**Files:**
- Modify: `apps/api/test/order/order-read.repository.spec.ts`

- [x] **Step 1: Assert buyer order reads include fulfillment summary and tasks**

Add a test that calls `findOrderForBuyer({ buyerUserId, orderNo })` and expects:
- `fulfillmentSummary.totalTasks === 2`
- `fulfillmentSummary.pendingTasks === 1`
- `fulfillmentSummary.completedTasks === 1`
- `fulfillmentTasks` includes both task numbers and statuses

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- order-read.repository
```

Expected: FAIL because buyer order reads currently do not attach fulfillment summary/tasks.

Evidence:
- RED: `pnpm --filter @welfare-mall/api run test -- order-read.repository` failed because buyer reads did not query `fulfillmentTask.findMany` or return `fulfillmentSummary/fulfillmentTasks`.
- GREEN: `pnpm --filter @welfare-mall/api run test -- order-read.repository` passed with 10/10 tests.

### Task 2: Implement Buyer Fulfillment Read Model

**Files:**
- Modify: `apps/api/src/order/order-read.repository.ts`

- [x] **Step 1: Add a buyer order read type with fulfillment fields**

Add a type that extends the existing checkout order record with:
- `fulfillmentSummary`
- `fulfillmentTasks`
- optional `pickupCode`

- [x] **Step 2: Attach fulfillment summary/tasks for buyer reads**

Update `listOrdersByBuyer` and `findOrderForBuyer` to include fulfillment summary/tasks. Preserve buyer-visible pickup-code behavior for pickup orders.

### Task 3: Write Failing Portal Fulfillment UI Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert paid order detail renders fulfillment progress**

Add a fixture for a paid order with one pending fulfillment task and assert the detail page shows:
- `履约进度`
- `待履约 1`
- the task number

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal does not yet type or render fulfillment progress.

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed because the paid order detail did not contain `履约进度`.
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 11/11 tests.

### Task 4: Implement Portal Fulfillment Progress UI

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Extend Portal order types**

Add `fulfillmentSummary` and `fulfillmentTasks` to `PortalOrderRecord`.

- [x] **Step 2: Render fulfillment summary in the order list and detail**

Show task count and pending/completed counts in the order row. In the detail panel, show a `履约进度` block with each task number and status label.

### Task 5: Verification

- [x] **Step 1: Run focused tests and typechecks**

```powershell
pnpm --filter @welfare-mall/api run test -- order-read.repository
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/api run test -- order-read.repository` passed.
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed.
- `git diff --check` passed with Windows line-ending warnings only.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/orders/:orderNo?buyerUserId=local-user-001` returns fulfillment summary/tasks for a paid local Portal order.
- Served `http://localhost:5175/assets/...` bundle contains the buyer-facing fulfillment labels.
- Browser on `http://localhost:5175` opens a paid order with pending fulfillment and shows `履约进度`, `待履约`, and its task number.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt API plus Portal.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- API `GET /api/orders/ORDER-20260608015739946-NSESAZ?buyerUserId=local-user-001` returned `fulfillmentSummary.totalTasks = 1` and task `FT-ORDER-20260608015739946-NSESAZ-MERCHANT-LOCAL-REVIEW-1780884197873`.
- Served bundle asset `/assets/index-DEPxu-1N.js` contains `履约进度`, `待履约`, `fulfillmentSummary`, and `fulfillmentTasks`.
- Browser on `http://localhost:5175` opened order `ORDER-20260608015739946-NSESAZ` and showed `履约进度`, `待履约 1`, and task `FT-ORDER-20260608015739946-NSESAZ-MERCHANT-LOCAL-REVIEW-1780884197873`.

### Task 6: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show portal fulfillment progress
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal source/runtime behavior for reading and displaying fulfillment progress after payment. It does not add merchant assignment, shipment labels, logistics tracking, buyer notifications, target-environment deployment, true-device checks, or formal business acceptance.
