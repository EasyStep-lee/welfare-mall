# Admin Settlement CSV Export

**Goal:** Let local Admin operators export the currently loaded merchant settlement statements as a line-level CSV for offline reconciliation and payout handoff.

**Branch:** `codex/admin-settlement-csv-export`

## Scope

- Add a small Admin-side CSV builder for settlement statement totals and bill item rows.
- Add an Admin button that downloads the currently loaded settlement list after existing filters are applied.
- Include payout reference and remark columns so offline payment evidence travels with the export.

## Out Of Scope

- Server-side export endpoints.
- XLSX generation, file storage, attachments, or scheduled reports.
- Bank integration, target-environment deployment, true-device checks, or formal acceptance.

## TDD Plan

- [x] **Step 1: Add failing Admin export tests**

Add a CSV builder test for statement totals, payout metadata, bill item rows, amount formatting, and CSV escaping.

Add an Admin UI test proving the export button downloads the currently loaded settlement statements.

RED: `pnpm --filter @welfare-mall/admin run test -- --run` failed because `settlementExport` did not exist and the Admin UI had no `导出结算CSV` button.

- [x] **Step 2: Implement CSV builder and Admin action**

Create the CSV builder, add browser download helper logic, and render a compact `导出结算CSV` action next to settlement filters.

- [x] **Step 3: Verify locally**

Run focused Admin tests, full verification, Docker runtime smoke, page smoke, and served asset checks.

Focused GREEN:

- `pnpm --filter @welfare-mall/admin run lint`: PASS.
- `pnpm --filter @welfare-mall/admin run test -- --run`: PASS with 2 files / 21 tests.

Full verification: `pnpm run verify` passed. API reported 61 suites / 249 tests; Admin reported 2 files / 21 tests; Merchant reported 1 file / 9 tests; Portal reported 1 file / 2 tests; user mini-program reported 9 files / 32 tests.

Docker verification:

- `pnpm run docker:runtime:up`: PASS, rebuilt API/Admin/Merchant images and restarted API/Admin/Merchant/Portal.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- `docker compose ps`: API/Admin/Merchant/Portal/MySQL/Redis all healthy.
- Served Admin asset at `http://localhost:5173/assets/index-DHniBIAQ.js` contains `导出结算CSV`, `merchant-settlements-`, `statementNo`, `payoutReference`, and `billItemNetAmount`.

- [ ] **Step 4: Publish and merge**

Commit, push, open PR, merge to `main`, then mark this plan complete in a docs-only branch.

## Completion

Pending.
