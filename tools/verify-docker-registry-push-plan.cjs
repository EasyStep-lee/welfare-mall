const { execFileSync } = require('node:child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readPushPlan(args) {
  const output = execFileSync('node', ['tools/print-docker-registry-push-plan.cjs', ...args], { encoding: 'utf8' });
  return JSON.parse(output);
}

function main() {
  const pushPlan = readPushPlan([
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

  assert(pushPlan.imageRegistry === 'registry.example.com/welfare-mall', 'registry was not recorded');
  assert(pushPlan.imageTag === 'manual-test', 'tag override was not recorded');
  assert(JSON.stringify(pushPlan.images) === JSON.stringify(expectedImages), 'full image refs were not recorded');
  assert(pushPlan.commands.loginReminder === 'docker login registry.example.com/welfare-mall', 'login reminder mismatch');
  assert(pushPlan.commands.build.includes('WELFARE_MALL_IMAGE_REGISTRY=registry.example.com/welfare-mall'), 'build command missing registry');
  assert(pushPlan.commands.inspect.length === 4, 'expected four image inspect commands');
  assert(pushPlan.commands.push.length === 4, 'expected four docker push commands');
  for (const imageRef of Object.values(expectedImages)) {
    assert(pushPlan.commands.push.includes(`docker push ${imageRef}`), `missing push command for ${imageRef}`);
  }
  assert(pushPlan.targetExecutionStatus === 'pending', 'target execution boundary changed');

  const missingRegistry = execFileSync('node', ['tools/print-docker-registry-push-plan.cjs'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });

  assert(missingRegistry.length === 0, 'missing-registry command should not print stdout');
}

try {
  main();
  console.log('Docker registry push plan verified.');
} catch (error) {
  if (error.status === 1 && String(error.stderr).includes('A Docker registry is required')) {
    console.log('Docker registry push plan verified.');
    process.exit(0);
  }

  console.error(error.message);
  process.exit(1);
}
