const { execFileSync } = require('node:child_process');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readOption(argv, flagName) {
  const index = argv.indexOf(flagName);
  if (index === -1) {
    return undefined;
  }

  const value = argv[index + 1];
  assert(value && !value.startsWith('--'), `${flagName} requires a value`);
  return value;
}

function runManifest(args) {
  const output = execFileSync('node', ['tools/print-docker-release-manifest.cjs', ...args], { encoding: 'utf8' });
  return JSON.parse(output);
}

function buildPushPlan(argv) {
  const registry = readOption(argv, '--registry') || process.env.WELFARE_MALL_IMAGE_REGISTRY;
  assert(registry && registry.trim(), 'A Docker registry is required. Pass --registry or set WELFARE_MALL_IMAGE_REGISTRY.');

  const manifestArgs = ['--registry', registry.trim()];
  const tag = readOption(argv, '--tag') || process.env.WELFARE_MALL_IMAGE_TAG;
  if (tag) {
    manifestArgs.push('--tag', tag);
  }

  const manifest = runManifest(manifestArgs);
  const imageRefs = Object.values(manifest.images);

  return {
    commitSha: manifest.commitSha,
    shortSha: manifest.shortSha,
    imageTag: manifest.imageTag,
    imageRegistry: manifest.imageRegistry,
    images: manifest.images,
    commands: {
      loginReminder: `docker login ${manifest.imageRegistry}`,
      build: manifest.commands.imageBuildPreflight,
      inspect: imageRefs.map((imageRef) => `docker image inspect ${imageRef}`),
      push: imageRefs.map((imageRef) => `docker push ${imageRef}`)
    },
    targetExecutionStatus: 'pending',
    boundary:
      'This push plan is dry-run evidence only; it does not run docker push, deploy, or accept the target environment.'
  };
}

function main() {
  const pushPlan = buildPushPlan(process.argv.slice(2));
  console.log(JSON.stringify(pushPlan, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
