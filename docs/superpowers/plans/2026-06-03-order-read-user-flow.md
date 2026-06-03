# Order Read User Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users read their created orders through backend list/detail APIs and native mini-program order pages.

**Architecture:** Add a read-only order query path alongside the checkout write path. `OrderReadRepository` reads `OrderHeader` snapshots by buyer and order number, `OrderReadService` validates user-scoped input and maps missing orders to 404, and `OrderController` exposes `GET /api/orders?buyerUserId=...` plus `GET /api/orders/:orderNo?buyerUserId=...`. The mini program adds order list/detail pages that use the same fixed local buyer used by checkout until login is introduced.

**Tech Stack:** NestJS 11, Prisma Client, Jest, Supertest, native WeChat mini program files, Vitest.

---

## File Structure

- Create `apps/api/src/order/order-read.repository.ts`: read order summaries and detail snapshots from `OrderHeader`.
- Create `apps/api/src/order/order-read.service.ts`: validate buyer/order input and enforce buyer-scoped detail access.
- Modify `apps/api/src/order/order.controller.ts`: expose order list/detail GET endpoints.
- Modify `apps/api/src/order/order.module.ts`: register and export the read repository/service.
- Create `apps/api/test/order/order-read.repository.spec.ts`: prove repository query shape and ordering.
- Create `apps/api/test/order/order-read.service.spec.ts`: prove validation and not-found behavior.
- Create `apps/api/test/order/order-read.e2e-spec.ts`: prove HTTP list/detail contract.
- Modify `apps/user-miniprogram/app.json`: add order list and detail pages.
- Modify `apps/user-miniprogram/utils/api.js`: add order list/detail URL helpers.
- Modify `apps/user-miniprogram/utils/api.test.mjs`: cover order list/detail URL helpers.
- Create `apps/user-miniprogram/utils/order.js`: format order summary/detail display fields.
- Create `apps/user-miniprogram/utils/order.test.mjs`: cover order display helpers.
- Create `apps/user-miniprogram/pages/orders/index.{js,json,wxml,wxss}`: list current user's orders.
- Create `apps/user-miniprogram/pages/order-detail/index.{js,json,wxml,wxss}`: show one order snapshot.
- Create `apps/user-miniprogram/pages/orders/index.test.mjs`: prove list page request and navigation behavior.
- Create `apps/user-miniprogram/pages/order-detail/index.test.mjs`: prove detail page request and display state.

## Tasks

### Task 1: API Order Read Repository and Service

**Files:**
- Create: `apps/api/src/order/order-read.repository.ts`
- Create: `apps/api/src/order/order-read.service.ts`
- Test: `apps/api/test/order/order-read.repository.spec.ts`
- Test: `apps/api/test/order/order-read.service.spec.ts`

- [x] **Step 1: Write failing repository and service tests**

Repository tests must assert:

- `listOrdersByBuyer('user-001')` calls `orderHeader.findMany` with `where: { buyerUserId: 'user-001' }`, `orderBy: { createdAt: 'desc' }`, and a select including lines.
- `findOrderForBuyer({ buyerUserId: 'user-001', orderNo: 'ORDER-20260603-001' })` calls `orderHeader.findFirst` with both buyer and order number.

Service tests must assert:

- blank `buyerUserId` is rejected with `BadRequestException`.
- missing order detail is rejected with `NotFoundException`.
- list returns `{ orders }` and detail returns `{ order }`.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts test/order/order-read.service.spec.ts --runInBand
```

Expected: FAIL because order read repository/service do not exist.

- [x] **Step 2: Implement repository and service**

Implement:

- `OrderReadRepository.listOrdersByBuyer(buyerUserId)`
- `OrderReadRepository.findOrderForBuyer(input)`
- `OrderReadService.listOrders(input)`
- `OrderReadService.getOrderDetail(input)`

Reuse the same selected snapshot fields as checkout records.

- [x] **Step 3: Re-run repository and service tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts test/order/order-read.service.spec.ts --runInBand
```

Expected: PASS.

### Task 2: API HTTP Order Read Contract

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Test: `apps/api/test/order/order-read.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP tests**

Add e2e tests proving:

- `GET /api/orders?buyerUserId=user-001` returns `{ orders: [...] }`.
- `GET /api/orders/ORDER-20260603-001?buyerUserId=user-001` returns `{ order: ... }`.
- blank `buyerUserId` returns 400.

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts --runInBand
```

Expected: FAIL because the GET endpoints do not exist.

- [x] **Step 2: Register read service and routes**

Add `OrderReadRepository` and `OrderReadService` to `OrderModule`. Inject `OrderReadService` into `OrderController`. Add:

- `@Get()` list route.
- `@Get(':orderNo')` detail route.

- [x] **Step 3: Re-run HTTP tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.e2e-spec.ts --runInBand
```

Expected: PASS.

### Task 3: Mini Program Order Helpers

**Files:**
- Modify: `apps/user-miniprogram/utils/api.js`
- Modify: `apps/user-miniprogram/utils/api.test.mjs`
- Create: `apps/user-miniprogram/utils/order.js`
- Create: `apps/user-miniprogram/utils/order.test.mjs`

- [x] **Step 1: Write failing helper tests**

Cover:

- `orderListUrl('local-user-001')` returns `http://localhost:3000/api/orders?buyerUserId=local-user-001`.
- `orderDetailUrl('ORDER 001', 'local-user-001')` encodes both order and buyer.
- `toOrderSummaryDisplay(order)` returns price text and first line name.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/order.test.mjs --run
```

Expected: FAIL because helper exports do not exist.

- [x] **Step 2: Implement helper functions**

Add URL helpers to `utils/api.js`. Add display helpers to `utils/order.js`.

- [x] **Step 3: Re-run helper tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/order.test.mjs --run
```

Expected: PASS.

### Task 4: Mini Program Order Pages

**Files:**
- Modify: `apps/user-miniprogram/app.json`
- Create: `apps/user-miniprogram/pages/orders/index.{js,json,wxml,wxss}`
- Create: `apps/user-miniprogram/pages/order-detail/index.{js,json,wxml,wxss}`
- Create: `apps/user-miniprogram/pages/orders/index.test.mjs`
- Create: `apps/user-miniprogram/pages/order-detail/index.test.mjs`

- [x] **Step 1: Write failing page tests**

List page test must assert it requests `/orders?buyerUserId=local-user-001`, formats returned orders, and navigates to order detail.

Detail page test must assert it requests `/orders/ORDER-20260603-001?buyerUserId=local-user-001`, stores the order, formats amount text, and renders line snapshots.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/orders/index.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: FAIL because pages do not exist.

- [x] **Step 2: Implement order list and detail pages**

Use `LOCAL_BUYER_USER_ID = 'local-user-001'`. Add order list/detail page files and register pages in `app.json`.

- [x] **Step 3: Re-run page tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/orders/index.test.mjs pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 5: Verification

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused order tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order --runInBand
```

Expected: PASS.

- [x] **Step 2: Run focused mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- --run
```

Expected: PASS.

- [x] **Step 3: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 6: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-order-read-user-flow.md apps/api/src/order apps/api/test/order apps/user-miniprogram
git commit -m "feat: add user order read flow"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/order-read-user-flow
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local API and mini-program source-level order list/detail behavior with automated tests. It does not prove payment invocation, WeChat DevTools compilation, true-device behavior, merchant fulfillment, Admin order management, target-environment deployment, or formal business acceptance.
