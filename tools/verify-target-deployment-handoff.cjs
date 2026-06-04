const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

const requiredDocuments = [
  {
    path: 'docs/deployment/target-runtime-deployment-runbook.md',
    snippets: [
      '# Target Runtime Deployment Runbook',
      '## Local Readiness Already Verified',
      '## Target Environment Inputs',
      '## Target Execution Steps',
      '## Target Runtime Smoke Evidence',
      '## Manual And True-Device Acceptance Pending',
      '## Rollback Steps',
      '## Forbidden Claims',
      'pnpm run target:acceptance:result:verify -- --acceptance-file',
      'pnpm run target:runtime:env-check',
      'pnpm run target:runtime:env-check -- --env-file',
      '--require-real-values',
      'pnpm run target:runtime:smoke',
      'node tools/verify-target-runtime-smoke.cjs --live --env-file',
      'pnpm run target:deployment:preflight',
      'pnpm run docker:image-build:preflight',
      'pnpm run target:deployment:package -- --registry',
      'pnpm run docker:release:manifest',
      'pnpm run docker:registry:push-plan -- --registry',
      'pnpm run docker:runtime:smoke',
      'pnpm run docker:page-smoke',
      'pnpm run docker:order-flow-smoke',
      'pnpm run target:deployment:result:verify -- --result-file'
    ]
  },
  {
    path: 'docs/deployment/target-runtime-deployment-result-template.md',
    snippets: [
      '# Target Runtime Deployment Result Template',
      '## Deployment Metadata',
      '## Local Readiness Already Verified',
      '## Target Runtime Smoke Evidence',
      '## Manual And True-Device Acceptance Pending',
      '## Rollback Record',
      '## Forbidden Claims',
      'pnpm run target:runtime:env-check',
      'pnpm run target:runtime:env-check -- --env-file',
      '--require-real-values',
      'pnpm run target:runtime:smoke',
      'node tools/verify-target-runtime-smoke.cjs --live --env-file',
      'pnpm run target:deployment:preflight',
      'pnpm run docker:image-build:preflight',
      'pnpm run target:deployment:package -- --registry',
      'pnpm run docker:release:manifest',
      'pnpm run docker:registry:push-plan -- --registry',
      'pnpm run docker:runtime:smoke',
      'pnpm run docker:page-smoke',
      'pnpm run docker:order-flow-smoke',
      'pnpm run target:deployment:result:verify -- --result-file'
    ]
  },
  {
    path: 'docs/deployment/target-runtime-release-handoff.md',
    snippets: [
      '# Target Runtime Release Handoff',
      '## Local Readiness Already Verified',
      '## Target Environment Execution Pending',
      '## Target Runtime Smoke Evidence',
      '## Manual And True-Device Acceptance Pending',
      '## Rollback Steps',
      '## Forbidden Claims',
      'pnpm run target:acceptance:result:verify -- --acceptance-file',
      'pnpm run target:runtime:env-check',
      'pnpm run target:runtime:env-check -- --env-file',
      '--require-real-values',
      'pnpm run target:runtime:smoke',
      'node tools/verify-target-runtime-smoke.cjs --live --env-file',
      'pnpm run target:deployment:preflight',
      'pnpm run docker:image-build:preflight',
      'pnpm run target:deployment:package -- --registry',
      'pnpm run docker:release:manifest',
      'pnpm run docker:registry:push-plan -- --registry',
      'pnpm run docker:runtime:smoke',
      'pnpm run docker:page-smoke',
      'pnpm run docker:order-flow-smoke',
      'pnpm run target:deployment:result:verify -- --result-file'
    ]
  },
  {
    path: 'docs/deployment/target-runtime-acceptance-result-template.md',
    snippets: [
      '# Target Runtime Acceptance Result Template',
      '## Acceptance Metadata',
      '## Browser Acceptance Evidence',
      '## WeChat DevTools Evidence',
      '## True-Device Mini-Program Evidence',
      '## Real Payment And Refund Provider Evidence',
      '## Business Signoff',
      '## Verification Command',
      '## Forbidden Claims',
      'pnpm run target:acceptance:result:verify -- --acceptance-file',
      '--require-complete',
      'Admin browser accepted',
      'Merchant browser accepted',
      'Portal browser accepted',
      'WeChat DevTools accepted',
      'true-device accepted',
      'real payment accepted',
      'real refund accepted',
      'formal business acceptance completed'
    ]
  }
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verifyDocument(documentSpec) {
  const absolutePath = path.join(root, documentSpec.path);
  assert(fs.existsSync(absolutePath), `Missing deployment handoff document: ${documentSpec.path}`);

  const body = fs.readFileSync(absolutePath, 'utf8');
  for (const snippet of documentSpec.snippets) {
    assert(body.includes(snippet), `${documentSpec.path} is missing required text: ${snippet}`);
  }
}

function main() {
  for (const documentSpec of requiredDocuments) {
    verifyDocument(documentSpec);
  }

  console.log('Target deployment handoff verified.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
