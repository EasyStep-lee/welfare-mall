# Merchant Settlement CSV Export

**Goal:** Let local Merchant users export their currently loaded settlement statements as a line-level CSV for offline reconciliation against Admin payout records.

**Branch:** `codex/merchant-settlement-csv-export`

## Scope

- Add a Merchant-side CSV builder for settlement statement totals and bill item rows.
- Add a Merchant `导出结算CSV` action that downloads the currently loaded settlement list after status filtering.
- Include payout reference and remark columns so merchants can reconcile offline bank transfer evidence.

## Out Of Scope

- Server-side export endpoints.
- XLSX generation, file storage, attachments, or scheduled reports.
- Bank integration, payout disputes, target-environment deployment, true-device checks, or formal acceptance.

## TDD Plan

- [x] **Step 1: Add failing Merchant export tests**

Add a CSV builder test for statement totals, payout metadata, bill item rows, amount formatting, and CSV escaping.

Add a Merchant UI test proving the export button downloads the currently loaded settlement statements.

RED: `pnpm --filter @welfare-mall/merchant run test -- --run` failed because `settlementExport` did not exist and the Merchant UI had no `导出结算CSV` button.

- [x] **Step 2: Implement CSV builder and Merchant action**

Create the CSV builder, add browser download helper logic, and render a compact `导出结算CSV` action next to the settlement status tabs.

- [x] **Step 3: Verify locally**

Run focused Merchant tests, full verification, Docker runtime smoke, page smoke, and served asset checks.

GREEN:

- `pnpm --filter @welfare-mall/merchant run test -- --run` passed: 2 files / 11 tests.
- `pnpm --filter @welfare-mall/merchant run lint` passed.
- `pnpm run verify` passed: API 61 suites / 249 tests, Admin 2 files / 21 tests, Merchant 2 files / 11 tests, Portal 1 file / 2 tests, user miniprogram 9 files / 32 tests.
- `pnpm run docker:runtime:up` rebuilt the Merchant image and started API/Admin/Merchant/Portal.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- `docker compose ps` showed API/Admin/Merchant/Portal/MySQL/Redis healthy with Merchant mapped on `5174`.
- Served Merchant bundle `/assets/index-Bgwjt79x.js` contained `导出结算CSV`, `merchant-settlements-`, `merchant-001`, `statementNo`, `payoutReference`, and `billItemNetAmount`.

- [ ] **Step 4: Publish and merge**

Commit, push, open PR, merge to `main`, then mark this plan complete in a docs-only branch.

## Completion

Pending.
