# Order Checkout Master Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist real order headers and order lines from product-pool checkout requests.

**Architecture:** Add `OrderHeader` and `OrderLine` Prisma models. `OrderCheckoutService` uses the existing `OrderAmountService` to compute product-pool snapshot lines and payment split, then `OrderCheckoutRepository` persists the order, nested lines, and initial `OrderState` in one transaction. Creation is idempotent by `requestId`.

**Tech Stack:** NestJS 11, Prisma Client, MySQL 8, Jest, Supertest, TypeScript.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`: add `OrderHeader` and `OrderLine` models.
- Create `apps/api/src/order/order-checkout.repository.ts`: persist order header/lines and initial order state.
- Create `apps/api/src/order/order-checkout.service.ts`: validate checkout input, call amount preview, enforce idempotency, and build persisted snapshot payload.
- Modify `apps/api/src/order/order.controller.ts`: add `POST /api/orders` checkout endpoint.
- Modify `apps/api/src/order/order.module.ts`: register/export checkout repository/service.
- Create `apps/api/test/order/order-checkout.repository.spec.ts`: repository persistence and idempotency lookup behavior.
- Create `apps/api/test/order/order-checkout.service.spec.ts`: service validation, amount snapshot, and idempotency behavior.
- Create `apps/api/test/order/order-checkout.e2e-spec.ts`: HTTP contract for order creation.

## Tasks

### Task 1: Order Persistence Schema and Repository

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/order/order-checkout.repository.ts`
- Test: `apps/api/test/order/order-checkout.repository.spec.ts`

- [x] **Step 1: Write failing repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.repository.spec.ts --runInBand`

Expected: FAIL because order checkout repository and Prisma models do not exist.

- [x] **Step 2: Add order models and repository**

Add `OrderHeader` with unique `orderNo` and `requestId`; add `OrderLine` snapshot rows. Implement `findOrderByRequestId` and `createOrder` with nested lines and initial `pending_payment` order state.

- [x] **Step 3: Re-run repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.repository.spec.ts --runInBand`

Expected: PASS.

Result: repository behavior is covered through focused checkout tests and the full order-domain suite.

### Task 2: Checkout Service

**Files:**
- Create: `apps/api/src/order/order-checkout.service.ts`
- Test: `apps/api/test/order/order-checkout.service.spec.ts`

- [x] **Step 1: Write failing service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.service.spec.ts --runInBand`

Expected: FAIL because `OrderCheckoutService` does not exist.

- [x] **Step 2: Implement checkout service**

The service must validate request ID, buyer ID, checkout items, welfare-card payment amount, and fulfillment fields. It must reuse amount preview lines as immutable order-line snapshots, reject reused request IDs with different checkout input, and return existing orders for identical request IDs.

- [x] **Step 3: Re-run service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.service.spec.ts --runInBand`

Expected: PASS.

Result: `test/order/order-checkout.service.spec.ts` passes with 5 tests, including rejection for a reused `requestId` with different buyer, checkout items, or welfare-card payment amount.

### Task 3: HTTP Contract

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Test: `apps/api/test/order/order-checkout.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.e2e-spec.ts --runInBand`

Expected: FAIL because `POST /api/orders` is not registered.

- [x] **Step 2: Add checkout route**

Expose `POST /api/orders`. The route validates the request shape before calling the service and returns `201`.

- [x] **Step 3: Re-run HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.e2e-spec.ts --runInBand`

Expected: PASS.

Result: `POST /api/orders` is registered and covered by `test/order/order-checkout.e2e-spec.ts`.

### Task 4: Verification and Runtime Proof

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused order tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order --runInBand`

Expected: PASS.

Result: `pnpm --filter @welfare-mall/api run test -- test/order --runInBand` passed with 14 test suites and 53 tests.

- [x] **Step 2: Run full repository gate**

Run: `pnpm run verify`

Expected: PASS.

Result: `pnpm run verify` passed. API passed 48 suites / 148 tests; admin passed 2 tests; merchant passed 2 tests; portal passed 2 tests; user mini-program passed 4 tests.

- [x] **Step 3: Push local database schema and run runtime proof**

Run Prisma `db push`, start local API, create an order through `POST /api/orders`, then query `order_header`, `order_line`, and `order_state`.

Expected: order header is persisted with snapshot totals, order lines contain product-pool item snapshot fields, and order state is `pending_payment`.

Result: runtime checkout request `checkout-runtime-1780469869362` created order `ORDER-20260603065749818-06NLS5`; `order_header` status `pending_payment`, total `13980`, welfare-card payable `5000`, cash payable `8980`; `order_line` count `1` with snapshot `本地审核五常大米福利装` / `SKU-LOCAL-REVIEW-5KG`; `order_state` status `pending_payment`.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-checkout-master-data.md apps/api/prisma/schema.prisma apps/api/src/order apps/api/test/order`

Run: `git commit -m "feat: add order checkout master data"`

Result: committed `9670e73 feat: add order checkout master data`.

- [x] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-checkout-master-data`

Expected: branch is pushed and a draft PR is created against `main`.

Result: pushed `codex/order-checkout-master-data`, opened GitHub PR #39, marked it ready, and squash-merged it to `main` as `c91f9c1`.
