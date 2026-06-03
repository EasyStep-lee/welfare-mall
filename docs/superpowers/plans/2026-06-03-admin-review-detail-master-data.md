# Admin Review Detail Master Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Admin reviewers see concrete product master-data details, not only counts, when reviewing merchant product submissions.

**Architecture:** Extend the existing `GET /api/products/review-queue` response with compact detail summaries for the first SKU, media list, qualification list, parameter list, and detail section list. Keep the Admin UI inside the existing detail panel and render business-facing labels; do not add editing, uploads, multi-step review flows, or new endpoints in this slice.

**Tech Stack:** NestJS, Prisma, React, TypeScript, Vitest, Testing Library, Jest, Supertest.

---

## File Structure

- Modify: `apps/api/src/product/product-review-queue.repository.ts` to select and map detail summaries.
- Modify: `apps/api/test/product-review-queue.e2e-spec.ts` to lock the API response contract.
- Modify: `apps/admin/src/api.ts` to type the new fields.
- Modify: `apps/admin/src/App.tsx` to render the Admin detail panel sections.
- Modify: `apps/admin/src/App.test.tsx` to prove the UI displays concrete SKU/media/qualification/parameter/detail content.
- Modify: `apps/admin/src/styles.css` to keep the detail panel readable.

## Task 1: RED API Review Queue Detail Contract

- [x] **Step 1: Write failing API contract expectations**

Update `apps/api/test/product-review-queue.e2e-spec.ts` so the mocked queue item and response assertion include:

- `primarySku: { code: 'SKU-RICE-5KG', priceAmount: 6990, marketPriceAmount: 7990, specText: '规格: 5kg' }`
- `media: [{ type: 'main_image', url: 'https://img.example.com/rice-cover.jpg', sortOrder: 1 }]`
- `qualifications: [{ type: 'origin_certificate', title: '产地证明', certificateNo: 'CERT-RICE-001', fileUrl: 'https://img.example.com/certs/rice.pdf' }]`
- `parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }]`
- `detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]`

- [x] **Step 2: Run focused API contract test**

Run:

```powershell
pnpm --filter @welfare-mall/api exec jest --config jest.config.ts test/product-review-queue.e2e-spec.ts --runInBand
```

Expected: FAIL until the current mocked contract and controller response expectations include the new fields.

## Task 2: RED Admin Detail UI Contract

- [x] **Step 1: Write failing Admin UI test**

Update `apps/admin/src/App.test.tsx` so `reviewQueueResponse.items[0]` includes the new detail fields from Task 1, then assert the rendered page contains:

- `SKU-RICE-5KG`
- `销售价 ¥69.90`
- `主图`
- `产地证明`
- `净含量: 5kg`
- `福利说明`
- `适合企业福利发放`

- [x] **Step 2: Run focused Admin test**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because the Admin detail panel still only renders aggregate counts.

## Task 3: GREEN API Detail Summaries

- [x] **Step 1: Add review queue item detail types**

In `apps/api/src/product/product-review-queue.repository.ts`, extend `ProductReviewQueueItem` with `primarySku`, `media`, `qualifications`, `parameters`, and `detailSections`.

- [x] **Step 2: Select detail records from Prisma**

In the `findMany` `select`, add:

- first SKU ordered by `createdAt asc`, selecting `code`, `priceAmount`, `marketPriceAmount`, and `specs`
- media ordered by `sortOrder asc`, selecting `type`, `url`, and `sortOrder`
- qualifications ordered by `createdAt asc`, selecting `type`, `title`, `certificateNo`, and `fileUrl`
- parameters ordered by `sortOrder asc`, selecting `groupName`, `name`, `value`, `valueType`, and `sortOrder`
- detailSections ordered by `sortOrder asc`, selecting `type`, `title`, `content`, and `sortOrder`

- [x] **Step 3: Map records into business summaries**

Map the selected records into the new response fields. Convert SKU specs to the same `规格: 5kg / 颜色: 红色` text format used by `buildSkuSummary`.

- [x] **Step 4: Run focused API contract test**

Run:

```powershell
pnpm --filter @welfare-mall/api exec jest --config jest.config.ts test/product-review-queue.e2e-spec.ts --runInBand
```

Expected: PASS.

## Task 4: GREEN Admin Detail Panel

- [x] **Step 1: Extend Admin API types**

Add matching fields to `ReviewQueueItem` in `apps/admin/src/api.ts`.

- [x] **Step 2: Render detail sections**

Update `apps/admin/src/App.tsx` detail panel to show:

- SKU code, spec text, and price
- media labels with URLs
- qualification title and certificate number
- parameter name/value
- detail section title/content

- [x] **Step 3: Add compact styles**

Update `apps/admin/src/styles.css` with small list/card styles inside the existing detail panel.

- [x] **Step 4: Run focused Admin test**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

## Task 5: Verification And GitHub

- [x] **Step 1: Run full verification**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; Windows CRLF warnings are acceptable.

- [x] **Step 2: Runtime check**

Start or reuse API/Admin dev servers, then verify:

```powershell
curl.exe -i --max-time 10 http://localhost:5173
curl.exe -i --max-time 10 -H "Origin: http://localhost:5173" "http://localhost:3000/api/products/review-queue?status=pending_review"
```

Expected: Admin shell returns 200, and API responds with `Access-Control-Allow-Origin: http://localhost:5173`.

- [ ] **Step 3: Commit, push, PR, merge**

Commit on `codex/admin-review-detail-master-data`, push to GitHub, create a PR to `main`, merge after it is mergeable, and fast-forward local `main`.

## Acceptance Boundary

This slice proves reviewers can inspect concrete product master data in the local Admin review panel. It does not implement merchant login, real upload previews, rich text rendering, review-side editing, target-environment deployment, true-device checks, or formal business acceptance.
