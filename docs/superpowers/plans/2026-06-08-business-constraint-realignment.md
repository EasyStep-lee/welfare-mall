# Business Constraint Realignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an enforceable business-boundary gate so the rewrite cannot keep drifting away from the master-plan subjects, welfare-card payment rules, login identity boundaries, and no-store/no-offline-cash constraints.

**Architecture:** Add a documentation source of truth plus a Node-based verification tool. The tool requires the constraints document, tracks current known deviations explicitly, and fails if source files introduce store/shop, offline-cash, or fixed-local-identity risk without a recorded reason and next action.

**Tech Stack:** Node.js CommonJS tooling, PowerShell verification commands, existing pnpm root scripts.

---

### Task 1: RED Business Boundary Guard

**Files:**
- Create: `tools/verify-business-boundary.cjs`
- Create: `docs/business-boundary-constraints.md`
- Create: `docs/business-boundary-known-deviations.json`
- Modify: `package.json`

- [x] **Step 1: Run the missing guard**

Run:

```powershell
node tools/verify-business-boundary.cjs
```

Expected: FAIL with `MODULE_NOT_FOUND` because the guard does not exist yet.

Evidence:
- RED: `node tools/verify-business-boundary.cjs` failed with `Cannot find module ... tools\verify-business-boundary.cjs`.

### Task 2: GREEN Business Boundary Guard

- [x] **Step 1: Add business-boundary constraints**

Create `docs/business-boundary-constraints.md` with the enforced subject chain, franchise/merchant/user responsibilities, welfare-card plus online-cash payment rule, no-store/no-offline-cash constraints, and login identity requirement.

- [x] **Step 2: Add known deviation registry**

Create `docs/business-boundary-known-deviations.json` and list every current source file that still contains compatibility pickup/store, cash-channel, or fixed-local-identity risks. Each entry must have a `reason` and `nextAction`.

- [x] **Step 3: Add the verification tool**

Create `tools/verify-business-boundary.cjs` to:

- require the constraints document and key snippets.
- require the known-deviation registry.
- scan active app/API source files for store/shop, cash-channel, pickupStoreName, and fixed local identity risks.
- fail on any unregistered risk or stale registry entry.

- [x] **Step 4: Wire root verification**

Add `verify:business-boundary` to `package.json` and include it in `pnpm run verify`.

### Task 3: Verification

- [x] **Step 1: Run focused guard**

```powershell
pnpm run verify:business-boundary
```

Expected: PASS and report the tracked known deviation count.

Evidence:
- `pnpm run verify:business-boundary` passed and reported `Business boundary check passed (36 known deviation files tracked).`

- [x] **Step 2: Run frontend stack boundary**

```powershell
pnpm run verify:frontend-stack
```

Expected: PASS.

Evidence:
- `pnpm run verify:frontend-stack` passed with `Frontend stack boundary check passed (enforced).`

- [x] **Step 3: Run full verification**

```powershell
pnpm run verify
git diff --check
```

Expected: PASS. Any Windows LF/CRLF working-copy warnings must be reported separately.

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites and 265/265 tests, Admin Vitest 21/21 tests, Merchant Vitest 15/15 tests, Portal Vitest 17/17 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` passed with no output.

### Task 4: Completion

- [x] Commit feature work on `codex/business-constraint-realignment`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks.
- [x] Merge PR to `main`.
- [x] Open docs-only completion PR marking this plan complete after the feature merge.

Evidence:
- Feature branch: `codex/business-constraint-realignment`.
- Feature commit: `e7eeb44 chore: enforce business boundary constraints`.
- Feature PR: `https://github.com/EasyStep-lee/welfare-mall/pull/243`.
- GitHub checks passed: `docs-check`, `project-foundation-check`.
- Squash merge commit: `3520876abb07e822b0cb4ff6e48319095de060a1`.
- Docs-only completion branch: `codex/docs-business-constraint-realignment-complete`.
