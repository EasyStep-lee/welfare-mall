# Mini-Program Online Payment Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the user mini-program payment display and request helpers with the strengthened payment boundary: franchise welfare-card debit plus online WeChat/Alipay remainder, with no offline cash channel exposed to users.

**Architecture:** Keep backend field names such as `cashPayableAmount` for API compatibility, but map them in mini-program display data to `onlineRemainderText`. Payment creation allows choosing WeChat or Alipay; helper functions normalize unsupported channels away from `cash`. Refund requests continue to follow the latest online payment channel.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant publishes and fulfills goods. User remainder payment is online WeChat/Alipay only. No offline user cash channel and no store/shop subject are introduced.

**Out of Scope:** Real WeChat/Alipay SDK invocation, true-device DevTools acceptance, welfare-card account selection/balance lookup, and welfare-card refund return.

---

### Task 1: RED Mini-Program Payment Boundary Tests

**Files:**
- Modify: `apps/user-miniprogram/utils/checkout.test.mjs`
- Modify: `apps/user-miniprogram/utils/order.test.mjs`
- Modify: `apps/user-miniprogram/utils/payment.test.mjs`
- Modify: `apps/user-miniprogram/utils/refund.test.mjs`
- Modify: `apps/user-miniprogram/pages/detail/index.test.mjs`
- Modify: `apps/user-miniprogram/pages/order-detail/index.test.mjs`

- [x] **Step 1: Add failing display wording tests**

Cover:
- Product detail amount preview exposes `福利卡抵扣` and `线上补差`.
- Order detail payment split exposes `福利卡抵扣` and `线上补差`.
- Mini-program WXML does not expose `现金支付`.

Evidence:
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` failed because display helpers returned `cashText`, WXML used `现金支付`, and order detail did not expose `onlineRemainderText`.

- [x] **Step 2: Add failing online-channel tests**

Cover:
- Payment payload supports `alipay`.
- Payment payload does not send `cash`.
- Payment/refund display helpers do not map `cash` to `现金`.
- Order detail page can select Alipay before payment creation.

Evidence:
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` failed because `cash` mapped to `现金`, order-detail payment was hardcoded to WeChat, and `selectPaymentChannel` did not exist.

### Task 2: GREEN Mini-Program Boundary

**Files:**
- Modify: `apps/user-miniprogram/utils/checkout.js`
- Modify: `apps/user-miniprogram/utils/order.js`
- Modify: `apps/user-miniprogram/utils/payment.js`
- Modify: `apps/user-miniprogram/utils/refund.js`
- Modify: `apps/user-miniprogram/pages/detail/index.wxml`
- Modify: `apps/user-miniprogram/pages/order-detail/index.js`
- Modify: `apps/user-miniprogram/pages/order-detail/index.wxml`
- Modify: `apps/user-miniprogram/pages/order-detail/index.wxss`

- [x] **Step 1: Rename display semantics to online remainder**

Mini-program display helpers and WXML now show `线上补差` for the API `cashPayableAmount` value.

- [x] **Step 2: Remove offline cash channel labels**

Payment and refund display helpers no longer label `cash` as a valid user channel.

- [x] **Step 3: Add mini-program online channel selection**

Order detail page can select WeChat or Alipay before creating a payment, and unsupported channels normalize to WeChat instead of `cash`.

Evidence:
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` passed: 9 files, 43 tests.

### Task 3: Verification

- [x] Run full `pnpm run verify`.
- [x] Run `git diff --check`.
- [x] Verify no mini-program WXML or helper label maps user payment/refund to `现金`.

Evidence:
- `pnpm --filter @welfare-mall/user-miniprogram run test --run` passed: 9 files, 43 tests.
- `pnpm run verify` passed, including frontend-stack, business-boundary, lint, typecheck, API tests, Admin tests, Merchant tests, Portal tests, and user mini-program tests.
- `git diff --check` passed with only Windows LF/CRLF warnings.
- `rg -n "现金支付" apps/user-miniprogram --glob "!**/*.test.mjs"` found no matches.
- `rg -n "cash: '现金'" apps/user-miniprogram --glob "!**/*.test.mjs"` found no matches.
- `rg -n 'cash: "现金"' apps/user-miniprogram --glob "!**/*.test.mjs"` found no matches.
- `pnpm run verify:business-boundary` passed after removing stale fixed deviations and documenting cash-channel negative regression fixtures.

### Task 4: Completion

- [ ] Commit feature work on `codex/miniprogram-online-payment-boundary`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks.
- [ ] Merge PR to `main`.
- [ ] Open docs-only completion PR marking this plan complete after the feature merge.
