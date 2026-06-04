const { execFileSync } = require('node:child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readPackage(args) {
  const output = execFileSync('node', ['tools/print-target-deployment-package.cjs', ...args], { encoding: 'utf8' });
  return JSON.parse(output);
}

function main() {
  const deploymentPackage = readPackage([
    '--registry',
    'registry.example.com/welfare-mall',
    '--tag',
    'manual-test'
  ]);

  const expectedImages = {
    api: 'registry.example.com/welfare-mall/welfare-mall-v2-api:manual-test',
    admin: 'registry.example.com/welfare-mall/welfare-mall-v2-admin:manual-test',
    merchant: 'registry.example.com/welfare-mall/welfare-mall-v2-merchant:manual-test',
    portal: 'registry.example.com/welfare-mall/welfare-mall-v2-portal:manual-test'
  };

  assert(deploymentPackage.imageRegistry === 'registry.example.com/welfare-mall', 'registry mismatch');
  assert(deploymentPackage.imageTag === 'manual-test', 'image tag mismatch');
  assert(JSON.stringify(deploymentPackage.images) === JSON.stringify(expectedImages), 'image refs mismatch');
  assert(deploymentPackage.registryPushPlan.commands.push.length === 4, 'expected four docker push commands');
  for (const imageRef of Object.values(expectedImages)) {
    assert(
      deploymentPackage.registryPushPlan.commands.push.includes(`docker push ${imageRef}`),
      `missing push command for ${imageRef}`
    );
  }

  const requiredCommands = [
    'pnpm run target:deployment:preflight -- --require-main --require-clean',
    'pnpm run docker:release:manifest -- --registry registry.example.com/welfare-mall',
    'pnpm run docker:registry:push-plan -- --registry registry.example.com/welfare-mall',
    'pnpm run target:runtime:env-check -- --env-file .\\deploy\\target-runtime.env --require-real-values',
    'node tools/verify-target-runtime-smoke.cjs --live --env-file .\\deploy\\target-runtime.env --require-real-values',
    'pnpm run target:deployment:result:verify -- --result-file .\\docs\\deployment\\target-runtime-deployment-result.md --require-real-values'
  ];
  const commandValues = Object.values(deploymentPackage.targetCommands);
  for (const requiredCommand of requiredCommands) {
    assert(commandValues.includes(requiredCommand), `missing target command: ${requiredCommand}`);
  }

  assert(deploymentPackage.evidenceFiles.resultFile === 'docs/deployment/target-runtime-deployment-result.md', 'result file path mismatch');
  assert(deploymentPackage.pendingAcceptance.includes('formal business acceptance'), 'formal acceptance boundary missing');
  assert(deploymentPackage.targetExecutionStatus === 'pending', 'target execution status changed');

  let failedAsExpected = false;
  try {
    execFileSync('node', ['tools/print-target-deployment-package.cjs'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    failedAsExpected = error.status === 1 && String(error.stderr).includes('A Docker registry is required');
  }
  assert(failedAsExpected, 'missing-registry package command should fail');

  console.log('Target deployment package verified.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
