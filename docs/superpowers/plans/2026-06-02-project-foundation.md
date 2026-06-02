# Project Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Welfare Mall V2 monorepo foundation so later API, Admin, Merchant, Portal, and mini-program branches have stable directories, scripts, and baseline verification.

**Architecture:** The repository starts as a pnpm workspace with `apps/*` and `packages/*`. Root scripts provide a baseline `verify` command now, then later branches replace placeholder package-level checks with real lint, typecheck, test, build, Docker, and runtime gates.

**Tech Stack:** pnpm workspace, TypeScript base config, Turborepo task config, GitHub Actions, PowerShell-friendly verification commands.

---

## File Structure

Create these root files:

- `package.json`: root workspace metadata and baseline scripts.
- `pnpm-workspace.yaml`: workspace package discovery.
- `turbo.json`: task graph for future lint/typecheck/test/verify tasks.
- `tsconfig.base.json`: strict TypeScript baseline shared by future packages.

Create these app directories:

- `apps/api`: future NestJS API.
- `apps/admin`: future Vue 3 Admin app.
- `apps/merchant`: future Vue 3 Merchant app.
- `apps/portal`: future Vue 3 Portal app.
- `apps/user-miniprogram`: future native WeChat user mini-program.
- `apps/logistics-miniprogram`: future native WeChat logistics mini-program.

Create these package/tool directories:

- `packages/contracts`: shared DTO, enum, and OpenAPI contract support.
- `packages/api-client`: generated client target.
- `packages/shared`: shared TypeScript helpers.
- `tools`: local verification and automation scripts.

## Task 1: Verify Clean Baseline

**Files:**
- Read: `README.md`
- Read: `docs/superpowers/plans/2026-06-02-rewrite-master-plan.md`

- [x] **Step 1: Confirm branch and clean state**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/project-foundation
codex/project-foundation
```

- [x] **Step 2: Confirm pnpm availability**

Run:

```powershell
pnpm --version
```

Expected: a pnpm version is printed. If pnpm is missing, install or enable pnpm before continuing.

## Task 2: Add Workspace Skeleton

**Files:**
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

- [x] **Step 1: Create app and package directories**

Create:

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

Add `.gitkeep` to each directory so the skeleton is tracked.

- [x] **Step 2: Verify skeleton**

Run:

```powershell
@(
  'apps/api/.gitkeep',
  'apps/admin/.gitkeep',
  'apps/merchant/.gitkeep',
  'apps/portal/.gitkeep',
  'apps/user-miniprogram/.gitkeep',
  'apps/logistics-miniprogram/.gitkeep',
  'packages/contracts/.gitkeep',
  'packages/api-client/.gitkeep',
  'packages/shared/.gitkeep',
  'tools/.gitkeep'
) | ForEach-Object { if (-not (Test-Path $_)) { throw "Missing $_" } }
"OK: skeleton exists"
```

Expected:

```text
OK: skeleton exists
```

## Task 3: Add Root Workspace Files

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`

- [x] **Step 1: Add root `package.json`**

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

- [x] **Step 2: Add `pnpm-workspace.yaml`**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [x] **Step 3: Add `turbo.json`**

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

- [x] **Step 4: Add `tsconfig.base.json`**

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

## Task 4: Add Project Verification CI

**Files:**
- Modify: `.github/workflows/project-docs-check.yml`

- [x] **Step 1: Add root verify job**

Extend `.github/workflows/project-docs-check.yml` with a second job named `project-foundation-check`.

The job must:

- checkout code
- enable corepack
- prepare pnpm 10.12.1
- run `pnpm install --lockfile-only`
- run `pnpm run verify`

- [x] **Step 2: Verify CI file still has required docs check**

Run:

```powershell
Select-String -Path .github/workflows/project-docs-check.yml -Pattern 'Check required project docs','project-foundation-check','pnpm run verify'
```

Expected: all three patterns are found.

## Task 5: Verify and Commit

**Files:**
- All files from Tasks 2, 3, and 4

- [x] **Step 1: Run local verification**

Run:

```powershell
pnpm --version
pnpm install --lockfile-only
pnpm run verify
```

Expected:

- `pnpm --version` prints a version.
- `pnpm install --lockfile-only` exits 0 and creates `pnpm-lock.yaml`.
- `pnpm run verify` exits 0 and prints baseline messages.

- [x] **Step 2: Run documentation guard**

Run:

```powershell
$placeholderPattern = 'T' + 'BD|TO' + 'DO'
Select-String -Path README.md,docs\*.md,docs\adr\*.md,docs\superpowers\plans\*.md,.github\PULL_REQUEST_TEMPLATE.md,.github\ISSUE_TEMPLATE\*.md -Pattern $placeholderPattern
```

Expected: no matches.

- [ ] **Step 3: Commit**

Run:

```powershell
git status -sb
git add package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json apps packages tools .github/workflows/project-docs-check.yml docs/superpowers/plans/2026-06-02-project-foundation.md
git commit -m "chore: add project foundation"
```

Expected: one commit on `codex/project-foundation`.

## Self-Review

Spec coverage:

- Monorepo directories match the project architecture.
- Root scripts provide a real command path for early CI.
- Future branches have stable app and package locations.

Placeholder scan:

- This file avoids unresolved placeholder markers by using a split scan pattern in examples.

Type consistency:

- `apps/user-miniprogram` and `apps/logistics-miniprogram` match the five-end naming used in the master plan.
- `packages/contracts`, `packages/api-client`, and `packages/shared` match the README architecture.
