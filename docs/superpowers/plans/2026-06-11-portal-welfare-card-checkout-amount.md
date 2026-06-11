# Portal Welfare Card Checkout Amount Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Portal buyers choose a welfare-card debit amount during checkout so created orders preserve the intended welfare-card plus online WeChat/Alipay split.

**Architecture:** Keep the existing API checkout contract for this slice: Portal sends `welfareCardPaymentAmount` as an integer cent amount. Add a small RMB input in the product detail checkout panel, validate it locally before order creation, and keep payment creation using the persisted order split returned by the API.

**Tech Stack:** Vue 3 + Vite Portal, Vitest component tests, Docker served bundle verification, in-app browser runtime verification.

**Business Constraints:** Franchise remains the seller and welfare-card issuer. Merchant remains the product publisher and fulfillment party. User cash remainder is online WeChat/Alipay only; no offline cash channel and no shop/store subject are introduced. Welfare-card balance ownership and insufficient-balance checks remain enforced by the API when creating the payment.

**Out of Scope:** Welfare-card account selection, buyer balance query, Franchise console issuing UI, user card binding UI, component payment schema migration, refund-to-card implementation, and mini-program parity.

---

### Task 1: RED Portal Checkout Amount Tests

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Require selected welfare-card amount in checkout payload**

Update the Portal checkout test to:
- enter `10.00` into an input labeled `福利卡抵扣金额`
- click `立即下单`
- assert the checkout request body contains `welfareCardPaymentAmount: 1000`
- assert the visible checkout panel shows `线上补差 ¥59.90`

- [x] **Step 2: Require local validation before checkout**

Add a test that enters `80.00` for a `¥69.90` item, clicks `立即下单`, and asserts:
- no `/orders` POST is made
- the UI shows `福利卡抵扣金额不能超过商品金额`

- [x] **Step 3: Verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "welfare-card checkout amount"
```

Expected:
- tests fail because the input and checkout split behavior do not exist yet.

Evidence:
- RED failed as expected because `input[aria-label="福利卡抵扣金额"]` did not exist in the current checkout panel.

### Task 2: GREEN Portal Checkout Amount

**Files:**
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add checkout welfare-card amount state**

Add a string state for the RMB input, reset it when closing/reopening product details, and parse it into integer cents with two-decimal support.

- [x] **Step 2: Show the selected split in the checkout panel**

Render:
- `福利卡抵扣金额` input
- `福利卡抵扣 ¥x.xx`
- `线上补差 ¥y.yy`

Do not render `现金`.

- [x] **Step 3: Validate before creating the order**

Before `createPortalOrder()`:
- reject non-numeric or negative inputs with `福利卡抵扣金额必须为非负金额`
- reject amounts greater than the selected item price with `福利卡抵扣金额不能超过商品金额`
- send the parsed cent amount as `welfareCardPaymentAmount`

- [x] **Step 4: Verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "welfare-card checkout amount"
```

Expected:
- focused tests pass.

Evidence:
- First GREEN attempt exposed the root cause that Vue applies numeric casting for `v-model` on `type="number"` inputs, so the RMB amount input was changed to `type="text"` with `inputmode="decimal"` and explicit parsing.
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "welfare-card checkout amount"` passed with 2 focused tests.

### Task 3: Verification

- [x] Run full Portal component tests.
- [x] Run Portal typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker Portal served bundle.
- [x] Verify served bundle on `http://localhost:5175/` contains the welfare-card checkout amount labels and does not introduce `现金`.
- [x] Verify browser behavior on `http://localhost:5175/`: login, open product detail, enter welfare-card amount, create order, open order detail, confirm the split displays correctly.
- [x] Run Docker runtime/page smoke checks.

Evidence:
- Focused RED/GREEN command passed after implementation with 2 welfare-card checkout amount tests.
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts` passed with 25 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:business-boundary` passed with 27 known deviation files tracked.
- `pnpm run verify` passed across frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest. The first 300s run timed out at the tool boundary without failure output; the rerun with a longer timeout exited 0.
- Docker Portal image was rebuilt and `welfare-mall-v2-portal` restarted healthy on port 5175.
- Served Portal bundle `/assets/index-NxncA4HW.js` contains `福利卡抵扣金额` and `线上补差`, and does not contain `现金`.
- Browser verification on `http://localhost:5175/` confirmed the product detail checkout panel accepted `10.00`, displayed `福利卡抵扣 ¥10.00` and `线上补差 ¥59.90`, created order `ORDER-20260611121925984-8D0EW6`, opened order detail, created payment `PAY-20260611121927965-RYYZ1A`, and console error logs were empty. Browser automation input required keypress fallback because the in-app browser `fill`/`type` path hit a known virtual-clipboard runtime issue.
- Live API detail for `ORDER-20260611121925984-8D0EW6` returned `totalAmount=6990`, `welfareCardPayableAmount=1000`, `cashPayableAmount=5990`, `salesFranchiseId=franchise-local-review`, `fulfillmentMerchantId=merchant-local-review`, and latest payment channel `wechat` with the same split.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- `git diff --check` exited 0 with Windows LF/CRLF working-copy warnings only.

### Task 4: Completion

- [x] Commit feature work on `codex/portal-welfare-card-checkout-amount`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature commit `68be2fc feat: allow portal welfare card checkout amount` was pushed to `codex/portal-welfare-card-checkout-amount`.
- PR #279 `feat: allow portal welfare card checkout amount` passed `Project docs check`, including `docs-check` and `project-foundation-check`.
- PR #279 was squash-merged to `main` as `ca5ad0c`.
- Docs completion branch `codex/docs-portal-welfare-card-checkout-amount-complete` records this plan as complete after the feature merge.
