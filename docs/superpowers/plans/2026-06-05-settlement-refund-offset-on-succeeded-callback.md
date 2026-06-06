# Settlement Refund Offset On Succeeded Callback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply successful order refunds to pending merchant settlement bill items so merchant payable amounts reflect refund offsets before settlement statements and offline payout are added.

**Architecture:** Add a settlement repository method that allocates an order-level refund amount across the order's pending settlement bill items. Each touched bill item increments `refundOffsetAmount`, decrements `netAmount`, and moves to `reversed` when net reaches zero. `OrderRefundService.processCallback` invokes this idempotent offset path only after a non-duplicate succeeded refund callback. Duplicate and failed callbacks do not mutate settlement records. This slice only handles pending settlement bill items; statement-generated or paid-offline reversal stays out of scope.

**Tech Stack:** NestJS service wiring, Prisma repository updates, Jest focused API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order-refund.service.ts`
- Modify `apps/api/test/order/order-refund.service.spec.ts`
- Modify `apps/api/src/settlement/settlement.repository.ts`
- Modify `apps/api/test/settlement/settlement.repository.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-settlement-refund-offset-on-succeeded-callback.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add settlement repository refund offset tests**

Extend `apps/api/test/settlement/settlement.repository.spec.ts` to prove an order-level refund amount is allocated across pending settlement bill items, increments `refundOffsetAmount`, decrements `netAmount`, and marks fully offset bill items `reversed`.

- [x] **Step 2: Add refund service callback trigger tests**

Extend `apps/api/test/order/order-refund.service.spec.ts` to prove a non-duplicate succeeded callback calls settlement refund offset with `orderNo` and `refundAmount`, while duplicate and failed callbacks do not.

- [x] **Step 3: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/settlement/settlement.repository.spec.ts --runInBand
```

Expected: FAIL because settlement refund offset and refund-service invocation do not exist yet.

Actual RED: FAIL as expected. `SettlementRepository.applyRefundOffsetForSucceededRefund` did not exist, and `OrderRefundService.processCallback` did not call settlement refund offset.

### Task 2: Implementation

- [x] **Step 1: Implement settlement refund offset repository method**

Add `applyRefundOffsetForSucceededRefund({ orderNo, refundAmount })` to read pending settlement bill items for the order, allocate refund amount deterministically, update each touched item, and return the updated rows.

- [x] **Step 2: Invoke settlement offset from refund service**

Inject `SettlementRepository` into `OrderRefundService` and call the offset method only when the repository returns a non-duplicate `succeeded` refund result.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/settlement --runInBand
```

Expected: PASS.

Actual: PASS with 4 suites / 17 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS.

- `pnpm run verify`: API 61 suites / 235 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, user mini-program 9 files / 32 tests.
- `git diff --check`: PASS, with Windows LF-to-CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local paid order, confirm settlement bill auto-generation, request a refund, process a succeeded refund callback, and confirm the bill item refund offset/net/status changed without manually editing settlement records.

Actual: PASS.

- `pnpm run docker:runtime:up`: rebuilt API image, recreated API/Admin/Merchant/Portal containers, MySQL/Redis/API healthy.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- Live API smoke: paid order `ORDER-20260606013250461-1EGZH6`, payment `PAY-20260606013250524-NEMRJD`, refund `REF-20260606013250672-I44JV9`, and bill item `MSBI-ORDER-20260606013250461-1EGZH6-CMQ1OI2750001O31TEK81566H` ended with `refundOffsetAmount=6990`, `netAmount=0`, `status=reversed`.

## Boundaries

- This slice only offsets pending settlement bill items for succeeded refund callbacks.
- This slice does not implement line-level refund allocation, adjustment commands, statement reversal, payout reversal, franchise settlement, target-environment deployment, true-device checks, or formal business acceptance.

## Completion Evidence

- Feature PR: [#145](https://github.com/EasyStep-lee/welfare-mall/pull/145) `feat: offset settlement bills on refund success`.
- Merge commit: `a721e069a4507b778790ebc1aa65c42f0290e9f9`.
- Local RED verification: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/settlement/settlement.repository.spec.ts --runInBand` failed as expected before implementation because settlement refund offset did not exist and the refund service did not call it.
- Local focused verification: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.service.spec.ts test/settlement --runInBand` passed with 4 suites / 17 tests.
- Local full verification: `pnpm run verify` passed with API 61 suites / 235 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- Local diff check: `git diff --check` passed, with Windows LF-to-CRLF warnings only.
- Docker runtime verification: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed.
- Live API smoke: order `ORDER-20260606013250461-1EGZH6`, payment `PAY-20260606013250524-NEMRJD`, refund `REF-20260606013250672-I44JV9`, and bill item `MSBI-ORDER-20260606013250461-1EGZH6-CMQ1OI2750001O31TEK81566H` ended with `refundOffsetAmount=6990`, `netAmount=0`, `status=reversed`.
