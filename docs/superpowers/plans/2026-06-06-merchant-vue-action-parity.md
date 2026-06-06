# Merchant Vue Action Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore core Merchant console actions on the new Vue 3 + Element Plus foundation.

**Architecture:** Keep the Vue runtime foundation from PR #175. Reuse the existing Merchant API client functions instead of introducing a parallel network layer. Wire Vue buttons to the same business commands used by the previous Merchant flow: fulfillment completion, product review submission, and product draft save.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Pinia, Vitest, @vue/test-utils.

---

### Task 1: Write Failing Merchant Action Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Add failing tests for Merchant actions**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- src/App.test.ts --run
```

Expected: FAIL because the Vue buttons do not call `completeMerchantFulfillmentOrder`, `submitProductForReview`, or `saveProductDraft` yet.

### Task 2: Implement Vue Action Wiring

**Files:**
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Wire fulfillment completion**

Clicking `确认完成` posts merchant context to the fulfillment completion endpoint, refreshes fulfillment orders, and shows a success message.

- [x] **Step 2: Wire product review submission**

Clicking `提交审核` posts the merchant actor to the product review submission endpoint, refreshes draft queue, and shows a success message.

- [x] **Step 3: Wire product draft save**

Clicking `保存草稿` builds a complete product draft payload from visible merchant-facing fields and posts it through the existing API client.

### Task 3: Verification

- [x] **Step 1: Run focused Merchant tests and typecheck**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test --run
pnpm --filter @welfare-mall/merchant run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification and Docker smoke**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [x] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore merchant Vue action parity
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
