# Portal Online Payment Channel Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align Portal order payment with the strengthened payment boundary: users pay with franchise welfare-card debit plus an online WeChat/Alipay remainder, never an offline cash channel.

**Architecture:** Keep the existing order amount split and payment creation API. Portal displays the two payment components, lets the user choose the online channel for the remainder, posts `wechat` or `alipay`, and uses the original online payment channel for refunds.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant publishes and fulfills goods. The cash remainder means online payment through WeChat/Alipay only; no offline user cash channel and no store/shop subject are introduced.

**Out of Scope:** Welfare-card account selection/balance lookup, real WeChat/Alipay SDK invocation, mini-program payment UI parity, and welfare-card refund return.

---

### Task 1: RED Portal Payment Boundary Tests

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Add failing Portal mixed-payment test**

Cover:
- Pending order detail shows `福利卡抵扣` and `线上补差`.
- Portal does not render `现金` for user payment.
- User can choose Alipay and the payment request posts `channel: 'alipay'`.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run` failed because Portal only showed hardcoded WeChat payment text and did not expose the welfare-card/online-remainder split.

- [x] **Step 2: Add failing refund-channel test**

Cover:
- Refund request uses the original latest payment channel instead of hardcoded WeChat.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run` failed because refund requests still posted `channel: 'wechat'` for an Alipay-paid order.

### Task 2: GREEN Portal Payment Boundary

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Tighten Portal payment/refund channel types**

Portal payment/refund inputs now accept the explicit online channel union `wechat | alipay`.

- [x] **Step 2: Add Portal online channel selection and payment split display**

Pending order payment action shows welfare-card debit and online remainder separately, and lets the user choose WeChat or Alipay.

- [x] **Step 3: Refund by original online payment channel**

Portal refund requests use the latest payment channel when it is `wechat` or `alipay`.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run` passed: 1 file, 20 tests.

### Task 3: Verification

- [x] Run focused Portal typecheck/test.
- [x] Run full `pnpm run verify`.
- [x] Run `git diff --check`.
- [x] Rebuild Docker runtime.
- [x] Verify served Portal bundle contains the new online payment labels and no user-facing offline cash text for the payment block.
- [x] Verify the Portal page in browser at `http://localhost:5175/` can render the updated payment UI.

Evidence:
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm --filter @welfare-mall/portal run test --run` passed: 1 file, 20 tests.
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest 66/66 suites and 279/279 tests, Admin Vitest 22/22 tests, Merchant Vitest 16/16 tests, Portal Vitest 20/20 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` exited 0. It printed Windows LF/CRLF working-copy warnings only before this docs evidence update.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/start-docker-runtime.ps1` rebuilt API/Admin/Merchant/Portal and restarted Docker runtime.
- Served Portal bundle `/assets/index-YgcYkOsy.js` contained `福利卡抵扣`, `线上补差`, and `选择支付宝支付渠道`, and did not contain `现金`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Browser/CDP verification at `http://localhost:5175/` opened prepared order `ORDER-20260609101655619-9C64PU`, rendered `福利卡抵扣 ¥10.00` and `线上补差 ¥59.90`, selected Alipay, created a payment showing `支付宝 · 待支付`, and did not render `现金`.

### Task 4: Completion

- [ ] Commit feature work on `codex/portal-online-payment-channel-boundary`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks.
- [ ] Merge PR to `main`.
- [ ] Open docs-only completion PR marking this plan complete after the feature merge.
