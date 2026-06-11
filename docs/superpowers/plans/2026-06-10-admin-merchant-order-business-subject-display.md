# Admin Merchant Order Business Subject Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show Admin order management and Merchant fulfillment business subjects with stable order snapshots instead of raw internal merchant IDs.

**Architecture:** Reuse the order-header snapshots already returned by the API: `salesFranchiseName`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress`. Admin and Merchant frontend API types include those optional fields. Admin order cards and Merchant fulfillment cards render snapshot names/address first, with `待确认` for old orders missing snapshots.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant publishes products, owns fulfillment, and has an actual address. The platform has no store/shop subject. User payment remains welfare card plus online WeChat/Alipay remainder; no offline cash channel is introduced.

**Out of Scope:** Backend snapshot persistence, checkout creation, payment/refund flows, settlement payout records, login/RBAC replacement, Portal display, target-environment deployment, true-device verification, and formal acceptance.

---

### Task 1: RED Admin And Merchant Display Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Require snapshot-based business subjects**

Cover:
- Admin order cards show `销售加盟商`, `履约商户`, and `履约地址` from order snapshots.
- Admin fulfillment task rows no longer present raw `merchantId` as the fulfillment subject.
- Merchant fulfillment cards show `销售加盟商`, `履约商户`, and `履约地址` from order snapshots.
- Admin and Merchant stale stored sessions that receive 401 return to the login screens and clear the rejected local auth state.

Evidence:
- `pnpm --filter @welfare-mall/admin run test --run src/App.test.ts` failed because Admin still lacked `销售加盟商 浦东福利加盟商`.
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts` failed because Merchant still lacked `销售加盟商 浦东福利加盟商`.
- `pnpm --filter @welfare-mall/admin run test --run src/App.test.ts` then failed because the rejected stored Admin token remained in localStorage.
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts` then failed because the rejected stored Merchant token remained in localStorage.

### Task 2: GREEN Admin And Merchant Display

**Files:**
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/merchant/src/api.ts`
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Extend frontend order types**

Add optional order snapshot fields for sales franchise and fulfillment merchant/address.

- [x] **Step 2: Render snapshot fields first**

Use `salesFranchiseName`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress` in Admin order cards and Merchant fulfillment cards. When old orders lack snapshots, show `待确认` instead of raw internal merchant IDs.

- [x] **Step 3: Recover stale local sessions**

When initial Admin or Merchant read-model loading fails with 401, clear the stored access token/user and return to the corresponding login screen.

Evidence:
- API read-model check confirmed Admin orders select the snapshot fields in `orderReadSelect()`.
- API fulfillment check confirmed Merchant fulfillment responses spread `...task.order` and select the snapshot fields in `fulfillmentTaskSelect()`.
- `pnpm --filter @welfare-mall/admin run test --run src/App.test.ts` passed: 1 file, 18 tests.
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts` passed: 1 file, 12 tests.

### Task 3: Verification

- [x] Run Admin and Merchant focused tests.
- [x] Run Admin and Merchant typecheck.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker runtime and verify served Admin/Merchant bundles plus browser behavior.

Evidence:
- `pnpm --filter @welfare-mall/admin run test --run src/App.test.ts` passed: 1 file, 18 tests.
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts` passed: 1 file, 12 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm --filter @welfare-mall/merchant run typecheck` passed.
- `git diff --check` passed with only Windows LF/CRLF warnings.
- `pnpm run verify` passed, including frontend-stack, business-boundary, Prisma generate, lint, typecheck, API tests, Admin tests, Merchant tests, Portal tests, and user mini-program tests.
- After adding stale-session recovery, `pnpm run verify` passed again with Admin App tests at 18 cases and Merchant App tests at 12 cases.
- `pnpm run docker:runtime:up` rebuilt/restarted API, Admin, Merchant, and Portal. Admin build emitted `dist/assets/index-BrWz3zFN.js`; Merchant build emitted `dist/assets/index-C5hHKF6l.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served Admin bundle check for `http://localhost:5173/` confirmed `销售加盟商`, `履约商户`, `履约地址`, `待确认`, and stale-session cleanup code are present, with no `履约商户 merchant-*` subject string.
- Served Merchant bundle check for `http://localhost:5174/` confirmed `销售加盟商`, `履约商户`, `履约地址`, `待确认`, and stale-session cleanup code are present, with no `履约商户 merchant-*` subject string.
- Browser verification on `http://localhost:5173/` confirmed stale Admin local auth returns to `平台登录`; after logging in, order cards show `本地福利卡中心`, `本地优选商户`, and `Shanghai Pudong Local Runtime Road 88`, with no `履约商户 merchant-*`.
- Browser verification on `http://localhost:5174/` confirmed stale Merchant local auth returns to `商户登录`; after logging in, pending legacy fulfillment tasks show `待确认` without raw merchant subjects, and completed recent orders show `本地福利卡中心`, `本地优选商户`, and `Shanghai Pudong Local Runtime Road 88`.

### Task 4: Completion

- [ ] Commit feature work on `codex/admin-merchant-order-business-subject-display`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks and merge.
- [ ] Create docs-only completion PR after feature merge.
