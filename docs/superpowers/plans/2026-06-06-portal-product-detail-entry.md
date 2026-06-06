# Portal Product Detail Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Portal product detail entry from the existing product-pool catalog so local buyers can inspect product master data before moving to checkout or mini-program flows.

**Architecture:** Keep Portal as Vue 3 + Vite. Extend the existing Portal API client with `GET /api/product-pools/items/:itemId`, make catalog cards actionable, and render a compact detail panel using backend product master snapshots. This slice is read-only and does not create web checkout orders.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Portal Detail Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Add failing test for opening product detail**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- src/App.test.ts --run
```

Expected: FAIL because catalog cards do not fetch or render product detail yet.

### Task 2: Implement Portal Detail Entry

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add product pool item detail API client**

- [x] **Step 2: Make product cards actionable**

- [x] **Step 3: Render product master detail panel**

- [x] **Step 4: Preserve loading and error states**

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- src/App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
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
feat: add Portal product detail entry
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
