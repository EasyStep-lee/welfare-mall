# Admin Settlement Merchant Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Admin settlement statement generation dependence on a frontend-fixed merchant ID by requiring the visible settlement merchant input to drive generation.

**Architecture:** Keep the existing Admin Vue settlement panel and settlement API contract. The `结算商户ID` field remains the temporary local operator input until department-scoped merchant selectors are introduced. `generateSettlement()` reads the current visible field value, blocks empty input locally, and refreshes the statement list with the same merchant scope after generation.

**Business Constraints:** Merchant remains the fulfillment and settlement recipient party. Admin settlement generation must target the merchant explicitly selected or entered by the platform operator, not a hidden local default. This slice does not introduce shop/store semantics, offline customer cash payment, or a new settlement ledger model.

**Out of Scope:** Formal department-scoped merchant selector data, Admin role/department management screens, franchise settlement console, welfare-card issuance UI, combination payment components, refund split, and replacing remaining local merchant filters in order/inventory views.

---

### Task 1: RED Admin Settlement Merchant Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Require settlement generation to use the visible merchant field**

Update the settlement generation test to enter `merchant-settlement-scope-009` in `结算商户ID` before clicking `生成结算单`, and assert the POST body uses that merchant ID.

- [x] **Step 2: Verify RED for the fixed local merchant default**

Run the focused test and confirm it fails because the request body still contains `merchant-local-review`.

- [x] **Step 3: Require empty merchant input to block generation**

Add a test that clicks `生成结算单` with an empty `结算商户ID`, asserts no generation POST is sent, and asserts the UI shows `请先输入结算商户ID`.

Evidence:
- Initial focused RED failed because `generateSettlement()` still posted `{ merchantId: 'merchant-local-review' }` after the test entered `merchant-settlement-scope-009`.
- Empty-input RED failed because the button still sent a POST to `/settlements/merchant-statements/generate`.

### Task 2: GREEN Admin Settlement Merchant Wiring

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Remove the fixed settlement merchant constant**

Delete the frontend `localSettlementMerchantId` constant from Admin Vue.

- [x] **Step 2: Generate settlement from current visible merchant input**

Use `settlementMerchantId.value.trim()` as the `merchantId` passed to `generateSettlementStatement`.

- [x] **Step 3: Block empty merchant input locally**

If the trimmed merchant ID is empty, set `error.value` to `请先输入结算商户ID`, clear the success message, and return without calling the API.

- [x] **Step 4: Refresh with the same merchant scope**

After a successful generation, reload generated statements using the current merchant filter so the UI stays scoped to the same merchant.

Evidence:
- Focused Admin settlement generation tests passed after implementation.

### Task 3: Boundary Documentation

**Files:**
- Modify: `docs/business-boundary-known-deviations.json`

- [x] **Step 1: Remove settlement merchant default from the Admin App deviation**

Update the Admin Vue deviation text so it tracks remaining local text inputs, not hidden local merchant defaults.

- [x] **Step 2: Keep the next action focused on scoped selectors**

Leave the next action pointing at authenticated Admin permissions and department-scoped business selectors.

### Task 4: Verification

- [x] Run focused Admin settlement tests.
- [x] Run Admin full component tests.
- [x] Run Admin typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker Admin served bundle.
- [x] Verify source, served bundle, and browser behavior on `http://localhost:5173/`.
- [x] Run Docker runtime and page smoke checks.

Evidence:
- Focused Admin settlement generation RED failed first because the POST body still sent `merchant-local-review`; the same focused test passed after implementation.
- Empty-input RED failed because the button still posted to `/settlements/merchant-statements/generate`; the same focused test passed after implementation.
- `pnpm --filter @welfare-mall/admin test -- --run src/App.test.ts --testNamePattern "generates a settlement statement|requires a visible settlement merchant"` passed: 2 tests.
- `pnpm --filter @welfare-mall/admin test -- --run src/App.test.ts` passed: 19 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (29 known deviation files tracked).`
- `pnpm run verify:frontend-stack` passed.
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- `docker compose build admin` and `docker compose up -d admin` completed; `docker compose ps admin` reported healthy on port 5173.
- Served bundle `http://localhost:5173/assets/index-BZwmHDTb.js` contains `请先输入结算商户ID`, does not contain `merchant-local-review`, and does not contain the test-only `merchant-settlement-scope-009`.
- Browser verification on `http://localhost:5173/` showed Admin settlement panel, clicking `生成结算单` with an empty merchant ID displayed `请先输入结算商户ID`, and no console errors were reported.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 5: Completion

- [ ] Commit feature work on `codex/admin-settlement-merchant-input`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks and merge.
- [ ] Create docs-only completion PR after feature merge.
