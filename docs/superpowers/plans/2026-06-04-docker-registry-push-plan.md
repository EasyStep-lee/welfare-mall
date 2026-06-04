# Docker Registry Push Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a local registry push plan command that prints deterministic build, inspect, login reminder, and push commands for API/Admin/Merchant/Portal without executing registry pushes.

**Architecture:** Add a root Node.js script that requires a registry, reuses the release manifest, and emits JSON with full image refs plus explicit commands. The command remains dry-run only so registry credentials and target deployment are not required in local verification.

**Tech Stack:** Node.js script, Docker release manifest, deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `docker:registry:push-plan`.
- Create `tools/print-docker-registry-push-plan.cjs`: print dry-run registry push plan JSON.
- Create `tools/verify-docker-registry-push-plan.cjs`: verify the push plan contract.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: reference registry push plan before target execution.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add registry push plan evidence field.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include registry push plan in evidence.
- Modify `tools/verify-target-deployment-handoff.cjs`: require registry push plan references.
- Create `docs/superpowers/plans/2026-06-04-docker-registry-push-plan.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing registry push plan command**

Add `docker:registry:push-plan` to `package.json` pointing at `tools/print-docker-registry-push-plan.cjs`.

- [x] **Step 2: Run RED registry push plan command**

Run:

```powershell
pnpm run docker:registry:push-plan -- --registry registry.example.com/welfare-mall --tag manual-test
```

Expected: FAIL because `tools/print-docker-registry-push-plan.cjs` does not exist yet.

### Task 2: Push Plan Output

- [x] **Step 1: Implement dry-run registry push plan**

Create `tools/print-docker-registry-push-plan.cjs` so it requires `--registry` or `WELFARE_MALL_IMAGE_REGISTRY` and prints JSON with:

- `commitSha`
- `imageTag`
- `imageRegistry`
- `images`
- `commands.loginReminder`
- `commands.build`
- `commands.inspect`
- `commands.push`
- `boundary`

- [x] **Step 2: Add push plan verifier**

Create `tools/verify-docker-registry-push-plan.cjs` to verify the plan includes four full image refs and four `docker push` commands.

- [x] **Step 3: Update deployment docs and handoff verifier**

Require `pnpm run docker:registry:push-plan -- --registry <registry>` in the runbook, result template, release handoff, and handoff verifier.

- [x] **Step 4: Run GREEN registry push plan verification**

Run:

```powershell
node tools/verify-docker-registry-push-plan.cjs
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused push-plan gates**

Run:

```powershell
pnpm run docker:registry:push-plan -- --registry registry.example.com/welfare-mall --tag manual-test
node tools/verify-docker-registry-push-plan.cjs
pnpm run docker:release:manifest:verify
pnpm run target:deployment:handoff
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
git add package.json tools docs/deployment docs/superpowers/plans/2026-06-04-docker-registry-push-plan.md
git commit -m "build: add docker registry push plan"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-registry-push-plan
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice prints push instructions only. It does not run `docker push`, authenticate to any registry, deploy to a target server, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
