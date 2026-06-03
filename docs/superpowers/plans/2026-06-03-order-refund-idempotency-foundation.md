# Order Refund Idempotency Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted refund orders and idempotent refund callback handling for the order domain.

**Architecture:** Introduce `OrderRefund` and `OrderRefundCallback` Prisma models. Refund creation is idempotent by `requestId`; provider callbacks are idempotent by `providerEventId`, so repeated callbacks return the existing result and do not repeat refund status mutation.

**Tech Stack:** NestJS 11, Prisma Client, MySQL 8, Jest, Supertest, TypeScript.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`: add `OrderRefund` and `OrderRefundCallback` models.
- Create `apps/api/src/order/order-refund-status.ts`: refund status/channel/reason constants.
- Create `apps/api/src/order/order-refund.repository.ts`: refund creation and callback persistence in Prisma transactions.
- Create `apps/api/src/order/order-refund.service.ts`: request validation, idempotency conflict handling, and service API.
- Modify `apps/api/src/order/order.controller.ts`: add refund creation and callback endpoints.
- Modify `apps/api/src/order/order.module.ts`: register refund repository/service.
- Create `apps/api/test/order/order-refund.repository.spec.ts`: Prisma transaction and callback idempotency behavior.
- Create `apps/api/test/order/order-refund.service.spec.ts`: service behavior and conflict handling.
- Create `apps/api/test/order/order-refund.e2e-spec.ts`: HTTP contract.

## Tasks

### Task 1: Refund Persistence Schema and Repository

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/order/order-refund-status.ts`
- Create: `apps/api/src/order/order-refund.repository.ts`
- Test: `apps/api/test/order/order-refund.repository.spec.ts`

- [x] **Step 1: Write failing repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`

Expected: FAIL because refund repository and Prisma models do not exist.

- [x] **Step 2: Add Prisma models and repository**

Add `OrderRefund` with unique `refundNo` and `requestId`; add `OrderRefundCallback` with unique `providerEventId`. Implement create/find refund and callback transaction helpers.

- [x] **Step 3: Re-run repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`

Expected: PASS.

### Task 2: Refund Service

**Files:**
- Create: `apps/api/src/order/order-refund.service.ts`
- Test: `apps/api/test/order/order-refund.service.spec.ts`

- [x] **Step 1: Write failing service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts --runInBand`

Expected: FAIL because `OrderRefundService` does not exist.

- [x] **Step 2: Implement service**

The service must create new refund orders, return existing refund orders for identical `requestId`, reject same `requestId` with different `paymentNo`, `orderNo`, amount, channel, or reason, and process duplicate callbacks without repeated mutation.

- [x] **Step 3: Re-run service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts --runInBand`

Expected: PASS.

### Task 3: HTTP Contract

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Test: `apps/api/test/order/order-refund.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.e2e-spec.ts --runInBand`

Expected: FAIL because refund routes are not registered.

- [x] **Step 2: Add routes**

Expose `POST /api/orders/refunds` and `POST /api/orders/refunds/callbacks`.

- [x] **Step 3: Re-run HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.e2e-spec.ts --runInBand`

Expected: PASS.

### Task 4: Verification and Runtime Proof

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused order tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order --runInBand`

Expected: PASS.

- [x] **Step 2: Run full repository gate**

Run: `pnpm run verify`

Expected: PASS.

- [x] **Step 3: Push local database schema and run runtime proof**

Run Prisma `db push` against local MySQL, start API, create a refund order, submit the same successful refund callback twice with the same `providerEventId`, and confirm the second response is marked duplicate.

Expected: first callback marks refund `succeeded`; second callback returns duplicate result and does not create a second callback row.

Result: runtime request `refund-runtime-event-1780466542339` returned `duplicate=false` on the first callback and `duplicate=true` on replay; database callback count for the event was `1`.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-refund-idempotency-foundation.md apps/api/prisma/schema.prisma apps/api/src/order apps/api/test/order`

Run: `git commit -m "feat: add order refund idempotency foundation"`

- [x] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-refund-idempotency-foundation`

Expected: branch is pushed and a draft PR is created against `main`.

Result: PR #35 was opened, marked ready after verification, and squash-merged into `main` as `526e89e`.
