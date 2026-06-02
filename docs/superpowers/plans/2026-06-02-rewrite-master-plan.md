# Welfare Mall V2 Rewrite Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the full rewrite of Welfare Mall V2 by fixing the mainline, branch model, phase order, subsystem plans, and verification gates before application code is written.

**Architecture:** The project uses `main` as the stable trunk and implements the rewrite through small feature branches. The first code branch builds the monorepo and toolchain; later branches add API, IAM, merchant/franchise foundations, product model, product pool, trading, fulfillment, settlement, and five-end integration in that order.

**Tech Stack:** GitHub, Git, GitHub Actions, pnpm workspace, TypeScript, NestJS, Prisma, MySQL 8, Redis, Vue 3, Vite, Pinia, Element Plus, OpenAPI, Jest, Playwright, Docker, native WeChat Mini Program.

---

## Scope Check

The full rewrite is not a single implementation task. It contains independent subsystems:

- Repository and monorepo foundation
- API foundation
- IAM and audit
- Franchise, merchant, and region foundation
- Product model
- Product pool
- Admin foundation
- Merchant foundation
- Portal integration
- User mini-program integration
- Logistics mini-program integration
- Order, payment, refund, aftersale
- Inventory and fulfillment
- Settlement and reconciliation
- Migration and release readiness

This master plan controls sequence and branch discipline. Each subsystem branch must get its own detailed implementation plan before code is written on that branch.

## Mainline Rule

`main` is the stable trunk.

`main` may contain:

- Approved plans and ADRs
- Project templates and CI checks
- Code merged from reviewed feature branches
- Verification scripts that pass in GitHub Actions
- Release readiness reports

`main` must not contain:

- Experimental code
- Direct unreviewed feature edits
- Partially wired modules that cannot pass local checks
- Target-environment or true-device claims without evidence

## Branch Model

Create every implementation branch from fresh `main`:

```powershell
git switch main
git pull --ff-only
git switch -c codex/<branch-name>
```

Commit frequently:

```powershell
git status -sb
git add <intended-files>
git commit -m "<type>: <short description>"
```

Push the branch:

```powershell
git push -u origin codex/<branch-name>
```

Merge only through Pull Request after the required checks and review evidence are attached.

## Phase Order

| Phase | Branch | Purpose | Merge Target |
|---|---|---|---|
| 0 | `codex/rewrite-master-plan` | Lock rewrite plan and execution order | `main` |
| 1 | `codex/project-foundation` | Create monorepo, package manager, root scripts, CI baseline | `main` |
| 2 | `codex/api-foundation` | Create NestJS API, Prisma, MySQL, Redis, OpenAPI shell | `main` |
| 3 | `codex/iam-rbac-audit` | Add identity, role, permission, data scope, audit foundation | `main` |
| 4 | `codex/franchise-merchant-foundation` | Add franchise, merchant, region, qualification foundation | `main` |
| 5 | `codex/product-model` | Add product, SKU, spec, media, attribute, delivery profile | `main` |
| 6 | `codex/product-pool` | Add product pool, rules, channels, snapshots, publish flow | `main` |
| 7 | `codex/admin-foundation` | Add Admin Vue shell, login, workspace, generated API client | `main` |
| 8 | `codex/merchant-foundation` | Add Merchant Vue shell, login, merchant workspace | `main` |
| 9 | `codex/portal-product-pool` | Connect Portal to product pool and display config | `main` |
| 10 | `codex/user-miniprogram-product-flow` | Connect User App product browsing and detail flow | `main` |
| 11 | `codex/order-payment-refund` | Add order, payment, refund, aftersale state machines | `main` |
| 12 | `codex/inventory-fulfillment-logistics` | Add inventory ledger, fulfillment tasks, logistics mini-program | `main` |
| 13 | `codex/settlement-reconciliation` | Add bills, statements, offline payout confirmation, reversal | `main` |
| 14 | `codex/migration-release-readiness` | Add old-resource audit, migration scripts, release gates | `main` |

## Verification Layers

Every branch must report these layers separately:

- Local code checks
- Docker/runtime checks
- Browser or page checks
- WeChat DevTools checks
- True-device checks
- Target-environment checks
- Business acceptance

Unexecuted layers must be marked as not executed, not merged into success wording.

## Task 1: Lock Rewrite Plan Branch

**Files:**
- Create: `docs/superpowers/plans/2026-06-02-rewrite-master-plan.md`
- Modify: `README.md`

- [x] **Step 1: Create branch from main**

Run:

```powershell
git switch main
git pull --ff-only
git switch -c codex/rewrite-master-plan
```

Expected: current branch is `codex/rewrite-master-plan`.

- [x] **Step 2: Write the master plan**

Create `docs/superpowers/plans/2026-06-02-rewrite-master-plan.md` with the phase order, branch model, verification layers, and first implementation branch definition.

- [ ] **Step 3: Link the master plan from README**

Add this line under current assets:

```markdown
- [重写主计划](docs/superpowers/plans/2026-06-02-rewrite-master-plan.md)
```

- [ ] **Step 4: Verify plan files**

Run:

```powershell
Test-Path docs/superpowers/plans/2026-06-02-rewrite-master-plan.md
$placeholderPattern = 'T' + 'BD|TO' + 'DO'
Select-String -Path README.md,docs\*.md,docs\adr\*.md,docs\superpowers\plans\*.md,.github\PULL_REQUEST_TEMPLATE.md,.github\ISSUE_TEMPLATE\*.md -Pattern $placeholderPattern
git status -sb
```

