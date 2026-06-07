# Portal Checkout Create Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Connect the local Portal product detail page to the existing order checkout API so a user can create a pending-payment order directly from a product-pool item.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse `POST /api/orders` and the existing product-pool item detail. This slice uses fixed local buyer and delivery data for local runtime proof only. Do not add payment creation, order list/detail pages, address books, authentication changes, mini-program changes, Admin changes, or target-environment deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Portal Checkout Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert visible checkout action from product detail**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because the Portal detail page does not expose a `立即下单` action.

- [x] **Step 2: Assert checkout posts to the order API and renders the created order**

Expected: FAIL until the Portal creates an order with the selected product-pool item and displays the returned order number.

### Task 2: Implement Portal Checkout Action

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add a typed Portal order checkout API client**
- [x] **Step 2: Render a local checkout block in the product detail panel**
- [x] **Step 3: Submit one selected product-pool item as quantity 1 with fixed local buyer and delivery data**
- [x] **Step 4: Show loading, success, and error states without disrupting existing detail rendering**

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification and Docker/browser smoke**

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

- [ ] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: connect portal checkout order create
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal users can create a pending-payment order from a visible product detail using the existing checkout API. It does not implement payment initiation, order list/detail navigation, editable delivery address, buyer login, mini-program DevTools acceptance, target-environment deployment, true-device checks, or formal business acceptance.
