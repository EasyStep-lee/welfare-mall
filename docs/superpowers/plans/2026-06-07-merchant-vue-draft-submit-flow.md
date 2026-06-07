# Merchant Vue Draft Submit Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Close the Merchant Vue product draft workflow so a saved draft immediately appears in the draft queue with a visible submit-for-review action.

**Architecture:** Keep Merchant as Vue 3 + Vite + Element Plus. Reuse the existing draft save API and review queue API. Do not add new endpoints, uploads, authentication changes, or Admin review changes in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Merchant Draft Submit Flow Test

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Assert saved drafts refresh into the queue**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run
```

Expected: FAIL because saving a draft does not reload the draft queue, so the saved product has no visible submit action.

- [x] **Step 2: Assert the saved product can be submitted**

Expected: FAIL until the saved draft row is visible and its submit action posts to `/products/:productId/review-submissions`.

### Task 2: Implement Merchant Draft Queue Refresh

**Files:**
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Reload the `draft` queue after a successful draft save**
- [x] **Step 2: Keep the existing save payload and submit action contracts unchanged**

### Task 3: Verification

- [x] **Step 1: Run focused Merchant tests and typecheck**

```powershell
pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run
pnpm --filter @welfare-mall/merchant run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification and Docker smoke**

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [ ] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: refresh merchant draft queue after save
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Merchant Vue users can save a product draft and immediately submit the saved draft for Admin review. It does not implement rejected-draft tabs, Admin approved publishing, dynamic master-data pickers, target-environment deployment, true-device checks, or formal business acceptance.
