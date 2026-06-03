# Portal Product Pool Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real Portal application screen that consumes the product-pool catalog API and displays active pool products to visitors and enterprise customers.

**Architecture:** Scaffold `apps/portal` as an independent Vue 3 + Vite app. Keep API access in `src/api.ts`, render the product pool catalog in `App.vue`, and include the Portal package in root lint/typecheck/test/build scripts. The page reads `GET /api/product-pools/catalog`, displays product pool names and item snapshots, and preserves product master data as read-only display data from the backend.

**Tech Stack:** Vue 3, Vite, TypeScript, Vitest, Vue Test Utils, jsdom.

---

## File Structure

- Create: `apps/portal/package.json`
- Create: `apps/portal/index.html`
- Create: `apps/portal/vite.config.ts`
- Create: `apps/portal/tsconfig.json`
- Create: `apps/portal/src/main.ts`
- Create: `apps/portal/src/App.vue`
- Create: `apps/portal/src/api.ts`
- Create: `apps/portal/src/styles.css`
- Create: `apps/portal/src/App.test.ts`
- Create: `apps/portal/src/test/setup.ts`
- Modify: root `package.json` to include Portal in lint/typecheck/test/build.

## Task 1: RED Portal Catalog Contract

- [x] **Step 1: Add failing Portal test**

Create `apps/portal/src/App.test.ts` that stubs `fetch` and asserts the page:

- calls `http://localhost:3000/api/product-pools/catalog`
- renders pool name `默认商品池`
- renders product name `本地审核五常大米福利装`
- renders SKU `SKU-LOCAL-REVIEW-5KG`
- renders price `¥69.90`
- renders a clear empty state when no pool items exist

- [x] **Step 2: Run focused Portal test**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- --run
```

Expected: FAIL before implementation or dependencies are installed.

## Task 2: GREEN Portal Implementation

- [x] **Step 1: Scaffold Portal package**

Add Vue 3 package files, Vite config, TypeScript config, and test setup.

- [x] **Step 2: Add API client and page**

Implement:

- `fetchProductPoolCatalog()`
- loading, success, empty, and error states
- product pool header
- product item list using display snapshots from the API

- [x] **Step 3: Run focused Portal test**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- --run
```

Expected: PASS.

## Task 3: Root Verification Integration

- [x] **Step 1: Include Portal in root scripts**

Update root `lint`, `typecheck`, `test`, and `build` scripts so Portal is verified with Admin and Merchant.

- [x] **Step 2: Run verification**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; Windows LF/CRLF warnings are acceptable when exit code is 0.

## Task 4: Runtime Verification

- [x] **Step 1: Ensure product exists in product pool**

Use the local review product sample, approve it if needed, publish it to the product pool, and confirm:

```powershell
curl.exe -s "http://localhost:3000/api/product-pools/catalog"
```

Expected: response contains `本地审核五常大米福利装`, `SKU-LOCAL-REVIEW-5KG`, and `6990`.

- [x] **Step 2: Browser check**

Start or reuse the Portal dev server on port `5175`, open `http://localhost:5175/`, and confirm the same product pool fields are visible with no console errors.

## Task 5: GitHub

- [ ] **Step 1: Commit, push, PR, merge**

Commit on `codex/portal-product-pool-catalog`, push to GitHub, create a PR to `main`, merge after it is mergeable, and fast-forward local `main`.

## Acceptance Boundary

This slice proves local Portal product-pool catalog rendering against the existing API. It does not implement Portal decoration, search, filters, User App product browsing, true-device verification, target-environment deployment, or formal business acceptance.
