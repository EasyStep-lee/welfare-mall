# Settlement Auto Generation On Paid Callback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically generate merchant settlement bill items after a payment callback successfully moves an order to paid, so paid order lines do not depend on a manual settlement generation API call.

**Architecture:** Reuse the existing `SettlementRepository.generateMerchantBillItemsForPaidOrder(orderNo)` idempotent generation path from `OrderPaymentService.processCallback`. The call happens after the payment repository finishes callback processing. It only runs when the callback is not a duplicate and the returned payment is `paid`; failed callbacks, duplicate provider events, and cancelled/blocked payment callbacks do not create settlement records. `OrderModule` imports `SettlementModule` to inject the exported repository.

**Tech Stack:** NestJS service/module wiring, Jest focused API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order.module.ts`
- Modify `apps/api/src/order/order-payment.service.ts`
- Modify `apps/api/test/order/order-payment.service.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-settlement-auto-generate-on-paid-callback.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add paid callback settlement generation test**

Extend `apps/api/test/order/order-payment.service.spec.ts` to prove `processCallback` invokes settlement bill generation with the paid order number when a new provider event returns a paid payment.

- [x] **Step 2: Add non-generation guard tests**

Prove duplicate callbacks and failed callbacks do not invoke settlement generation.

- [x] **Step 3: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts --runInBand
```

Expected: FAIL because `OrderPaymentService.processCallback` does not invoke settlement generation yet.

Actual RED: FAIL as expected. `processes payment callback through repository idempotency` expected `SettlementRepository.generateMerchantBillItemsForPaidOrder('ORDER-20260603-001')`, but it was called 0 times.

### Task 2: Implementation

- [x] **Step 1: Inject settlement repository into payment service**

Import `SettlementRepository`, accept it in `OrderPaymentService`, and call it after a non-duplicate paid callback.

- [x] **Step 2: Wire modules**

Import `SettlementModule` into `OrderModule` so Nest can resolve the settlement repository.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.service.spec.ts test/settlement --runInBand
```

Expected: PASS.

Actual: PASS with 4 suites / 18 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS.

- `pnpm run verify`: API 61 suites / 231 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, user mini-program 9 files / 32 tests.
- `git diff --check`: PASS, with Windows LF-to-CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local paid order via payment callback without calling the manual settlement generation endpoint, and confirm the merchant bill list includes the generated pending settlement item.

Actual: PASS.

- `pnpm run docker:runtime:up`: rebuilt API image, recreated API/Admin/Merchant/Portal containers, MySQL/Redis/API healthy.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- Live API smoke without manual settlement generation: created paid order `ORDER-20260605084150554-AMNIA0`, payment `PAY-20260605084150589-64A1TI`, and confirmed pending bill item `MSBI-ORDER-20260605084150554-AMNIA0-CMQ0ODWPN000EQZ1UTNRVD3GT` for `merchant-local-review`.

## Boundaries

- This slice only auto-generates initial `order_paid` pending settlement bill items on successful paid callbacks.
- This slice keeps the manual generation endpoint for idempotent repair/backfill.
- This slice does not implement refund offsets, adjustments, statement locking, payout confirmation, franchise settlement, target-environment deployment, true-device checks, or formal business acceptance.
