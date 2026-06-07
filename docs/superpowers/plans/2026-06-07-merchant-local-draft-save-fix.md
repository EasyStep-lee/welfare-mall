# Merchant Local Draft Save Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Fix the local Docker-backed Merchant Vue draft save flow so port 5174 can save product drafts against the seeded local master data, then show the submit-for-review entry. Also close the same local master-data drift in Admin's default settlement-generation action.

**Architecture:** Keep Admin and Merchant on Vue 3 + Vite + Element Plus. Keep the current product draft save, review submission, and settlement statement APIs. This slice only aligns local runtime context and hardens API error handling for missing product master-data references.

**Tech Stack:** Vue 3, Element Plus, TypeScript, NestJS, Prisma, Vitest, Jest, Docker Compose.

---

### Task 1: Reproduce and Isolate Root Cause

**Evidence:**
- API logs show `/api/products/drafts/save` fails with Prisma `P2003` on `Product.merchantId`.
- Current Docker seed contains `merchant-local-review`, `franchise-local-review`, `category-local-review`, and `brand-local-review`.
- Merchant Vue was posting stale IDs: `merchant-001`, `franchise-001`, `category-rice`, and `brand-rice`.

- [x] **Step 1: Capture Docker API failure and database master-data state**
- [x] **Step 2: Identify why the submit button is absent after failed save**

### Task 2: Write Failing Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`
- Modify: `apps/admin/src/App.test.ts`
- Modify: `apps/api/test/product-draft-save.e2e-spec.ts`

- [x] **Step 1: Assert Merchant uses the current local-review IDs for draft save, fulfillment, and settlement calls**
- [x] **Step 2: Assert API returns 400 instead of 500 when product draft master-data references are missing**
- [x] **Step 3: Assert Admin settlement generation uses the current local-review merchant ID**

### Task 3: Implement Fix

**Files:**
- Modify: `apps/merchant/src/App.ts`
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/api/src/product/product-draft-save.service.ts`

- [x] **Step 1: Align Merchant local runtime context to the current local-review seed**
- [x] **Step 2: Convert Prisma foreign-key errors during draft save into controlled 400 responses**
- [x] **Step 3: Align Admin settlement generation default merchant ID to the current local-review seed**

### Task 4: Verification

- [x] **Step 1: Run focused tests and typechecks**

```powershell
pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run
pnpm --filter @welfare-mall/api run test -- test/product-draft-save.e2e-spec.ts --runInBand
pnpm --filter @welfare-mall/merchant run typecheck
pnpm --filter @welfare-mall/api run typecheck
```

- [x] **Step 2: Run full verification and Docker runtime checks**

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [x] **Step 3: Browser-smoke port 5174**

Open `http://localhost:5174`, save a product draft, and verify the draft queue exposes `提交审核`.

Evidence:
- `pnpm run verify` passed after the Admin and Merchant source changes.
- `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed after rebuilding the runtime images.
- Browser smoke saved `P-LOCAL-BROWSER-*` drafts on port 5174 and verified `提交审核` was visible without a 500 error.
- Served 5173 and 5174 bundles contain the `*-local-review` IDs.

- [x] **Step 4: Commit, push, open PR, and merge**

Commit message:

```text
fix: align merchant local draft context
```

- [x] **Step 5: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Completion:
- Feature PR: `#205`
- Feature merge commit: `89807001226496a99dafee1809a7bfc9b58a6896`
- Docs completion branch: `codex/docs-merchant-local-draft-save-fix-complete`

## Acceptance Boundary

This slice proves the current local Docker runtime can save Merchant product drafts and expose the submit-for-review entry on port 5174. It does not implement dynamic merchant login, target-environment deployment, true-device acceptance, or new product master-data management surfaces.
