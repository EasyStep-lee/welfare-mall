# Merchant Vue Draft Master Data Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Restore the Merchant Vue draft editor surface so merchants can see and edit the product master-data fields that are already sent to the product draft API.

**Architecture:** Keep Merchant as Vue 3 + Vite + Element Plus. Extend the existing local draft form in `apps/merchant/src/App.ts` without adding catalog lookup endpoints, uploads, rich-text editing, or authentication changes in this slice.

**Tech Stack:** Vue 3, Element Plus, TypeScript, Vitest, Vue Test Utils, jsdom.

---

### Task 1: Write Failing Merchant Draft Form Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Assert visible master-data fields**

Run:

```powershell
pnpm --filter @welfare-mall/merchant run test -- src/App.test.ts --run
```

Expected: FAIL because the current Merchant draft form only exposes code, name, and price.

- [x] **Step 2: Assert saved payload uses visible field values**

Expected: FAIL until editable origin, spec, media, qualification, parameter, and detail values flow into `saveProductDraft`.

### Task 2: Implement Merchant Draft Master Data Form

**Files:**
- Modify: `apps/merchant/src/App.ts`
- Modify: `apps/merchant/src/styles.css`

- [x] **Step 1: Add typed draft form fields**
- [x] **Step 2: Render category, brand, origin, spec, media, qualification, parameter, and detail controls**
- [x] **Step 3: Use edited field values when building `ProductDraftPayload`**
- [x] **Step 4: Keep layout responsive and readable on local 5174**

### Task 3: Verification

- [x] **Step 1: Run focused Merchant tests and typecheck**

```powershell
pnpm --filter @welfare-mall/merchant run test -- src/App.test.ts --run
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
feat: expose merchant draft master data form
```

- [x] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves the local Merchant Vue workbench exposes product master data and sends edited draft values through the existing API contract. It does not add dynamic category/brand catalogs, file upload storage, rich text editing, target-environment deployment, or formal business acceptance.
