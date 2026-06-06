# Settlement Offline Payout Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Confirm offline merchant payouts for generated settlement statements, so finance can move statement aggregates and included bill items into a paid state after bank transfer evidence is handled outside the system.

**Architecture:** Reuse the existing `MerchantSettlementStatement` model and `paidAt` field. A confirm command targets one generated `statementNo`, updates the statement to `paid_offline`, stamps `paidAt`, and moves included bill items from `statement_generated` to `paid_offline` in the same transaction. The statement read API continues to return the paid statement and its item statuses. This slice records the local payout state only; bank transfer evidence files and reversal workflows stay out of scope.

**Tech Stack:** NestJS settlement module, Prisma repository transaction, Jest API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/settlement/settlement.repository.ts`
- Modify `apps/api/src/settlement/settlement.service.ts`
- Modify `apps/api/src/settlement/settlement.controller.ts`
- Modify `apps/api/test/settlement/settlement.repository.spec.ts`
- Modify `apps/api/test/settlement/settlement.service.spec.ts`
- Modify `apps/api/test/settlement/settlement.e2e-spec.ts`
- Create `docs/superpowers/plans/2026-06-06-settlement-offline-payout-confirmation.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add repository payout confirmation tests**

Extend `settlement.repository.spec.ts` to prove a generated statement is updated to `paid_offline`, `paidAt` is stamped, and linked bill items are moved from `statement_generated` to `paid_offline` in one transaction.

- [x] **Step 2: Add service validation tests**

Extend `settlement.service.spec.ts` to prove `statementNo` is trimmed, optional `paidAt` is parsed, blank statement numbers are rejected, and invalid dates are rejected.

- [x] **Step 3: Add API contract test**

Extend `settlement.e2e-spec.ts` for `POST /api/settlements/merchant-statements/:statementNo/confirm-offline-payout`.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: FAIL because the payout confirmation repository method, service method, and controller route do not exist yet.

Actual RED: FAIL as expected. The API route returned 404 and `confirmMerchantSettlementStatementOfflinePayout` did not exist on the repository/service.

### Task 2: Implementation

- [x] **Step 1: Implement repository transaction**

Find a generated statement by `statementNo`, update it to `paid_offline` with `paidAt`, update linked bill items to `paid_offline`, and return the updated statement with items.

- [x] **Step 2: Implement service validation**

Normalize `statementNo`, parse optional `paidAt`, default to `new Date()`, and delegate to the repository.

- [x] **Step 3: Implement controller API**

Expose `POST /api/settlements/merchant-statements/:statementNo/confirm-offline-payout`.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: PASS.

Actual: PASS with 3 suites / 24 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS.

- `pnpm run verify`: PASS with API 61 suites / 249 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- `git diff --check`: PASS, with Windows LF-to-CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local paid order, generate a merchant settlement statement, confirm offline payout, and confirm the statement and included bill item read back as `paid_offline`.

Actual: PASS.

- `pnpm run docker:runtime:up`: PASS, rebuilt API image with Prisma generate and Nest build, and started API/Admin/Merchant/Portal containers.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- Live API smoke: created paid order `ORDER-20260606022539075-R2SEBH`; payment callback generated a pending settlement bill item; `POST /api/settlements/merchant-statements/generate` created statement `MSS-20260606022539201-2LZTQ4`; `POST /api/settlements/merchant-statements/:statementNo/confirm-offline-payout` confirmed offline payout; statement and merchant bill reads returned `paid_offline`.

## Boundaries

- This slice only confirms offline payout state after a statement has already been generated.
- This slice does not implement bank transfer evidence uploads, payout batch files, payout reversal, generated-statement refund reversal, target-environment deployment, true-device checks, or formal business acceptance.
