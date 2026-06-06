# Settlement Summary Panels

**Goal:** Show local Admin and Merchant users a compact summary of the currently loaded settlement statements before they export or reconcile payout records.

**Branch:** `codex/settlement-summary-panels`

## Scope

- Add a frontend summary builder for settlement statement count, bill item count, gross amount, refund offset, adjustment, and net amount.
- Render the summary in the Admin settlement management panel for the current status and merchant filters.
- Render the summary in the Merchant settlement panel for the current status filter.

## Out Of Scope

- API changes, database changes, server-side aggregation, cached reports, XLSX generation, bank integration, target-environment deployment, true-device checks, or formal acceptance.

## TDD Plan

- [x] **Step 1: Add failing Admin and Merchant tests**

Add focused summary builder and UI assertions for both Admin and Merchant settlement panels.

RED:

- `pnpm --filter @welfare-mall/admin run test -- --run` failed because `./settlementSummary` did not exist and the Admin settlement panel did not render `结算汇总`.
- `pnpm --filter @welfare-mall/merchant run test -- --run` failed because `./settlementSummary` did not exist and the Merchant settlement panel did not render `结算汇总`.

- [x] **Step 2: Implement summary helpers and panels**

Create small settlement summary helpers and render summary rows near the existing settlement filters/export actions.

- [x] **Step 3: Verify locally**

Run focused Admin/Merchant tests, full verification, Docker runtime smoke, page smoke, and served asset checks.

GREEN:

- `pnpm --filter @welfare-mall/admin run test -- --run` passed: 3 files / 22 tests.
- `pnpm --filter @welfare-mall/merchant run test -- --run` passed: 3 files / 12 tests.
- `pnpm --filter @welfare-mall/admin run lint` passed.
- `pnpm --filter @welfare-mall/merchant run lint` passed.
- `pnpm run verify` passed: API 61 suites / 249 tests, Admin 3 files / 22 tests, Merchant 3 files / 12 tests, Portal 1 file / 2 tests, user miniprogram 9 files / 32 tests.
- `pnpm run docker:runtime:up` rebuilt Admin and Merchant images and started API/Admin/Merchant/Portal.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- `docker compose ps` showed API/Admin/Merchant/Portal/MySQL/Redis healthy.
- Served Admin bundle `/assets/index-CpoMVcx0.js` contained `结算汇总`, `汇总结算单`, and `汇总应打款`.
- Served Merchant bundle `/assets/index-DJPg4XaX.js` contained `结算汇总`, `汇总结算单`, and `汇总应收`.

- [x] **Step 4: Publish and merge**

Commit, push, open PR, merge to `main`, then mark this plan complete in a docs-only branch.

Published:

- Feature PR: https://github.com/EasyStep-lee/welfare-mall/pull/163
- Merged commit: `8afe67e feat: add settlement summary panels`

## Completion

Completed in PR #163 and marked complete by this docs-only follow-up.
