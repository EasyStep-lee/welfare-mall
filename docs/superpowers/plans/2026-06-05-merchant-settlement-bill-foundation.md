# Merchant Settlement Bill Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first merchant settlement bill-item foundation so paid order lines can produce traceable merchant payable records before settlement statements, locks, adjustments, and offline payout confirmation are added.

**Architecture:** Add a settlement module with a merchant bill-item Prisma model. A focused API command `POST /api/settlements/merchant-bills/generate` takes one paid `orderNo`, groups order lines by product merchant ownership, and creates one idempotent bill item per order line. Each bill item stores gross, refund offset, adjustment, and net amounts with source `order_paid` and status `pending_settlement`. A read API returns bill items filtered by merchant and status. This slice is manual generation only; payment callbacks do not auto-generate settlement records yet.

**Tech Stack:** Prisma schema, NestJS settlement module, Jest API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/app.module.ts`
- Create `apps/api/src/settlement/settlement-status.ts`
- Create `apps/api/src/settlement/settlement.repository.ts`
- Create `apps/api/src/settlement/settlement.service.ts`
- Create `apps/api/src/settlement/settlement.controller.ts`
- Create `apps/api/src/settlement/settlement.module.ts`
- Create `apps/api/test/settlement/settlement.repository.spec.ts`
- Create `apps/api/test/settlement/settlement.service.spec.ts`
- Create `apps/api/test/settlement/settlement.e2e-spec.ts`
- Create `docs/superpowers/plans/2026-06-05-merchant-settlement-bill-foundation.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add repository generation test**

Create `apps/api/test/settlement/settlement.repository.spec.ts` proving a paid order generates one merchant bill item per order line, maps product ownership to `merchantId`, stores gross/net amounts, and uses `skipDuplicates`.

- [x] **Step 2: Add repository guard/list tests**

Prove missing or non-paid orders return an empty generation result, and bill items can be listed by merchant/status.

- [x] **Step 3: Add service validation tests**

Create `apps/api/test/settlement/settlement.service.spec.ts` proving blank `orderNo` is rejected and valid generation/list inputs are trimmed before delegation.

- [x] **Step 4: Add API contract tests**

Create `apps/api/test/settlement/settlement.e2e-spec.ts` for `POST /api/settlements/merchant-bills/generate` and `GET /api/settlements/merchant-bills`.

- [x] **Step 5: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: FAIL because settlement module, service, repository, controller, and Prisma model do not exist yet.

Actual RED: FAIL because `../../src/settlement/settlement.repository` and `../../src/settlement/settlement.service` did not exist yet.

### Task 2: Implementation

- [x] **Step 1: Add Prisma bill-item model**

Add `MerchantSettlementBillItem` with unique `billItemNo` and unique `orderLineId`, merchant/order/product indexes, source/status fields, gross/refund/adjustment/net amounts, and timestamps.

- [x] **Step 2: Implement settlement repository**

Generate bill items from paid order lines with deterministic `billItemNo`, `skipDuplicates`, and a follow-up read by `orderNo`. Add list filtering by merchant/status.

- [x] **Step 3: Implement settlement service and controller**

Add input validation/normalization and expose the manual generate/read endpoints under `/api/settlements/merchant-bills`.

- [x] **Step 4: Register module**

Register `SettlementModule` in `AppModule`.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: PASS.

Actual: PASS with 3 suites / 8 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS.

- `pnpm run verify`: API 61 suites / 229 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, user mini-program 9 files / 32 tests.
- `git diff --check`: PASS, with Windows LF-to-CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local paid order, manually generate merchant settlement bill items, and confirm the read API returns pending settlement items.

Actual: PASS.

- `pnpm run docker:runtime:up`: rebuilt API image, recreated API/Admin/Merchant/Portal containers, MySQL/Redis/API healthy.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- Live API smoke: created paid order `ORDER-20260605082010143-99IATA`, payment `PAY-20260605082010171-KXTDCL`, generated bill item `MSBI-ORDER-20260605082010143-99IATA-CMQ0NM1B4000EO71YH3QMS3XI`, and confirmed merchant/status list returned it for `merchant-local-review` with `pending_settlement`.

## Boundaries

- This slice only creates pending merchant bill items from paid order lines.
- This slice does not auto-generate settlement records from payment callbacks.
- This slice does not implement refund offsets, adjustment commands, settlement statement locking, offline payout confirmation, franchise settlement, reconciliation reports, target-environment deployment, true-device checks, or formal business acceptance.

## Completion Evidence

- Feature PR: [#141](https://github.com/EasyStep-lee/welfare-mall/pull/141) `feat: add merchant settlement bill foundation`.
- Merge commit: `b2ccc27f4a8d99bd33120ce3c68526df442ca1e1`.
- Local focused verification: `pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand` passed with 3 suites / 8 tests.
- Local full verification: `pnpm run verify` passed with API 61 suites / 229 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- Local diff check: `git diff --check` passed, with Windows LF-to-CRLF warnings only before staging.
- Docker runtime verification: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed.
- Live API smoke: created paid order `ORDER-20260605082010143-99IATA`, payment `PAY-20260605082010171-KXTDCL`, generated bill item `MSBI-ORDER-20260605082010143-99IATA-CMQ0NM1B4000EO71YH3QMS3XI`, and confirmed merchant/status readback for `merchant-local-review` with `pending_settlement`.
