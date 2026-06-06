# Merchant Settlement Statement Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Merchant settlement statement workbench so merchants can inspect their own generated and paid-offline settlement statements, totals, and included bill item details.

**Architecture:** Reuse the existing settlement read API. Merchant adds typed API helpers for `GET /api/settlements/merchant-statements` with the fixed local `merchantId`. `App.tsx` adds a read-only settlement panel with status tabs (`generated`, `paid_offline`, `all`), statement totals, paid/generated timestamps, and bill item rows. No payout confirmation action is exposed in Merchant; offline payout state remains an Admin finance operation.

**Tech Stack:** React/Vite Merchant app, existing local API base URL configuration, Vitest + Testing Library, Docker local runtime/page smoke.

---

## File Structure

- Modify `apps/merchant/src/api.ts`
- Modify `apps/merchant/src/App.tsx`
- Modify `apps/merchant/src/App.test.tsx`
- Modify `apps/merchant/src/styles.css`
- Create `docs/superpowers/plans/2026-06-06-merchant-settlement-statement-workbench.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add settlement statement render test**

Extend `apps/merchant/src/App.test.tsx` to prove Merchant loads `generated` settlement statements for `merchant-001`, renders statement totals, generated time, and included bill item details.

- [x] **Step 2: Add settlement status filter test**

Prove settlement status tabs compose into the statement list query while always preserving the fixed merchant context.

- [x] **Step 3: Prove Merchant settlement is read-only**

Prove Merchant renders paid-offline statement history without a payout confirmation action.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: FAIL because Merchant does not fetch or render settlement statements yet.

Actual RED: FAIL as expected. The new tests could not find the `商户结算` heading/panel because Merchant does not fetch or render settlement statements yet.

### Task 2: Implementation

- [x] **Step 1: Add Merchant settlement API helpers**

Add settlement statement types, labels, and list fetcher in `apps/merchant/src/api.ts`.

- [x] **Step 2: Add settlement workbench state**

Add statement list state, status tabs, and loader in `App.tsx`.

- [x] **Step 3: Render read-only settlement panel**

Render statement cards with totals and bill item rows before fulfillment orders.

- [x] **Step 4: Add responsive styles**

Add minimal styles consistent with existing Merchant fulfillment panels.

### Task 3: Verification

- [x] **Step 1: Run focused Merchant tests**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- --run
```

Expected: PASS.

Actual: PASS. `apps/merchant/src/App.test.tsx` ran 9 tests and all passed.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS. `pnpm run verify` completed with API 61 suites / 249 tests, Admin 17 tests, Merchant 9 tests, Portal 2 tests, and user mini-program 9 files / 32 tests. `git diff --check` completed with no whitespace errors.

- [x] **Step 3: Run local Docker and page smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify the Merchant container serves the settlement panel locally against the current API base URL.

Actual: PASS. `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` completed. `docker compose ps` showed API/Admin/Merchant/Portal/MySQL/Redis healthy. `http://localhost:5174` returned a served Merchant asset containing `商户结算` and `settlements/merchant-statements`, and the served asset did not include the Admin-only `确认离线打款` label.

## Boundaries

- This slice only adds Merchant settlement statement read UI.
- This slice does not add Merchant payout confirmation, Admin functionality, Portal UI, payout evidence uploads, payout batch export, payout reversal, generated-statement refund reversal, target-environment deployment, true-device checks, or formal business acceptance.
