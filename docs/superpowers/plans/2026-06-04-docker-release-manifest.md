# Docker Release Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a repeatable Docker release manifest command so deployment handoff evidence can capture the commit, release image tag, service image refs, and follow-up smoke commands.

**Architecture:** Add a root manifest command that prints deterministic JSON by default. It derives the commit SHA from git, derives `git-<short-sha>` when no tag is provided, and lists API/Admin/Merchant/Portal image refs. Update deployment docs and handoff verification so operators record the manifest before target execution.

**Tech Stack:** Node.js script, git metadata, Docker image tag convention, deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `docker:release:manifest`.
- Create `tools/print-docker-release-manifest.cjs`: print release manifest JSON.
- Modify `tools/verify-target-deployment-handoff.cjs`: require manifest command references.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: add manifest generation step.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: add manifest evidence section.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include manifest evidence.
- Create `docs/superpowers/plans/2026-06-04-docker-release-manifest.md`: track this slice.

## Tasks

### Task 1: RED Command

- [x] **Step 1: Add failing Docker release manifest command**

Add `docker:release:manifest` to `package.json` pointing at `tools/print-docker-release-manifest.cjs`.

- [x] **Step 2: Run RED Docker release manifest command**

Run:

```powershell
pnpm run docker:release:manifest
```

Expected: FAIL because `tools/print-docker-release-manifest.cjs` does not exist yet.

### Task 2: Release Manifest

- [x] **Step 1: Implement Docker release manifest script**

Create `tools/print-docker-release-manifest.cjs` so it prints JSON with:

- `commitSha`
- `shortSha`
- `imageTag`
- `images.api`
- `images.admin`
- `images.merchant`
- `images.portal`
- `commands.imageBuildPreflight`
- `commands.targetRuntimeSmoke`

- [x] **Step 2: Support explicit tag overrides**

Support `--tag <value>` and default to `process.env.WELFARE_MALL_IMAGE_TAG` or `git-<short-sha>`.

- [x] **Step 3: Update deployment handoff docs and verifier**

Require `pnpm run docker:release:manifest` in runbook, result template, release handoff, and the handoff verifier.

- [x] **Step 4: Run GREEN Docker release manifest command**

Run:

```powershell
pnpm run docker:release:manifest
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused release gates**

Run:

```powershell
pnpm run docker:release:manifest
pnpm run verify:docker-runtime
pnpm run target:deployment:handoff
pnpm run target:runtime:env-check
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
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

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add package.json tools/print-docker-release-manifest.cjs tools/verify-target-deployment-handoff.cjs docs/deployment docs/superpowers/plans/2026-06-04-docker-release-manifest.md
git commit -m "build: add docker release manifest"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-release-manifest
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice generates local release manifest evidence for deployment handoff. It does not deploy to a target server, push images to a registry, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
