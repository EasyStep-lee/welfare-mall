# Admin Vue Action Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore core Admin product-review actions on the Vue 3 + Element Plus foundation.

**Architecture:** Keep the Vue runtime foundation and existing Admin API client. Wire the existing review buttons to `decideProductReview` and `publishProductToPool`, refresh the pending review queue after each action, and show a clear success message. This slice does not add settlement, refund, order, or inventory write actions.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, @vue/test-utils.

---

### Task 1: Write Failing Admin Action Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Add failing tests for Admin product actions**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
```

Expected: FAIL because the Vue buttons do not call product review decisions or product-pool publish APIs yet.

### Task 2: Implement Vue Action Wiring

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Wire review approval**

Clicking `通过审核` posts an approve decision with the Admin actor, refreshes the pending review queue, and shows a success message.

- [x] **Step 2: Wire review rejection**

Clicking `驳回审核` posts a reject decision with a default rejection reason, refreshes the pending review queue, and shows a success message.

- [x] **Step 3: Wire product-pool publish**

Clicking `发布商品池` posts the product publish command with the Admin actor and shows a success message.

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests and typecheck**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
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

- [ ] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore admin Vue action parity
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
