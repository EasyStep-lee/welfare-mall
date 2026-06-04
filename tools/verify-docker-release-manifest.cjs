const { execFileSync } = require('node:child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readManifest(args) {
  const output = execFileSync('node', ['tools/print-docker-release-manifest.cjs', ...args], { encoding: 'utf8' });
  return JSON.parse(output);
}

function main() {
  const registryManifest = readManifest([
    '--tag',
    'manual-test',
    '--registry',
    'registry.example.com/welfare-mall'
  ]);

  assert(registryManifest.imageRegistry === 'registry.example.com/welfare-mall', 'imageRegistry was not recorded');
  assert(
    registryManifest.imageRegistryPrefix === 'registry.example.com/welfare-mall/',
    'imageRegistryPrefix was not normalized'
  );
  assert(
    registryManifest.images.api === 'registry.example.com/welfare-mall/welfare-mall-v2-api:manual-test',
    `unexpected api image ref: ${registryManifest.images.api}`
  );
  assert(
    registryManifest.images.admin === 'registry.example.com/welfare-mall/welfare-mall-v2-admin:manual-test',
    `unexpected admin image ref: ${registryManifest.images.admin}`
  );
  assert(
    registryManifest.images.merchant === 'registry.example.com/welfare-mall/welfare-mall-v2-merchant:manual-test',
    `unexpected merchant image ref: ${registryManifest.images.merchant}`
  );
  assert(
    registryManifest.images.portal === 'registry.example.com/welfare-mall/welfare-mall-v2-portal:manual-test',
    `unexpected portal image ref: ${registryManifest.images.portal}`
  );
  assert(
    registryManifest.commands.imageBuildPreflight.includes('WELFARE_MALL_IMAGE_REGISTRY=registry.example.com/welfare-mall'),
    'image build preflight command does not carry the registry'
  );

  const localManifest = readManifest(['--tag', 'manual-test']);
  assert(localManifest.imageRegistry === null, 'local manifest should not force a registry');
  assert(localManifest.imageRegistryPrefix === '', 'local manifest should not force a registry prefix');
  assert(localManifest.images.api === 'welfare-mall-v2-api:manual-test', 'local manifest image ref changed');

  console.log('Docker release manifest verified.');
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
