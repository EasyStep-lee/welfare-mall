# Merchant Product Draft Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first merchant product draft editor so merchants can create a complete product master draft before submitting it for review.

**Architecture:** Keep this slice inside the existing Merchant React app and reuse `POST /api/products/drafts/save`. The editor will build one complete draft payload from business-facing fields and refresh the draft queue after save; tenant scoping, upload widgets, and multi-SKU editing remain later slices.

**Tech Stack:** Vite, React, TypeScript, Vitest, Testing Library, existing NestJS draft save API.

---

## File Structure

- Modify: `apps/merchant/src/api.ts` to add draft payload types and `saveProductDraft`.
- Modify: `apps/merchant/src/App.tsx` to add the draft editor panel and save action.
- Modify: `apps/merchant/src/App.test.tsx` to cover the save-draft request payload and success state.
- Modify: `apps/merchant/src/styles.css` to style the editor without hiding core product fields.

## Task 1: RED Merchant Draft Save UI

- [x] **Step 1: Write failing UI test**

Add a test that renders the Merchant app, fills 商品编码, 商品名称, 售价, 主图, 详情图, 资质文件, 商品参数, and 详情图文, clicks `保存草稿`, and asserts `fetch` posts to `/api/products/drafts/save` with a complete `payload` and `actorUserId: merchant-user-001`.

- [x] **Step 2: Run focused test**

Run: `pnpm --filter @welfare-mall/merchant run test -- --run`

Expected: FAIL because the draft editor and `saveProductDraft` client do not exist.

## Task 2: GREEN Merchant Draft Editor

- [x] **Step 1: Add API client**

Add `ProductDraftPayload` and `saveProductDraft` in `apps/merchant/src/api.ts`.

- [x] **Step 2: Add editor UI**

Add a visible editor section with compact fields for product code, name, origin, SKU price, main image, detail image, qualification file, parameter, and detail text. Use fixed local business IDs for the current no-login slice:

- `merchantId: merchant-001`
- `franchiseId: franchise-001`
- `categoryId: category-rice`
- `brandId: brand-rice`

- [x] **Step 3: Run focused test**

Run: `pnpm --filter @welfare-mall/merchant run test -- --run`

Expected: PASS.

## Task 3: Verification And GitHub

- [x] **Step 1: Run verification**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; only Windows line-ending warnings are acceptable.

- [x] **Step 2: Runtime check**

Start API and Merchant dev servers as needed, then verify:

```powershell
curl.exe -i --max-time 10 http://localhost:5174
curl.exe -i --max-time 10 -H "Origin: http://localhost:5174" http://localhost:3000/api/health
```

Expected: Merchant shell returns 200 and API responds with `Access-Control-Allow-Origin: http://localhost:5174`.

- [x] **Step 3: Commit, push, PR, merge**

Commit on `codex/merchant-product-draft-editor`, push, create a PR to `main`, merge after it is mergeable, and fast-forward local `main`.

## Acceptance Boundary

This slice proves local merchant draft creation against the existing API contract. It does not implement login, merchant tenant selection, real file upload, rich text editing, multiple SKUs, target-environment deployment, or business acceptance.
