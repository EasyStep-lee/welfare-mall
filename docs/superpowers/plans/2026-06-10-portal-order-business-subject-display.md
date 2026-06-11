# Portal Order Business Subject Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show buyer-facing order business subjects with stable snapshots instead of raw internal IDs in Portal order list and detail.

**Architecture:** Reuse the order-header snapshots returned by the API: `salesFranchiseName`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress`. Portal API types include those fields. Portal order list and detail render snapshot names first, with existing IDs only as missing-data fallback. This slice does not change checkout creation, payment, pickup-code generation, fulfillment task creation, or settlement.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant is the publishing and fulfillment party and has an actual address. The platform has no store/shop subject. User payment remains welfare card plus online WeChat/Alipay remainder; no offline cash channel is introduced.

**Out of Scope:** Admin order management display, Merchant fulfillment display, login identity replacement, settlement payout records, checkout fulfillment semantics, target-environment deployment, true-device verification, and formal acceptance.

---

### Task 1: RED Portal Display Tests

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Require snapshot-based order subjects**

Cover:
- Order list shows `销售加盟商 本地福利卡中心`.
- Order list shows `履约商户 本地优选商户` rather than `履约商户 merchant-local-review`.
- Order detail shows sales franchise, fulfillment merchant, and fulfillment merchant address.
- Pickup order detail uses the same fulfillment merchant snapshot and does not surface legacy pickup store as the seller/fulfillment subject.
- Legacy orders without snapshots show `待确认` instead of internal merchant IDs.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run src/App.test.ts` failed with 3 expected assertions because Portal still rendered `履约商户 merchant-local-review` and lacked sales franchise/address text.
- Browser runtime verification then exposed existing legacy local orders still showing `履约商户 merchant-local-review`; an additional RED test failed because the missing-snapshot fallback still exposed the internal merchant ID.

### Task 2: GREEN Portal Display

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Extend Portal order types**

Add order snapshot fields for sales franchise and fulfillment merchant/address.

- [x] **Step 2: Render snapshot fields first**

Use `salesFranchiseName`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress` in order cards and detail. When old orders lack snapshots, show `待确认` instead of raw internal IDs.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run src/App.test.ts` passed: 1 file, 21 tests.

### Task 3: Verification

- [x] Run Portal focused tests.
- [x] Run Portal typecheck.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker runtime and verify served Portal bundle plus browser behavior.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run src/App.test.ts` passed: 1 file, 21 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `git diff --check` passed with only Windows LF/CRLF warnings.
- `pnpm run verify` passed, including frontend-stack, business-boundary, Prisma generate, lint, typecheck, API tests, Admin tests, Merchant tests, Portal tests, and user mini-program tests.
- `pnpm run docker:runtime:up` rebuilt/restarted the Docker runtime. Portal build emitted `dist/assets/index-DMvflgGS.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served Portal bundle check for `http://localhost:5175/` confirmed `销售加盟商`, `履约商户`, `履约地址`, and `待确认` are present, and `履约商户 merchant-local-review` is absent.
- Browser verification on `http://localhost:5175/` confirmed legacy local orders show `销售加盟商 待确认` and `履约商户 待确认`, with no `履约商户 merchant-local-review`.
- Created local Portal order `ORDER-20260611031543693-LV13AV` for `local-user-001` through the Docker API and opened it in the browser. The order card/detail showed `本地福利卡中心`, `本地优选商户`, and `Shanghai Pudong Local Runtime Road 88`, with no `履约商户 merchant-local-review`.

### Task 4: Completion

- [x] Commit feature work on `codex/portal-order-business-subject-display`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature branch: `codex/portal-order-business-subject-display`.
- Feature commit: `4f16f57 feat: show portal order business subjects`.
- Feature PR: #259 `feat: show portal order business subjects`.
- GitHub Actions for PR #259 passed: `Project docs check` run 522, including `docs-check` and `project-foundation-check`.
- Feature PR #259 squash-merged to `main` at `0ed6602 feat: show portal order business subjects`.
- Docs-only completion branch: `codex/docs-portal-order-business-subject-display-complete`.
