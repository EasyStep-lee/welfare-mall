# Docker Release Image Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add explicit Docker image tags for API, Admin, Merchant, and Portal so deployment handoff evidence can identify and roll back exact build artifacts.

**Architecture:** Tighten Docker runtime static verification first so it fails until compose declares explicit image names with `${WELFARE_MALL_IMAGE_TAG:-local}`. Then add image names to `docker-compose.yml`, update the image-build preflight to default `WELFARE_MALL_IMAGE_TAG` from the current git commit, and record tag evidence in deployment docs.

**Tech Stack:** Docker Compose image fields, PowerShell build preflight, Node.js static verifier, deployment handoff docs.

---

## File Structure

- Modify `docker-compose.yml`: add explicit image names for API/Admin/Merchant/Portal.
- Modify `tools/verify-docker-runtime.cjs`: require release image tag snippets.
- Modify `tools/verify-docker-image-build.ps1`: default `WELFARE_MALL_IMAGE_TAG` from git SHA and inspect expected images after build.
- Modify `docs/deployment/target-runtime-deployment-result-template.md`: record release image tag.
- Modify `docs/deployment/target-runtime-deployment-runbook.md`: explain the release image tag.
- Modify `docs/deployment/target-runtime-release-handoff.md`: include image tag evidence.
- Create `docs/superpowers/plans/2026-06-04-docker-release-image-tags.md`: track this slice.

## Tasks

### Task 1: RED Docker Runtime Gate

- [x] **Step 1: Require explicit release image tags in Docker runtime verifier**

Add required compose snippets for:

- `image: welfare-mall-v2-api:${WELFARE_MALL_IMAGE_TAG:-local}`
- `image: welfare-mall-v2-admin:${WELFARE_MALL_IMAGE_TAG:-local}`
- `image: welfare-mall-v2-merchant:${WELFARE_MALL_IMAGE_TAG:-local}`
- `image: welfare-mall-v2-portal:${WELFARE_MALL_IMAGE_TAG:-local}`

- [x] **Step 2: Run RED Docker runtime verifier**

Run:

```powershell
pnpm run verify:docker-runtime
```

Expected: FAIL because `docker-compose.yml` does not yet declare explicit image tags.

### Task 2: Release Image Tag Support

- [x] **Step 1: Add explicit image names to compose**

Add image fields for API/Admin/Merchant/Portal using `${WELFARE_MALL_IMAGE_TAG:-local}`.

- [x] **Step 2: Add git-derived tag default to image build preflight**

Update `tools/verify-docker-image-build.ps1` so it sets `WELFARE_MALL_IMAGE_TAG=git-<short-sha>` when the caller has not supplied a tag, then verifies each expected image exists after build.

- [x] **Step 3: Update deployment docs**

Document that image-build preflight emits a release image tag and that the result template must capture it.

- [x] **Step 4: Run GREEN Docker runtime verifier**

Run:

```powershell
pnpm run verify:docker-runtime
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused Docker and deployment gates**

Run:

```powershell
pnpm run verify:docker-runtime
pnpm run docker:image-build:preflight
pnpm run target:deployment:handoff
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

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docker-compose.yml tools/verify-docker-runtime.cjs tools/verify-docker-image-build.ps1 docs/deployment docs/superpowers/plans/2026-06-04-docker-release-image-tags.md
git commit -m "build: add docker release image tags"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/docker-release-image-tags
```

Expected: branch is pushed and PR targets `main`.

## Acceptance Boundary

This slice tags local Docker build artifacts for release traceability and rollback documentation. It does not deploy to a target server, push images to a registry, provision domains or TLS, run live target smoke, run WeChat DevTools, verify true-device behavior, execute real payment/refund providers, or complete formal business acceptance.
