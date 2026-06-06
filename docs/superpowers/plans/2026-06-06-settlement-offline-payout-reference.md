# Settlement Offline Payout Reference

**Goal:** Add lightweight offline payout traceability to merchant settlement statements by recording a bank transfer reference and optional remark when Admin confirms offline payout.

**Branch:** `codex/settlement-offline-payout-reference`

## Scope

- Add nullable payout reference and remark fields to `MerchantSettlementStatement`.
- Include those fields in settlement statement read models.
- Accept `payoutReference` and `payoutRemark` in the offline payout confirmation API.
- Let Admin enter the payout reference and optional remark during confirmation.
- Show payout reference and remark in Admin and Merchant settlement history.

## Out Of Scope

- Bank or payment-provider integration.
- File upload or bank receipt attachments.
- Payout reversal workflows.
- Target environment deployment, true-device checks, or formal acceptance.

## TDD Plan

- [x] **Step 1: Add failing API tests**

Extend settlement service, repository, and API contract tests so offline payout confirmation trims `payoutReference` / `payoutRemark`, persists them on the statement, and returns them in statement read models.

RED: `pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand` failed with 3 failing assertions because the controller, service, and repository only passed `paidAt`.

- [x] **Step 2: Add failing Admin and Merchant UI tests**

Extend Admin tests to prove the confirmation request includes the entered payout reference and remark and that paid statements display them.

Extend Merchant tests to prove paid settlement history displays payout reference and remark read-only.

RED: `pnpm --filter @welfare-mall/admin run test -- --run` failed because the payout confirmation request body only contained `paidAt`. `pnpm --filter @welfare-mall/merchant run test -- --run` failed because paid settlement cards did not show the payout reference.

- [x] **Step 3: Implement API and schema support**

Add Prisma fields, regenerate Prisma client, update repository select/update types, service normalization, and controller request mapping.

- [x] **Step 4: Implement Admin and Merchant UI support**

Add typed fields, Admin prompt flow, request payload mapping, and read-only display in both settlement cards.

- [x] **Step 5: Verify locally**

Run focused API/Admin/Merchant tests, full verification, Docker runtime smoke, page smoke, and served asset checks.

Focused GREEN:

- `pnpm --filter @welfare-mall/api run test -- test/settlement --runInBand`: PASS with 3 suites / 24 tests.
- `pnpm --filter @welfare-mall/admin run test -- --run`: PASS with 1 file / 19 tests.
- `pnpm --filter @welfare-mall/merchant run test -- --run`: PASS with 1 file / 9 tests.

Full verification: `pnpm run verify` passed. API reported 61 suites / 249 tests; Admin reported 1 file / 19 tests; Merchant reported 1 file / 9 tests; Portal reported 1 file / 2 tests; user mini-program reported 9 files / 32 tests.

Docker verification:

- `pnpm run docker:runtime:up`: PASS, rebuilt API/Admin/Merchant images and restarted API/Admin/Merchant/Portal.
- `pnpm run docker:runtime:smoke`: PASS.
- `pnpm run docker:page-smoke`: PASS.
- `docker compose ps`: API/Admin/Merchant/Portal/MySQL/Redis all healthy.
- Served Admin asset at `http://localhost:5173/assets/index-C3Jrvin0.js` contains `打款流水号` and `payoutReference`.
- Served Merchant asset at `http://localhost:5174/assets/index-BWfDl_EO.js` contains `流水 ` and `payoutReference`.
- Container API read check: `GET /api/settlements/merchant-statements?status=generated` returned `payoutReference` and `payoutRemark` properties.

- [x] **Step 6: Publish and merge**

Commit, push, open PR, merge to `main`, then mark this plan complete in a docs-only branch.

Feature PR: https://github.com/EasyStep-lee/welfare-mall/pull/157

Feature merge SHA: `4583273`

## Completion

- Completed in PR #157 and marked complete by docs-only follow-up.
