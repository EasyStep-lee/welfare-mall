# Admin Vue Review Master Data Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore Admin Vue product review visibility so reviewers can inspect the product master data already returned by the review queue API.

**Architecture:** Keep Admin as Vue 3 + Vite + Element Plus. Render the existing `ReviewQueueItem` category, brand, origin, SKU, media, qualification, parameter, and detail-section fields inside the current review item row. Do not add new endpoints, editing, upload flows, or review workflow changes in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Admin Review Detail Test

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Assert visible review master-data details**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
```

Expected: FAIL because the current Admin Vue review panel does not render concrete qualification, parameter, media, and detail-section content.

### Task 2: Implement Admin Review Detail Rendering

**Files:**
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/admin/src/styles.css`

- [x] **Step 1: Render category, brand, and origin summaries**
- [x] **Step 2: Render SKU, media, qualification, parameter, and detail sections**
- [x] **Step 3: Keep empty-state fallback labels for optional arrays**
- [x] **Step 4: Keep the existing review action buttons unchanged**

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests and typecheck**

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
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
feat: show admin review master data details
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Admin Vue reviewers can inspect existing product master-data snapshots. It does not implement review-side editing, real upload previews, target-environment deployment, true-device checks, or formal business acceptance.
