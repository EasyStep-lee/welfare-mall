# Target Runtime Deployment Runbook

## Local Readiness Already Verified

Use this runbook only after the local gates below have passed on `main`:

```powershell
pnpm run verify
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
pnpm run target:runtime:smoke
```

Local readiness means the repository, local Docker runtime, frontend assets, and local order-flow smoke are ready for target deployment preparation. It does not mean the target environment has been deployed or accepted.

## Target Environment Inputs

Before target execution, prepare a real env file from `deploy/target-runtime.env.example` with these values:

```powershell
TARGET_API_BASE_URL=https://api.example.com/api
TARGET_ADMIN_URL=https://admin.example.com/
TARGET_MERCHANT_URL=https://merchant.example.com/
TARGET_PORTAL_URL=https://portal.example.com/
TARGET_EXPECTED_API_SERVICE=welfare-mall-api
```

The API base URL must include the `/api` prefix because the runtime smoke calls `{TARGET_API_BASE_URL}/health`.

## Target Execution Steps

1. Confirm the GitHub `main` commit to deploy and record it in `docs/deployment/target-runtime-deployment-result-template.md`.
2. Build and deploy API, Admin, Merchant, and Portal to the target environment using the target platform's approved release process.
3. Configure target environment variables so each frontend build embeds the same `TARGET_API_BASE_URL`.
4. Confirm database migrations or schema push steps are complete according to the target environment policy.
5. Export the target runtime smoke variables or source the prepared env file in the shell.
6. Run static smoke first:

```powershell
pnpm run target:runtime:smoke
```

7. Run live target smoke:

```powershell
node tools/verify-target-runtime-smoke.cjs --live
```

8. Record output, URLs, timestamps, commit SHA, and any deviations in the result template.

## Target Runtime Smoke Evidence

The live target smoke must prove:

- API health returns `welfare-mall-api`
- Admin URL returns an HTML shell
- Merchant URL returns an HTML shell
- Portal URL returns an HTML shell
- each frontend exposes a built JavaScript asset
- each frontend asset contains the configured `TARGET_API_BASE_URL`

## Manual And True-Device Acceptance Pending

After live smoke passes, the following remain pending until separately executed and recorded:

- Admin browser login and order-management walk-through
- Merchant browser login and fulfillment walk-through
- Portal browser catalog inspection
- user mini-program WeChat DevTools compilation
- true-device mini-program browse, checkout, payment initiation, order detail, and refund request checks
- real payment/refund provider execution where applicable
- business signoff by the responsible operator

## Rollback Steps

If target smoke fails after deployment:

1. Stop traffic or remove public entry where the target platform allows it.
2. Restore the previous known-good deployment artifact or image tag.
3. Restore the previous frontend API base URL configuration if it changed.
4. Confirm API health and frontend shells on the rollback version.
5. Record the failed commit, rollback commit, failure output, and restored URLs in the result template.

## Forbidden Claims

Do not claim any of the following from local or static checks alone:

- target environment deployed
- target runtime accepted
- real payment/refund completed
- WeChat DevTools accepted
- true-device accepted
- formal business acceptance completed