Expected:

```text
True
```

The placeholder scan prints no matches. Git status shows only the intended plan and README changes.

- [ ] **Step 5: Commit the plan**

Run:

```powershell
git add README.md docs/superpowers/plans/2026-06-02-rewrite-master-plan.md
git commit -m "docs: add rewrite master plan"
```

Expected: one commit on `codex/rewrite-master-plan`.

- [ ] **Step 6: Push and create PR**

Run:

```powershell
git push -u origin codex/rewrite-master-plan
```

Expected: remote branch exists and a draft PR can target `main`.

## Task 2: Start Project Foundation Branch

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `apps/api/.gitkeep`
- Create: `apps/admin/.gitkeep`
- Create: `apps/merchant/.gitkeep`
- Create: `apps/portal/.gitkeep`
- Create: `apps/user-miniprogram/.gitkeep`
- Create: `apps/logistics-miniprogram/.gitkeep`
- Create: `packages/contracts/.gitkeep`
- Create: `packages/api-client/.gitkeep`
- Create: `packages/shared/.gitkeep`
- Create: `tools/.gitkeep`
- Create: `docs/superpowers/plans/2026-06-02-project-foundation.md`

- [ ] **Step 1: Create the branch**

Run after the rewrite master plan is merged:

```powershell
git switch main
git pull --ff-only
git switch -c codex/project-foundation
```

Expected: current branch is `codex/project-foundation`.

- [ ] **Step 2: Write the subsystem implementation plan**

Create `docs/superpowers/plans/2026-06-02-project-foundation.md` with exact tasks for the root workspace files and empty app/package directories.

Expected: the plan includes root scripts, CI expectations, and the first failing checks before implementation.

- [ ] **Step 3: Add workspace skeleton**

Create these directories:

```text
apps/api
apps/admin
apps/merchant
apps/portal
apps/user-miniprogram
apps/logistics-miniprogram
packages/contracts
packages/api-client
packages/shared
tools
```

Expected: each directory exists and contains `.gitkeep` until real files are introduced.

- [ ] **Step 4: Add root package files**

Create `package.json`:

```json
{
  "name": "welfare-mall-v2",
  "private": true,
  "packageManager": "pnpm@10.12.1",
  "scripts": {
    "verify": "pnpm run lint && pnpm run typecheck && pnpm run test",
    "lint": "echo \"lint baseline pending package setup\"",
    "typecheck": "echo \"typecheck baseline pending package setup\"",
    "test": "echo \"test baseline pending package setup\""
  },
  "devDependencies": {}
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "outputs": []
    },
    "test": {
      "outputs": []
    },
    "verify": {
      "dependsOn": ["lint", "typecheck", "test"],
      "outputs": []
    }
  }
}
```

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 5: Verify foundation**

Run:

```powershell
pnpm --version
pnpm run verify
git status -sb
```

Expected: `pnpm --version` prints `10.12.1` or another installed pnpm version. `pnpm run verify` exits 0 with baseline messages. Git status shows only intended workspace skeleton changes.

## Task 3: Start API Foundation Branch

**Files:**
- Create: `docs/superpowers/plans/2026-06-02-api-foundation.md`
- Create or modify under: `apps/api`
- Create or modify under: `packages/contracts`

- [ ] **Step 1: Create branch after project foundation is merged**

Run:

```powershell
git switch main
git pull --ff-only
git switch -c codex/api-foundation
```

Expected: current branch is `codex/api-foundation`.

- [ ] **Step 2: Write detailed API implementation plan**

Create `docs/superpowers/plans/2026-06-02-api-foundation.md`.

The plan must cover:

- NestJS bootstrap
- health endpoint
- Prisma schema shell
- MySQL and Redis Docker compose
- OpenAPI generation
- Jest setup
- local verify script

- [ ] **Step 3: Stop before code until API plan is reviewed**

Expected: no API code is written before the API foundation plan exists and is reviewed.

## Task 4: Continue Branch-by-Branch Rewrite

**Files:**
- Create one detailed plan per branch under `docs/superpowers/plans/`
- Modify only the subsystem files named in the current branch plan

- [ ] **Step 1: For each branch, write detailed plan first**

Branches must be planned in this order:

```text
codex/iam-rbac-audit
codex/franchise-merchant-foundation
codex/product-model
codex/product-pool
codex/admin-foundation
codex/merchant-foundation
codex/portal-product-pool
codex/user-miniprogram-product-flow
codex/order-payment-refund
codex/inventory-fulfillment-logistics
codex/settlement-reconciliation
codex/migration-release-readiness
```

Expected: each branch has a dedicated plan before implementation.

- [ ] **Step 2: Keep verification evidence with each PR**

Each PR must include:

```text
Local code checks:
Docker/runtime checks:
Browser/page checks:
WeChat DevTools checks:
True-device checks:
Target-environment checks:
Business acceptance:
```

Expected: unexecuted layers are marked as not executed.

## Self-Review

Spec coverage:

- The plan maps the existing project docs to branch order and implementation sequence.
- The plan keeps `main` as stable trunk.
- The plan separates local, runtime, true-device, target-environment, and business acceptance.
- The plan avoids starting order, payment, refund, and settlement before IAM, product, product pool, and business baselines are in place.

Placeholder scan:

- This file avoids unresolved placeholder markers.
- Future subsystem plans must not use vague filler such as unspecified implementation details.

Type consistency:

- Branch names use the `codex/` prefix consistently.
- Plan files use the `docs/superpowers/plans/YYYY-MM-DD-<topic>.md` convention.
