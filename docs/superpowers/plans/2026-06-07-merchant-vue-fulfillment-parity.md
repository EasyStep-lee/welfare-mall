# Merchant Vue Fulfillment Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore Merchant Vue fulfillment controls that were lost during the React to Vue migration: status switching, order/task lookup, pickup-code completion, and read-only completed history.

**Architecture:** Keep Merchant as Vue 3 + Vite + Element Plus. Reuse the existing merchant fulfillment read and completion APIs, including their existing `status`, `orderNo`, `taskNo`, and optional `pickupCode` contract. Do not add new endpoints, Admin changes, settlement changes, or target-environment deployment in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Merchant Fulfillment Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Assert fulfillment status and lookup controls**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run
```

Expected: FAIL because the current Merchant Vue fulfillment panel does not expose order number, task number, or completed status controls.

- [x] **Step 2: Assert pickup fulfillment sends the visible pickup code**

Expected: FAIL until pickup orders render a pickup-code input and completion posts `pickupCode`.

- [x] **Step 3: Assert completed fulfillment history is read-only**

Expected: FAIL until completed orders do not expose the confirm-completion button.

### Task 2: Implement Merchant Fulfillment Parity

**Files:**
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Track active fulfillment status and lookup filters**
- [x] **Step 2: Render paid/completed status controls**
- [x] **Step 3: Render order number and task number lookup inputs**
- [x] **Step 4: Render pickup-code input for pending pickup tasks**
- [x] **Step 5: Send pickup code when completing pickup tasks and reload the active fulfillment view**
- [x] **Step 6: Keep completed fulfillment records read-only**

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

- [x] **Step 3: Commit, push, open PR, and merge**

Commit message:

```text
feat: restore merchant fulfillment controls
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Merchant Vue users can query pending/completed fulfillment tasks, complete pickup orders with a pickup code, and inspect completed fulfillment history without mutation controls. It does not implement merchant settlement filtering, Admin order filters, target-environment deployment, true-device checks, or formal business acceptance.
