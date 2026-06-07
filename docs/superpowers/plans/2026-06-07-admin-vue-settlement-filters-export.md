# Admin Vue Settlement Filters And Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore Admin Vue settlement controls that were missing after the React to Vue migration: settlement status switching, merchant lookup, and CSV export for the currently loaded settlement statements.

**Architecture:** Keep Admin as Vue 3 + Vite + Element Plus. Reuse the existing settlement statement read API and Admin CSV builder. Do not add new backend endpoints, change payout semantics, change Merchant/Portal, or target-environment deployment in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Admin Settlement Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Assert Admin settlement status and merchant controls**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because the Admin Vue settlement panel does not expose a settlement merchant ID input or paid-offline status button.

- [x] **Step 2: Assert Admin settlement CSV export action**

Expected: FAIL because the Admin Vue settlement panel does not expose a `导出结算CSV` button.

### Task 2: Implement Admin Settlement Parity

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Track active settlement status and merchant filter**
- [x] **Step 2: Render generated, paid-offline, and all settlement status controls**
- [x] **Step 3: Render settlement merchant lookup input and query button**
- [x] **Step 4: Render CSV export button backed by the existing Admin settlement CSV builder**
- [x] **Step 5: Preserve active settlement filters after payout confirmation and generated-statement reloads**

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
feat: restore admin settlement filters export
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Admin Vue users can inspect generated, paid-offline, or all settlement statements by merchant and export the current loaded settlement list as CSV. It does not implement server-side export endpoints, payout evidence uploads, payout reversal, Merchant changes, Portal changes, target-environment deployment, true-device checks, or formal business acceptance.
