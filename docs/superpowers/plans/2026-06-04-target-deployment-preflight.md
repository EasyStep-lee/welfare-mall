# Target Deployment Preflight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a target deployment preflight command that proves the repository is locally prepared for target execution without claiming a target deployment happened.

**Architecture:** Add a root Node.js command that checks git metadata, verifies the deployment handoff documents, embeds the Docker release manifest, and prints deterministic JSON with local gates, target gates, and explicit pending acceptance boundaries. The command is static by default and supports stricter `--require-main` and `--require-clean` flags for release operators.

**Tech Stack:** Node.js script, git metadata, deployment handoff verifier, Docker release manifest, target runtime docs.

---

## File Structure

- Modify `package.json`: add `target:deployment:preflight`.
- Create `tools/verify-target-deployment-preflight.cjs`: print deployment preflight JSON and enforce optional release flags.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: add preflight as the first target execution preparation command.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add preflight evidence field.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include preflight in local release evidence.
- Modify `tools/verify-target-deployment-handoff.cjs`: require preflight command references in deployment docs.
- Create `docs/superpowers/plans/2026-06-04-target-deployment-preflight.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing target deployment preflight command**

Add `target:deployment:preflight` to `package.json` pointing at `tools/verify-target-deployment-preflight.cjs`.

- [x] **Step 2: Run RED target deployment preflight command**

Run:

```powershell
pnpm run target:deployment:preflight
```

Expected: FAIL because `tools/verify-target-deployment-preflight.cjs` does not exist yet.

### Task 2: Deployment Preflight

- [x] **Step 1: Implement target deployment preflight script**

Create `tools/verify-target-deployment-preflight.cjs` so it prints JSON with:

- `commitSha`
- `shortSha`
- `branchName`
- `workingTreeClean`
- `releaseManifest`
- `localGates`
- `targetGates`
- `pendingAcceptance`
- `boundary`

- [x] **Step 2: Add strict release flags**

Support:

```powershell
pnpm run target:deployment:preflight -- --require-main --require-clean
```

Expected: FAIL outside clean `main`, PASS on clean `main`.

- [x] **Step 3: Update deployment docs and handoff verifier**

Require `pnpm run target:deployment:preflight` in runbook, result template, release handoff, and the handoff verifier.

- [x] **Step 4: Run GREEN target deployment preflight command**

Run:

```powershell
pnpm run target:deployment:preflight
```

Expected: PASS and print JSON with `targetExecutionStatus` as `pending`.

### Task 3: Verification

- [x] **Step 1: Run focused deployment gates**

Run:

```powershell
pnpm run target:deployment:preflight
pnpm run target:deployment:handoff
pnpm run docker:release:manifest
pnpm run target:runtime:env-check
pnpm run target:runtime:smoke
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
git add package.json tools/verify-target-deployment-preflight.cjs tools/verify-target-deployment-handoff.cjs docs/deployment docs/superpowers/plans/2026-06-04-target-deployment-preflight.md
git commit -m "build: add target deployment preflight"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/target-deployment-preflight
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice proves local release readiness metadata and target deployment instructions are present. It does not deploy to a target server, push images to a registry, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
