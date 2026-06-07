# Merchant Vue Settlement Filters And Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore Merchant Vue settlement controls that were missing after the React to Vue migration: settlement status switching and CSV export for the currently loaded merchant settlement statements.

**Architecture:** Keep Merchant as Vue 3 + Vite + Element Plus. Reuse the existing merchant settlement statement read API and Merchant CSV builder. Do not add new backend endpoints, payout confirmation actions, Admin changes, Portal changes, or target-environment deployment in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Merchant Settlement Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Assert Merchant settlement status controls**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- App.test.ts --run
```

Expected: FAIL because the Merchant Vue settlement panel does not expose a paid-offline status button.

- [x] **Step 2: Assert Merchant settlement CSV export action**

Expected: FAIL because the Merchant Vue settlement panel does not expose a `导出结算CSV` button.

### Task 2: Implement Merchant Settlement Parity

**Files:**
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Track active merchant settlement status**
- [x] **Step 2: Render generated, paid-offline, and all settlement status controls**
- [x] **Step 3: Render CSV export button backed by the existing Merchant settlement CSV builder**
- [x] **Step 4: Preserve active settlement status when refreshing all Merchant read models**

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
feat: restore merchant settlement filters export
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Merchant Vue users can inspect generated, paid-offline, or all settlement statements for their fixed merchant context and export the current loaded settlement list as CSV. It does not implement merchant payout confirmation, server-side export endpoints, payout evidence uploads, Admin changes, Portal changes, target-environment deployment, true-device checks, or formal business acceptance.
