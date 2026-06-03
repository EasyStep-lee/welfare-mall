# Merchant Product Submission Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first merchant product submission workbench so merchants can see draft/rejected products and submit them into the Admin review queue.

**Architecture:** Add a focused Vite React merchant app that reuses the product review queue read model and the existing `POST /api/products/:productId/review-submissions` command. Keep this slice UI-only plus root verification wiring; login, merchant scoping, and product editing remain future branches.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, NestJS API contract.

---

## File Structure

- Create: `apps/merchant/package.json` for the merchant workspace package.
- Create: `apps/merchant/index.html` for the Vite entry.
- Create: `apps/merchant/tsconfig.json` and `apps/merchant/tsconfig.node.json` for TypeScript.
- Create: `apps/merchant/vite.config.ts` for React and Vitest setup on port 5174.
- Create: `apps/merchant/src/test/setup.ts` for Testing Library matchers.
- Create: `apps/merchant/src/api.ts` for product queue and submit-review client functions.
- Create: `apps/merchant/src/App.tsx` for the merchant product submission workbench.
- Create: `apps/merchant/src/main.tsx` for React bootstrap.
- Create: `apps/merchant/src/styles.css` for the workbench layout.
- Create: `apps/merchant/src/App.test.tsx` for merchant workflow behavior.
- Modify: `package.json` to include merchant lint, typecheck, test, and build in root verification.

## Task 1: RED Merchant UI Contract

- [x] **Step 1: Create package and test scaffold**

Create merchant package/config files and `apps/merchant/src/App.test.tsx` that imports `App` and asserts:

- draft/rejected product rows render with merchant-facing labels
- SKU, image, qualification, parameter, and detail-section readiness is visible
- clicking `提交审核` posts `actorUserId` to the submit-review endpoint

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @welfare-mall/merchant run test -- --run`

Expected: FAIL because `apps/merchant/src/App.tsx` does not exist.

## Task 2: GREEN Merchant Workbench

- [x] **Step 1: Add API client**

Implement `fetchMerchantSubmissionQueue(status)` against `/api/products/review-queue?status=draft|rejected` and `submitProductForReview(productId, actorUserId)` against `/api/products/:productId/review-submissions`.

- [x] **Step 2: Add React app**

Implement a single operational screen with:

- status tabs for `草稿` and `已驳回`
- a compact product table with main image, category, origin, and completeness counts
- a selected-product detail panel with brand, parameters, and detail-image readiness
- a visible `提交审核` button for each listed product
- success/error notices and refresh behavior

- [x] **Step 3: Run focused test**

Run: `pnpm --filter @welfare-mall/merchant run test -- --run`

Expected: PASS.

## Task 3: Root Verification And Runtime Check

- [x] **Step 1: Wire root scripts**

Update root `lint`, `typecheck`, `test`, and `build` scripts to include `@welfare-mall/merchant`.

- [x] **Step 2: Run checks**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; `git diff --check` reports no whitespace errors.

- [x] **Step 3: Runtime check**

Start merchant dev server on port 5174 and verify `http://localhost:5174` returns the merchant HTML shell.

## Acceptance Boundary

This slice proves the merchant-facing product submission workbench locally and wires it into root verification. It does not implement login, merchant tenant scoping, product editing, image upload, true browser click automation, WeChat flows, target-environment deployment, or business acceptance.
