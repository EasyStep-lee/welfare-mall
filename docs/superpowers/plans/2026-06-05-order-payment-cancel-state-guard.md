# Order Payment Cancel State Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent payment creation and paid callbacks from reviving cancelled or closed orders after the buyer cancel flow is available.

**Architecture:** Keep this in the order payment domain. `OrderPaymentService.createPayment` checks the persisted order state before creating a new payment and rejects non-`pending_payment` orders with a conflict. `OrderPaymentRepository.processCallback` still records provider callback idempotency, but a paid callback only marks the payment paid and creates fulfillment/inventory when the order state transition actually reaches `paid`; callbacks against cancelled/closed orders leave payment, order header, fulfillment, and inventory unchanged.

**Tech Stack:** NestJS order payment service/repository, Prisma transaction mocks, Jest focused API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order-payment.repository.ts`
- Modify `apps/api/src/order/order-payment.service.ts`
- Modify `apps/api/test/order/order-payment.repository.spec.ts`
- Modify `apps/api/test/order/order-payment.service.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-order-payment-cancel-state-guard.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add create-payment non-payable state service test**

Extend `apps/api/test/order/order-payment.service.spec.ts` to prove `createPayment` rejects cancelled, closed, or missing order state before creating a new payment.

- [x] **Step 2: Add callback-after-cancel repository test**

Extend `apps/api/test/order/order-payment.repository.spec.ts` to prove a paid callback for an order whose state is already `cancelled` records the callback but does not mark payment paid, does not update `OrderHeader`, does not create fulfillment tasks, and does not create inventory reservations.

- [x] **Step 3: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/order/order-payment.repository.spec.ts --runInBand
```

Expected: FAIL because payment state lookup and callback state guard do not exist yet.

Actual RED: FAIL because cancelled/closed/missing order states still allowed new payment creation, and a paid callback after cancellation still updated `OrderPayment` to `paid`.

### Task 2: Implementation

- [x] **Step 1: Add payment order-state lookup**

Add `findOrderStateByOrderNo(orderNo)` to `OrderPaymentRepository` using the existing `orderStateSelect` projection.

- [x] **Step 2: Guard payment creation**

In `OrderPaymentService.createPayment`, after idempotent replay handling and before creating a new payment, reject when the order state is missing or not `pending_payment`.

- [x] **Step 3: Guard paid callback side effects**

In `OrderPaymentRepository.processCallback`, only update `OrderPayment` to `paid`, update `OrderHeader`, create fulfillment tasks, and create inventory reservations when the system transition result is `paid`.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/order/order-payment.repository.spec.ts --runInBand
```

Expected: PASS.

Actual: PASS with 2 suites / 13 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS. `pnpm run verify` passed with API 58 suites / 221 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests. `git diff --check` passed with CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Expected: PASS locally.

Actual: PASS locally. `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` completed successfully. Live API smoke created order `ORDER-20260605075235729-VODYAF`, created a pending payment, cancelled the order, confirmed a new payment request after cancellation returned `409`, processed a late paid callback with `callback.status = paid`, and confirmed `callback.payment.status = pending` plus final order status `cancelled`.

## Boundaries

- This slice prevents cancelled/closed order revival through local API payment creation and callback processing.
- This slice does not implement real payment gateway reconciliation or automatic refunds for late provider-paid callbacks.
- This slice does not add payment timeout jobs or Admin close actions.
- This slice does not perform target-environment deployment or true-device acceptance.

## Completion Evidence

- Feature PR: <https://github.com/EasyStep-lee/welfare-mall/pull/139>
- Merged main commit: `2766a87 feat: guard payments for cancelled orders (#139)`
- RED evidence: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/order/order-payment.repository.spec.ts --runInBand` failed because cancelled/closed/missing order states still allowed payment creation, and paid callbacks after cancellation still updated `OrderPayment` to `paid`.
- Focused GREEN evidence: `pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/order/order-payment.repository.spec.ts --runInBand` passed with 2 suites / 13 tests.
- Full verification evidence: `pnpm run verify` passed with API 58 suites / 221 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- Static diff evidence: `git diff --check` passed with CRLF warnings only.
- Docker runtime evidence: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed locally.
- Live local API smoke: order `ORDER-20260605075235729-VODYAF` was created with a pending payment, cancelled, then a new payment request after cancellation returned `409`; a late paid callback was recorded with `callback.status = paid`, while `callback.payment.status = pending` and the final order status remained `cancelled`.
- Acceptance boundary: local API/Docker/runtime only; target-environment deployment, real payment gateway reconciliation, automatic late-payment refunds, true-device acceptance, and formal business acceptance remain outside this slice.
