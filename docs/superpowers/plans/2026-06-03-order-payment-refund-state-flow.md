# Order Payment Refund State Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist order state and drive it from payment and refund lifecycle events.

**Architecture:** Add an `OrderState` Prisma model as the current persisted order-status projection keyed by `orderNo`. Payment creation initializes `pending_payment`; paid callbacks transition `pending_payment` to `paid`; refund creation transitions `paid` to `refund_processing`; succeeded refund callbacks transition `refund_processing` to `refunded`; failed refund callbacks transition `refund_processing` back to `paid`.

**Tech Stack:** NestJS 11, Prisma Client, MySQL 8, Jest, Supertest, TypeScript.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`: add `OrderState` model.
- Modify `apps/api/src/order/order-status.ts`: add refund-related order statuses and actions.
- Modify `apps/api/src/order/order-status-transition.ts`: add system refund transitions.
- Create `apps/api/src/order/order-state.repository.ts`: persisted order status helpers.
- Modify `apps/api/src/order/order-payment.repository.ts`: initialize and advance order state in payment transactions.
- Modify `apps/api/src/order/order-refund.repository.ts`: advance order state in refund request/callback transactions.
- Modify `apps/api/src/order/order.module.ts`: register/export order state repository.
- Test `apps/api/test/order/order-status-transition.spec.ts`: refund transition catalog behavior.
- Create `apps/api/test/order/order-state.repository.spec.ts`: persisted state behavior.
- Modify `apps/api/test/order/order-payment.repository.spec.ts`: payment state side effects.
- Modify `apps/api/test/order/order-refund.repository.spec.ts`: refund state side effects.

## Tasks

### Task 1: State Catalog and Persistence

**Files:**
- Modify: `apps/api/src/order/order-status.ts`
- Modify: `apps/api/src/order/order-status-transition.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/order/order-state.repository.ts`
- Test: `apps/api/test/order/order-status-transition.spec.ts`
- Test: `apps/api/test/order/order-state.repository.spec.ts`

- [x] **Step 1: Write failing state tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-status-transition.spec.ts test/order/order-state.repository.spec.ts --runInBand`

Expected: FAIL because refund order transitions and `OrderStateRepository` do not exist.

- [x] **Step 2: Add order statuses, transitions, schema, and repository**

Add `refund_processing` and `refunded` order statuses, system transitions for refund request/success/failure, `OrderState` model, and repository helpers to upsert pending state and transition by `orderNo`.

- [x] **Step 3: Re-run state tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-status-transition.spec.ts test/order/order-state.repository.spec.ts --runInBand`

Expected: PASS.

### Task 2: Payment-Driven Order State

**Files:**
- Modify: `apps/api/src/order/order-payment.repository.ts`
- Modify: `apps/api/test/order/order-payment.repository.spec.ts`

- [x] **Step 1: Write failing payment state tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand`

Expected: FAIL because payment repository does not write order state.

- [x] **Step 2: Implement payment state side effects**

Payment creation must upsert `pending_payment` for the payment order. First successful paid callback must transition the order to `paid`. Duplicate paid callbacks must not repeat the order transition.

- [x] **Step 3: Re-run payment repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand`

Expected: PASS.

### Task 3: Refund-Driven Order State

**Files:**
- Modify: `apps/api/src/order/order-refund.repository.ts`
- Modify: `apps/api/test/order/order-refund.repository.spec.ts`

- [x] **Step 1: Write failing refund state tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`

Expected: FAIL because refund repository does not write order state.

- [x] **Step 2: Implement refund state side effects**

Refund creation must transition order state from `paid` to `refund_processing`. First successful refund callback must transition `refund_processing` to `refunded`. First failed refund callback must transition `refund_processing` back to `paid`. Duplicate callbacks must not repeat the order transition.

- [x] **Step 3: Re-run refund repository tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`

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

Run Prisma `db push`, start local API, create a payment, submit paid callback, create a refund, submit refund succeeded callback, and query `order_state`.

Expected: the order progresses `pending_payment -> paid -> refund_processing -> refunded`, and duplicate callbacks do not add extra transitions.

Result: runtime order `ORDER-STATE-FLOW-1780467857510` progressed to final `refunded`; `paidAt`, `refundRequestedAt`, and `refundedAt` were populated, and duplicate payment/refund callback replays kept callback counts at `1` each.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [ ] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-payment-refund-state-flow.md apps/api/prisma/schema.prisma apps/api/src/order apps/api/test/order`

Run: `git commit -m "feat: drive order state from payment and refund events"`

- [ ] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-payment-refund-state-flow`

Expected: branch is pushed and a draft PR is created against `main`.
