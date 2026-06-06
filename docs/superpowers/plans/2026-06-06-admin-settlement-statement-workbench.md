# Admin Settlement Statement Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local Admin settlement statement workbench so finance operators can inspect generated/paid merchant settlement statements and confirm offline payout from the browser UI.

**Architecture:** Reuse the existing settlement APIs. Admin adds typed API helpers for `GET /api/settlements/merchant-statements` and `POST /api/settlements/merchant-statements/:statementNo/confirm-offline-payout`. `App.tsx` adds a settlement panel with status tabs (`generated`, `paid_offline`, `all`), merchant filtering, statement totals, included bill items, and a `generated`-only confirm button. Confirmation posts `paidAt` as the current local ISO timestamp, then refreshes the statement list. This is an Admin UI surface only; no backend schema or settlement business rule changes are included.

**Tech Stack:** React/Vite Admin app, existing API base URL configuration, Vitest + Testing Library, Docker local runtime/browser smoke.

---

## File Structure

- Modify `apps/admin/src/api.ts`
- Modify `apps/admin/src/App.tsx`
- Modify `apps/admin/src/App.test.tsx`
- Modify `apps/admin/src/styles.css`
- Create `docs/superpowers/plans/2026-06-06-admin-settlement-statement-workbench.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add settlement statement render test**

Extend `apps/admin/src/App.test.tsx` to prove Admin loads `generated` settlement statements, renders statement totals, merchant, generated time, and included bill item details.

- [x] **Step 2: Add settlement filters test**

Prove the status tabs and merchant filter compose into the statement list query.

- [x] **Step 3: Add offline payout action test**

Prove clicking `确认离线打款` posts to the statement confirmation endpoint with `paidAt`, shows the success message, and refreshes the list.

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because Admin does not fetch or render settlement statements yet.

Actual RED: FAIL as expected. The new tests could not find the `结算管理` panel, `结算商户` filter, or `确认离线打款` action.

### Task 2: Implementation

- [x] **Step 1: Add Admin settlement API helpers**

Add settlement statement types, labels, list fetcher, and offline payout confirmation helper in `apps/admin/src/api.ts`.

- [x] **Step 2: Add settlement workbench state and actions**

Add statement list state, status/merchant filters, loader, and confirm action in `App.tsx`.

- [x] **Step 3: Render settlement panel**

Render a compact finance-facing panel before product review with totals, bill item rows, filters, and generated-only action.

- [x] **Step 4: Add responsive styles**

Add minimal styles consistent with existing order/inventory panels.

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

Actual: PASS. `apps/admin/src/App.test.tsx` ran 17 tests and all passed.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

Actual: PASS. `pnpm run verify` completed with API 61 suites / 249 tests, Admin 17 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 9 files / 32 tests. `git diff --check` completed with no whitespace errors.

- [x] **Step 3: Run local Docker and browser smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify the Admin container serves the settlement panel locally against the current API base URL.

Actual: PASS. `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` completed. `docker compose ps` showed API/Admin/Merchant/Portal/MySQL/Redis healthy. `http://localhost:5173` returned 200, the served Admin JS asset contained `结算管理`, `确认离线打款`, and `settlements/merchant-statements`, and `http://localhost:3000/api/settlements/merchant-statements?status=generated` returned a generated statement for `merchant-local-review`.

## Boundaries

- This slice only adds Admin settlement statement read/confirm UI.
- This slice does not add Merchant settlement UI, Portal UI, payout evidence uploads, payout batch export, payout reversal, target-environment deployment, true-device checks, or formal business acceptance.
