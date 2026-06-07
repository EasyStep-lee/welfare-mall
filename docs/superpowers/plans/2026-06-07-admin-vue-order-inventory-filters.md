# Admin Vue Order And Inventory Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore Admin Vue order and inventory lookup controls that were missing after the React to Vue migration: order status, fulfillment status, merchant/task lookup, reservation status/order lookup, and stock merchant/product/SKU lookup.

**Architecture:** Keep Admin as Vue 3 + Vite + Element Plus. Reuse the existing Admin read-model APIs and their existing query parameters. Do not add new backend endpoints, payment state transitions, Merchant changes, Portal changes, or target-environment deployment in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Admin Filter Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Assert Admin order filter controls**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because the Admin Vue order panel does not expose merchant ID, task number, order status, or fulfillment status controls.

- [x] **Step 2: Assert Admin inventory filter controls**

Expected: FAIL because the inventory reservation and stock panels do not expose reservation status, merchant, order, product, or SKU lookup controls.

### Task 2: Implement Admin Filter Parity

**Files:**
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/admin/src/styles.css`

- [x] **Step 1: Track active order, reservation, and stock filter state**
- [x] **Step 2: Render order status, fulfillment status, merchant ID, and task number controls**
- [x] **Step 3: Render inventory reservation status, merchant ID, and order number controls**
- [x] **Step 4: Render stock merchant ID, product ID, and SKU ID controls**
- [x] **Step 5: Preserve active filters when order payment/refund actions reload read models**
- [x] **Step 6: Add responsive layout styling for the new filter controls**

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

- [ ] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore admin order inventory filters
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Admin Vue users can filter orders, fulfillment progress, inventory reservations, and inventory stock balances through visible controls wired to the existing API query contract. It does not implement new order actions, settlement filtering, Merchant changes, Portal changes, target-environment deployment, true-device checks, or formal business acceptance.
