# Vue Admin Merchant Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce the agreed Admin/Merchant frontend stack boundary by replacing the React runtime foundation with Vue 3 + TypeScript + Vite + Pinia + Element Plus.

**Architecture:** Keep `apps/admin` and `apps/merchant` as separate apps and keep their existing API clients and pure business helper modules. Replace React package dependencies, Vite React plugins, TSX entrypoints, and React component tests with Vue app entrypoints and Vue smoke tests. Move the migration status from `in_progress` to `enforced` so `verify:frontend-stack` blocks future React dependencies/imports.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, Element Plus, Vitest, @vue/test-utils, Docker Compose.

---

### Task 1: Write Failing Stack Boundary Tests

**Files:**
- Modify: `docs/frontend-stack-migration-status.json`
- Modify: `apps/admin/src/App.test.tsx`
- Modify: `apps/merchant/src/App.test.tsx`

- [x] **Step 1: Enforce frontend stack boundary before implementation**

Set `migrationStatus` to `enforced` and remove Admin/Merchant from `allowedReactWorkspacePackages`.

Run:

```powershell
pnpm run verify:frontend-stack
```

Expected: FAIL because Admin/Merchant still use React dependencies, React Vite plugin, TSX, and React imports.

- [x] **Step 2: Replace React component tests with Vue smoke tests**

Create Vue tests that mount Admin/Merchant apps with `@vue/test-utils`, verify Vue-rendered business sections, and prove initial API calls still target the local API base URL.

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- src/App.test.ts --run
pnpm --filter @welfare-mall/merchant run test -- src/App.test.ts --run
```

Expected: FAIL until Vue dependencies and components are implemented.

### Task 2: Migrate Admin and Merchant Runtime Foundation

**Files:**
- Modify: `apps/admin/package.json`
- Modify: `apps/merchant/package.json`
- Modify: `apps/admin/vite.config.ts`
- Modify: `apps/merchant/vite.config.ts`
- Modify: `apps/admin/tsconfig.json`
- Modify: `apps/merchant/tsconfig.json`
- Modify: `apps/admin/index.html`
- Modify: `apps/merchant/index.html`
- Replace: `apps/admin/src/main.tsx`
- Replace: `apps/merchant/src/main.tsx`
- Replace: `apps/admin/src/App.tsx`
- Replace: `apps/merchant/src/App.tsx`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Swap packages to Vue stack**

Remove React runtime/test/plugin packages from Admin/Merchant and add Vue, Pinia, Element Plus, @vitejs/plugin-vue, @vue/test-utils, and vue-tsc.

- [x] **Step 2: Replace Vite and TS entrypoints**

Switch Vite plugins to Vue, point HTML to `src/main.ts`, and use `vue-tsc` for lint/typecheck/build script checks.

- [x] **Step 3: Implement Vue Admin/Merchant business skeletons**

Use Element Plus layout/buttons/tables/cards for the existing core workspaces: Admin review/orders/inventory/settlement and Merchant fulfillment/product draft/settlement.

### Task 3: Verification

- [x] **Step 1: Run focused stack and frontend tests**

Run:

```powershell
pnpm run verify:frontend-stack
pnpm --filter @welfare-mall/admin run test --run
pnpm --filter @welfare-mall/merchant run test --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm --filter @welfare-mall/merchant run typecheck
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
feat: migrate admin merchant foundation to Vue
```

- [ ] **Step 4: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark Task 3 complete.
