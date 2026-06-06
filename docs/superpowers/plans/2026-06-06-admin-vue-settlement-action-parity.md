# Admin Vue Settlement Action Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore core Admin settlement actions on the Vue 3 + Element Plus foundation.

**Architecture:** Keep the Vue Admin runtime and existing Admin API client. Add lightweight local controls for generating a merchant settlement statement and confirming offline payout for generated statements. Reuse `generateSettlementStatement` and `confirmSettlementOfflinePayout`; refresh the settlement statement list after each action. This slice does not add order payment/refund callbacks, CSV export, or new settlement backend behavior.

**Tech Stack:** Vue 3, TypeScript, Element Plus, Vitest, @vue/test-utils.

---

### Task 1: Write Failing Admin Settlement Action Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Add failing tests for settlement generation and offline payout**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
```

Expected: FAIL because the Vue settlement panel does not call statement generation or offline payout APIs yet.

### Task 2: Implement Vue Settlement Action Wiring

**Files:**
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Wire settlement generation**

Clicking `生成结算单` posts the fixed local merchant context, refreshes generated statements, and shows a success message.

- [x] **Step 2: Wire offline payout confirmation**

Clicking `确认线下打款` posts the statement number, deterministic local paid-at time, payout reference, and remark, then refreshes generated statements and shows a success message.

- [x] **Step 3: Display payout trace fields**

Render payout reference and remark when settlement statements include them.

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
feat: restore admin Vue settlement actions
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
