# Order Payment Idempotency Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persisted payment orders and idempotent payment callback handling for the order domain.

**Architecture:** Introduce `OrderPayment` and `OrderPaymentCallback` Prisma models. Payment creation is idempotent by `requestId`; provider callbacks are idempotent by `providerEventId`, so repeated callbacks return the existing result and do not repeat payment status mutation.

**Tech Stack:** NestJS 11, Prisma Client, MySQL 8, Jest, Supertest, TypeScript.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`: add `OrderPayment` and `OrderPaymentCallback` models.
- Create `apps/api/src/order/order-payment-status.ts`: payment status/channel constants.
- Create `apps/api/src/order/order-payment.repository.ts`: payment creation and callback persistence in Prisma transactions.
- Create `apps/api/src/order/order-payment.service.ts`: request validation, idempotency conflict handling, and service API.
- Modify `apps/api/src/order/order.controller.ts`: add payment creation and callback endpoints.
- Modify `apps/api/src/order/order.module.ts`: register payment repository/service.
- Create `apps/api/test/order/order-payment.service.spec.ts`: service behavior and conflict handling.
- Create `apps/api/test/order/order-payment.repository.spec.ts`: Prisma transaction and callback idempotency behavior.
- Create `apps/api/test/order/order-payment.e2e-spec.ts`: HTTP contract.

## Tasks

### Task 1: Payment Persistence Schema and Repository

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/order/order-payment-status.ts`
- Create: `apps/api/src/order/order-payment.repository.ts`
- Test: `apps/api/test/order/order-payment.repository.spec.ts`

- [x] **Step 1: Write failing repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand`

Expected: FAIL because payment repository and Prisma models do not exist.

- [x] **Step 2: Add Prisma models and repository**

Add `OrderPayment` with unique `paymentNo` and `requestId`; add `OrderPaymentCallback` with unique `providerEventId`. Implement create/find payment and callback transaction helpers.

- [x] **Step 3: Re-run repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand`

Expected: PASS.

### Task 2: Payment Service

**Files:**
- Create: `apps/api/src/order/order-payment.service.ts`
- Test: `apps/api/test/order/order-payment.service.spec.ts`

- [x] **Step 1: Write failing service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts --runInBand`

Expected: FAIL because `OrderPaymentService` does not exist.

- [x] **Step 2: Implement service**

The service must create new payment orders, return existing payment orders for identical `requestId`, reject same `requestId` with different amount/order, and process duplicate callbacks without repeated mutation.

- [x] **Step 3: Re-run service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts --runInBand`

Expected: PASS.

### Task 3: HTTP Contract

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/src/order/order.module.ts`
- Test: `apps/api/test/order/order-payment.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.e2e-spec.ts --runInBand`

Expected: FAIL because payment routes are not registered.

- [x] **Step 2: Add routes**

Expose `POST /api/orders/payments` and `POST /api/orders/payments/callbacks`.

- [x] **Step 3: Re-run HTTP tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.e2e-spec.ts --runInBand`

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

Run Prisma `db push` against local MySQL, start API, create a payment order, submit the same paid callback twice with the same `providerEventId`, and confirm the second response is marked duplicate.

Expected: first callback marks payment `paid`; second callback returns duplicate result and does not create a second callback row.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-payment-idempotency-foundation.md apps/api/prisma/schema.prisma apps/api/src/order apps/api/test/order`

Run: `git commit -m "feat: add order payment idempotency foundation"`

- [x] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-payment-idempotency-foundation`

Expected: branch is pushed and a draft PR is created against `main`.

Result: PR #33 was opened, marked ready after verification, and squash-merged into `main` as `9c936d4`.
