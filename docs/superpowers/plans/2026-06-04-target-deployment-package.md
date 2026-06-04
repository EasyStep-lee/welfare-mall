# Target Deployment Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target deployment package command that prints a deterministic handoff JSON for target operators, combining current commit metadata, registry-aware release images, dry-run push commands, target execution commands, evidence file paths, and explicit pending acceptance boundaries.

**Architecture:** Add a root Node.js script that requires a registry, reuses the Docker release manifest and registry push plan, verifies deployment handoff docs, and emits a single JSON package. The command remains local/dry-run only and does not authenticate, push images, deploy, or call target URLs.

**Tech Stack:** Node.js script, Docker release manifest, registry push plan, deployment handoff docs, target result verifier.

---

## File Structure

- Modify `package.json`: add `target:deployment:package`.
- Create `tools/print-target-deployment-package.cjs`: print target deployment package JSON.
- Create `tools/verify-target-deployment-package.cjs`: verify package contract and required-registry failure.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: require package generation before target execution.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include package output in handoff evidence.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add package evidence field.
- Modify `tools/verify-target-deployment-handoff.cjs`: require package command references.
- Create `docs/superpowers/plans/2026-06-04-target-deployment-package.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing target deployment package command**

Add `target:deployment:package` to `package.json` pointing at `tools/print-target-deployment-package.cjs`.

- [x] **Step 2: Run RED target deployment package command**

Run:

```powershell
pnpm run target:deployment:package -- --registry registry.example.com/welfare-mall --tag manual-test
```

Expected: FAIL because `tools/print-target-deployment-package.cjs` does not exist yet.

### Task 2: Package Output

- [x] **Step 1: Implement target deployment package output**

Create `tools/print-target-deployment-package.cjs` so it requires `--registry` or `WELFARE_MALL_IMAGE_REGISTRY` and prints JSON with:

- `commitSha`
- `shortSha`
- `imageTag`
- `imageRegistry`
- `images`
- `registryPushPlan`
- `targetCommands`
- `evidenceFiles`
- `pendingAcceptance`
- `targetExecutionStatus`
- `boundary`

- [x] **Step 2: Add package verifier**

Create `tools/verify-target-deployment-package.cjs` to verify the package includes four full image refs, four push commands, required target execution commands, result verifier command, and pending target boundary.

- [x] **Step 3: Update deployment docs and handoff verifier**

Require `pnpm run target:deployment:package -- --registry <registry>` in the runbook, result template, release handoff, and handoff verifier.

- [x] **Step 4: Run GREEN target deployment package verification**

Run:

```powershell
node tools/verify-target-deployment-package.cjs
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused package gates**

Run:

```powershell
pnpm run target:deployment:package -- --registry registry.example.com/welfare-mall --tag manual-test
node tools/verify-target-deployment-package.cjs
pnpm run target:deployment:handoff
pnpm run target:deployment:result:verify
```

Expected: PASS.

- [x] **Step 2: Run full verification and diff hygiene**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools docs/deployment docs/superpowers/plans/2026-06-04-target-deployment-package.md
git commit -m "build: add target deployment package"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-deployment-package
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice prints a local target deployment handoff package only. It does not run `docker push`, authenticate to any registry, deploy to a target server, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
