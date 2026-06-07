# Admin Vue Review Publish Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Close the Admin Vue product review-to-publish workflow so pending products cannot be published directly, approved products can be loaded from the approved queue, and only approved products expose the publish-to-pool action.

**Architecture:** Keep Admin as Vue 3 + Vite + Element Plus. Reuse the existing review queue, review decision, and product-pool publish APIs. Do not add new endpoints, product editing, upload handling, or Merchant changes in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Admin Review Publish Flow Test

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Assert pending reviews do not expose direct publish**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because the current pending review row incorrectly shows `发布商品池`.

- [x] **Step 2: Assert approve reloads the approved queue and publishes from there**

Expected: FAIL until approving a product requests `status=approved` and the approved row exposes the publish action.

### Task 2: Implement Review Queue Status Flow

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Track the active review queue status**
- [x] **Step 2: Render pending, approved, and rejected queue controls**
- [x] **Step 3: Show approve/reject only for pending products**
- [x] **Step 4: Show publish only for approved products**
- [x] **Step 5: Reload approved or rejected queues after review decisions**

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests and typecheck**

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification and Docker smoke**

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [x] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore admin review publish flow
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Admin Vue users can move products from pending review to approved review and publish approved products to the product pool. It does not implement review-side editing, product-pool catalog management, dynamic filters beyond review status, target-environment deployment, true-device checks, or formal business acceptance.
