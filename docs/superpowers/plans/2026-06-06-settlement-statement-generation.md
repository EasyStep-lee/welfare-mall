# Settlement Statement Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate merchant settlement statements from pending merchant settlement bill items, lock the included items, and expose a read path for Admin/Merchant follow-up payout work.

**Architecture:** Add `MerchantSettlementStatement` as a settlement statement header. A generation command for one `merchantId` reads pending settlement bill items with positive `netAmount`, creates a statement with gross/refund/adjustment/net totals, item count, generated status, and links each bill item to the statement while moving bill items to `statement_generated`. A read API lists statements by merchant/status and returns their included bill items. This creates the stable aggregate for later offline payout confirmation.

**Tech Stack:** Prisma schema, NestJS settlement module, Jest API tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/settlement/settlement-status.ts`
- Modify `apps/api/src/settlement/settlement.repository.ts`
- Modify `apps/api/src/settlement/settlement.service.ts`
- Modify `apps/api/src/settlement/settlement.controller.ts`
- Modify `apps/api/test/settlement/settlement.repository.spec.ts`
- Modify `apps/api/test/settlement/settlement.service.spec.ts`
- Modify `apps/api/test/settlement/settlement.e2e-spec.ts`
- Create `docs/superpowers/plans/2026-06-06-settlement-statement-generation.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add repository statement generation tests**

Extend `settlement.repository.spec.ts` to prove pending positive-net bill items for one merchant create a statement, update included bill items to `statement_generated`, link `statementId`, and sum totals correctly.

- [x] **Step 2: Add service validation/list tests**

Extend `settlement.service.spec.ts` to prove blank `merchantId` is rejected, valid inputs are trimmed, and statement list filters are normalized.

- [x] **Step 3: Add API contract tests**

Extend `settlement.e2e-spec.ts` for `POST /api/settlements/merchant-statements/generate` and `GET /api/settlements/merchant-statements`.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: FAIL because settlement statement schema, repository methods, service methods, and controller routes do not exist yet.

Actual RED: FAIL as expected. Statement API routes returned 404 and settlement statement repository/service methods did not exist.

### Task 2: Implementation

- [x] **Step 1: Add Prisma statement model**

Add `MerchantSettlementStatement` and nullable `statementId` relation on `MerchantSettlementBillItem`.

- [x] **Step 2: Implement repository generation/list**

Generate statements from pending positive-net bill items in a transaction, lock bill items to `statement_generated`, and list statements with included items.

- [x] **Step 3: Implement service and controller APIs**

Add validation/normalization and expose `POST /api/settlements/merchant-statements/generate` and `GET /api/settlements/merchant-statements`.

### Task 3: Verification

- [x] **Step 1: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand
```

Expected: PASS.

Actual: PASS with 3 suites / 18 tests.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS.

- `pnpm run verify`: PASS with API 61 suites / 243 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- `git diff --check`: PASS, with Windows LF-to-CRLF warnings only.

- [x] **Step 3: Run local Docker smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local paid order, confirm a pending settlement bill item exists, generate a merchant statement, and confirm the statement read API returns the linked bill item with status `statement_generated`.

Actual: PASS.

- `pnpm run docker:runtime:up`: PASS, rebuilt API image with Prisma generate and Nest build, and started API/Admin/Merchant/Portal containers.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- Live API smoke: created paid order `ORDER-20260606020354197-N4ISHU`; payment callback generated a pending settlement bill item; `POST /api/settlements/merchant-statements/generate` created statement `MSS-20260606020354304-6BPEYN`; statement list/read returned the linked bill item; merchant bill read showed the item locked as `statement_generated` with the generated `statementId`.

## Boundaries

- This slice only generates and reads settlement statements.
- This slice does not confirm offline payouts, reverse generated statements, handle line-level refund allocation after statement generation, target-environment deployment, true-device checks, or formal business acceptance.

## Completion Evidence

- Feature branch: `codex/settlement-statement-generation`
- Feature PR: #147 `feat: generate merchant settlement statements`
- Feature merge commit: `fc965aa52138ee8df6f006656a2de20c20d28a5a`
- Focused tests: `pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand` PASS with 3 suites / 18 tests.
- Full verification: `pnpm run verify` PASS with API 61 suites / 243 tests, Admin 14 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests.
- Docker runtime: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` PASS.
- Live API smoke: order `ORDER-20260606020354197-N4ISHU` was included in settlement statement `MSS-20260606020354304-6BPEYN`; linked merchant bill item was locked as `statement_generated`.
