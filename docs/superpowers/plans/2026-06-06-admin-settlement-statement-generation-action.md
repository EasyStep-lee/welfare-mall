# Admin Settlement Statement Generation Action

**Goal:** Let Admin finance operators generate a merchant settlement statement from the existing settlement workbench, using the already implemented settlement statement generation API.

**Branch:** `codex/admin-settlement-statement-generation-action`

## Scope

- Admin UI only.
- Add an API client helper for `POST /api/settlements/merchant-statements/generate`.
- Add a visible Admin action that uses the entered settlement merchant ID.
- Refresh the generated settlement list after the action.
- Show a clear empty result message when no pending settlement bill items are available.

## Out Of Scope

- Backend settlement calculation changes.
- Settlement reversal, batch export, payout evidence upload, or provider payout integration.
- Merchant-side write actions.
- Target environment deployment or formal acceptance.

## TDD Plan

- [x] **Step 1: Add Admin UI generation tests**

Add tests proving the Admin workbench posts a trimmed merchant ID to the generation endpoint, refreshes the generated list, and shows a generated statement success message.

Add a second test proving `statement: null` shows a no-bill-items message.

RED: `pnpm --filter @welfare-mall/admin run test -- --run` failed with 2 failing tests because the Admin UI had no accessible `生成结算单` button.

- [x] **Step 2: Add Admin API helper**

Add a typed response for generated settlement statements and a helper that posts `{ merchantId }` to the generation endpoint.

- [x] **Step 3: Add Admin workbench action**

Add a `生成结算单` action in the settlement filter row. The action should require a settlement merchant, use trimmed input, set the settlement status to `generated`, refresh with the merchant filter, and show success or empty-result feedback.

- [x] **Step 4: Verify locally**

Run focused Admin tests, full verification, and Docker runtime smoke checks.

Focused GREEN: `pnpm --filter @welfare-mall/admin run test -- --run` passed with 1 file / 19 tests.

Full verification: `pnpm run verify` passed. API reported 61 suites / 249 tests; Admin reported 1 file / 19 tests; Merchant reported 1 file / 9 tests; Portal reported 1 file / 2 tests; user mini-program reported 9 files / 32 tests.

Docker verification:

- `pnpm run docker:runtime:up`: PASS, rebuilt Admin with Vite asset `index-DqChn25a.js` and restarted API/Admin/Merchant/Portal.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- `docker compose ps`: API/Admin/Merchant/Portal/MySQL/Redis all healthy.
- Served Admin asset at `http://localhost:5173/assets/index-DqChn25a.js` contains `生成结算单` and `settlements/merchant-statements/generate`.

Browser automation note: the Browser plugin's required Node REPL tool was not available in this session, and local `playwright` was not installed. Runtime coverage for this slice therefore uses Docker page smoke plus direct served asset checks.

- [ ] **Step 5: Publish and merge**

Commit, push, open PR, merge to `main`, then mark this plan complete in a docs-only branch.

## Completion

- Pending.
