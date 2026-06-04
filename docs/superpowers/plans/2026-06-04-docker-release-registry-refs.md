# Docker Release Registry Refs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add registry-aware Docker release image references so target deployment handoff can record full image refs, not only local image names.

**Architecture:** Add a focused manifest verification command first, then extend the release manifest, compose image declarations, and image build preflight to share a normalized registry prefix. Keep registry optional so local Docker runtime remains unchanged when no registry is supplied.

**Tech Stack:** Node.js release manifest script, PowerShell Docker image preflight, Docker Compose image interpolation, deployment handoff docs.

---

## File Structure

- Modify `package.json`: add `docker:release:manifest:verify`.
- Create `tools/verify-docker-release-manifest.cjs`: verify local and registry-aware manifest output.
- Modify `tools/print-docker-release-manifest.cjs`: support `--registry` and `WELFARE_MALL_IMAGE_REGISTRY`.
- Modify `docker-compose.yml`: support `WELFARE_MALL_IMAGE_REGISTRY_PREFIX` in API/Admin/Merchant/Portal image names.
- Modify `tools/verify-docker-image-build.ps1`: normalize registry env into `WELFARE_MALL_IMAGE_REGISTRY_PREFIX` and inspect full image refs.
- Modify `tools/verify-docker-runtime.cjs`: require registry-prefix-capable compose image declarations.
- Modify deployment docs: record optional registry and full image refs.
- Create `docs/superpowers/plans/2026-06-04-docker-release-registry-refs.md`: track this slice.

## Tasks

### Task 1: RED Manifest Verification

- [x] **Step 1: Add failing registry manifest verification**

Add `docker:release:manifest:verify` and `tools/verify-docker-release-manifest.cjs`.

- [x] **Step 2: Run RED registry manifest verification**

Run:

```powershell
pnpm run docker:release:manifest:verify
```

Expected: FAIL because `tools/print-docker-release-manifest.cjs` does not support `--registry` yet.

### Task 2: Registry-Aware Image References

- [x] **Step 1: Implement registry-aware manifest output**

Support `--registry <value>` and `WELFARE_MALL_IMAGE_REGISTRY`, normalized so `registry.example.com/team` becomes `registry.example.com/team/`.

- [x] **Step 2: Update compose image refs and image build preflight**

Use `${WELFARE_MALL_IMAGE_REGISTRY_PREFIX:-}` before each service image name and have `tools/verify-docker-image-build.ps1` derive that prefix from `WELFARE_MALL_IMAGE_REGISTRY`.

- [x] **Step 3: Update Docker runtime verifier and deployment docs**

Require registry-prefix-capable image declarations and document optional registry/full image refs.

- [x] **Step 4: Run GREEN registry manifest verification**

Run:

```powershell
pnpm run docker:release:manifest:verify
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused registry gates**

Run:

```powershell
pnpm run docker:release:manifest
pnpm run docker:release:manifest:verify
pnpm run verify:docker-runtime
pnpm run target:deployment:preflight
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

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add package.json docker-compose.yml tools docs/deployment docs/superpowers/plans/2026-06-04-docker-release-registry-refs.md
git commit -m "build: add docker release registry refs"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-release-registry-refs
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice records optional registry-aware image references and local preflight behavior only. It does not push images to a registry, deploy to a target server, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
