const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readOption, validateTargetRuntimeEnv } = require('./target-runtime-env.cjs');

const root = path.resolve(__dirname, '..');
const defaultResultTemplatePath = path.join(root, 'docs', 'deployment', 'target-runtime-deployment-result-template.md');

const requiredSections = [
  '# Target Runtime Deployment Result Template',
  '## Deployment Metadata',
  '## Local Readiness Already Verified',
  '## Target Runtime Smoke Evidence',
  '## Manual And True-Device Acceptance Pending',
  '## Rollback Record',
  '## Forbidden Claims'
];

const requiredCommandSnippets = [
  'pnpm run target:deployment:result:verify',
  'pnpm run target:runtime:env-check -- --env-file',
  'node tools/verify-target-runtime-smoke.cjs --live --env-file',
  '--require-real-values'
];

const requiredDeploymentFields = [
  'Target environment',
  'Deployment date',
  'Deployed commit SHA',
  'Deployed by',
  'Release image tag',
  'Release image registry',
  'API image ref',
  'Admin image ref',
  'Merchant image ref',
  'Portal image ref',
  'API base URL',
  'Admin URL',
  'Merchant URL',
  'Portal URL'
];

const requiredLocalEvidenceFields = [
  'Local verification timestamp',
  'Target deployment preflight result',
  'Docker image build preflight result',
  'Docker image tag',
  'Docker image registry',
  'Docker full image refs',
  'Docker release manifest',
  'Docker registry push plan',
  'Docker order-flow smoke order number'
];

const requiredSmokeFields = [
  'Env-file check result',
  'Smoke timestamp',
  'API health result',
  'Admin asset result',
  'Merchant asset result',
  'Portal asset result',
  'Overall result'
];

const requiredAcceptanceFields = [
  'Admin browser acceptance',
  'Merchant browser acceptance',
  'Portal browser acceptance',
  'WeChat DevTools compilation',
  'true-device mini-program acceptance',
  'real payment/refund provider acceptance',
  'business signoff'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasFlag(argv, flagName) {
  return argv.includes(flagName);
}

function resolveResultFile(argv) {
  const resultFile = readOption(argv, '--result-file');
  if (!resultFile) {
    return defaultResultTemplatePath;
  }

  return path.resolve(root, resultFile);
}

function readMarkdown(filePath) {
  assert(fs.existsSync(filePath), `Target deployment result file does not exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function assertStaticTemplate(body, fileLabel) {
  for (const section of requiredSections) {
    assert(body.includes(section), `${fileLabel} is missing required section: ${section}`);
  }

  for (const commandSnippet of requiredCommandSnippets) {
    assert(body.includes(commandSnippet), `${fileLabel} is missing required command: ${commandSnippet}`);
  }
}

function parseFieldMap(body) {
  const fields = new Map();
  for (const rawLine of body.split(/\r?\n/)) {
    const match = rawLine.match(/^- ([^:]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    fields.set(match[1].trim(), match[2].trim());
  }
  return fields;
}

function requireField(fields, fieldName) {
  assert(fields.has(fieldName), `Missing deployment result field: ${fieldName}`);
  const value = fields.get(fieldName);
  assert(value, `${fieldName} is required`);
  return value;
}

function assertLooksConcrete(value, label, options = {}) {
  assert(!/[<>{}]/.test(value), `${label} must not contain placeholder brackets`);
  assert(!/\b(tbd|todo|n\/a)\b/i.test(value), `${label} must be concrete`);
  if (options.requireRealValues) {
    assert(!value.includes('example.com'), `${label} must not use example.com when --require-real-values is enabled`);
  }
}

function assertHttpUrl(value, label, options) {
  assertLooksConcrete(value, label, options);
  let parsedUrl;
  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL`);
  }

  assert(['http:', 'https:'].includes(parsedUrl.protocol), `${label} must use http or https`);
  return parsedUrl;
}

function assertSha(value) {
  assert(/^[0-9a-f]{7,40}$/i.test(value), 'Deployed commit SHA must look like a git SHA');
}

function assertImageRef(value, serviceName, registry, tag, options) {
  assertLooksConcrete(value, `${serviceName} image ref`, options);
  assert(value.startsWith(`${registry}/`), `${serviceName} image ref must use ${registry}`);
  assert(value.endsWith(`:${tag}`), `${serviceName} image ref must use tag ${tag}`);
}

function assertFilledFields(fields, fieldNames, options) {
  for (const fieldName of fieldNames) {
    const value = requireField(fields, fieldName);
    assertLooksConcrete(value, fieldName, options);
  }
}

function verifyFilledResult(body, fileLabel, options) {
  const fields = parseFieldMap(body);
  assertFilledFields(fields, requiredDeploymentFields, options);
  assertFilledFields(fields, requiredLocalEvidenceFields, options);
  assertFilledFields(fields, requiredSmokeFields, options);
  assertFilledFields(fields, requiredAcceptanceFields, { requireRealValues: false });

  const commitSha = requireField(fields, 'Deployed commit SHA');
  assertSha(commitSha);

  const imageTag = requireField(fields, 'Release image tag');
  const imageRegistry = requireField(fields, 'Release image registry');
  assertLooksConcrete(imageTag, 'Release image tag', options);
  assertLooksConcrete(imageRegistry, 'Release image registry', options);
  assert(!/^https?:\/\//.test(imageRegistry), 'Release image registry must not include a URL scheme');

  assertImageRef(requireField(fields, 'API image ref'), 'API', imageRegistry, imageTag, options);
  assertImageRef(requireField(fields, 'Admin image ref'), 'Admin', imageRegistry, imageTag, options);
  assertImageRef(requireField(fields, 'Merchant image ref'), 'Merchant', imageRegistry, imageTag, options);
  assertImageRef(requireField(fields, 'Portal image ref'), 'Portal', imageRegistry, imageTag, options);

  const apiBaseUrl = requireField(fields, 'API base URL');
  const adminUrl = requireField(fields, 'Admin URL');
  const merchantUrl = requireField(fields, 'Merchant URL');
  const portalUrl = requireField(fields, 'Portal URL');
  validateTargetRuntimeEnv(
    {
      TARGET_API_BASE_URL: apiBaseUrl,
      TARGET_ADMIN_URL: adminUrl,
      TARGET_MERCHANT_URL: merchantUrl,
      TARGET_PORTAL_URL: portalUrl,
      TARGET_EXPECTED_API_SERVICE: 'welfare-mall-api'
    },
    {
      fileLabel,
      requireRealValues: options.requireRealValues
    }
  );
}

function buildValidResultFixture() {
  const registry = 'registry.internal/welfare-mall';
  const tag = 'git-123456789abc';
  return `# Target Runtime Deployment Result Template

## Deployment Metadata

- Target environment: staging
- Deployment date: 2026-06-04T08:00:00Z
- Deployed commit SHA: 123456789abcdef123456789abcdef123456789a
- Deployed by: release-operator
- Release image tag: ${tag}
- Release image registry: ${registry}
- API image ref: ${registry}/welfare-mall-v2-api:${tag}
- Admin image ref: ${registry}/welfare-mall-v2-admin:${tag}
- Merchant image ref: ${registry}/welfare-mall-v2-merchant:${tag}
- Portal image ref: ${registry}/welfare-mall-v2-portal:${tag}
- API base URL: https://api.welfare.local/api
- Admin URL: https://admin.welfare.local/
- Merchant URL: https://merchant.welfare.local/
- Portal URL: https://portal.welfare.local/

## Local Readiness Already Verified

\`\`\`powershell
pnpm run target:deployment:result:verify -- --result-file .\\docs\\deployment\\target-runtime-deployment-result.md --require-real-values
pnpm run target:runtime:env-check -- --env-file .\\deploy\\target-runtime.env --require-real-values
node tools/verify-target-runtime-smoke.cjs --live --env-file .\\deploy\\target-runtime.env --require-real-values
\`\`\`

- Local verification timestamp: 2026-06-04T07:50:00Z
- Target deployment preflight result: PASS
- Docker image build preflight result: PASS
- Docker image tag: ${tag}
- Docker image registry: ${registry}
- Docker full image refs: all four refs recorded
- Docker release manifest: PASS
- Docker registry push plan: PASS
- Docker order-flow smoke order number: ORDER-20260604080000000-ABCDEF
- Notes: none

## Target Runtime Smoke Evidence

- Env-file check result: PASS
- Smoke timestamp: 2026-06-04T08:10:00Z
- API health result: welfare-mall-api
- Admin asset result: PASS
- Merchant asset result: PASS
- Portal asset result: PASS
- Overall result: PASS

## Manual And True-Device Acceptance Pending

- Admin browser acceptance: PENDING
- Merchant browser acceptance: PENDING
- Portal browser acceptance: PENDING
- WeChat DevTools compilation: PENDING
- true-device mini-program acceptance: PENDING
- real payment/refund provider acceptance: PENDING
- business signoff: PENDING

## Rollback Record

- Rollback decision time:
- Failure summary:
- Failed commit SHA:
- Restored commit/image/tag:
- Rollback command or platform action:
- Post-rollback API health:
- Post-rollback frontend smoke:
- Remaining follow-up:

## Forbidden Claims

- target environment deployed
- target runtime accepted
- real payment/refund completed
- WeChat DevTools accepted
- true-device accepted
- formal business acceptance completed
`;
}

function verifyResultFile(filePath, options) {
  const fileLabel = path.relative(root, filePath) || filePath;
  const body = readMarkdown(filePath);
  assertStaticTemplate(body, fileLabel);

  if (options.verifyFilledResult) {
    verifyFilledResult(body, fileLabel, options);
  }
}

function runSelfTest() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'welfare-mall-target-result-'));
  const validResultPath = path.join(tmpDir, 'target-runtime-deployment-result.md');
  fs.writeFileSync(validResultPath, buildValidResultFixture(), 'utf8');
  verifyResultFile(validResultPath, { verifyFilledResult: true, requireRealValues: true });

  let failedAsExpected = false;
  try {
    verifyResultFile(defaultResultTemplatePath, { verifyFilledResult: true, requireRealValues: true });
  } catch (error) {
    failedAsExpected = error.message.includes('Target environment is required');
  }
  assert(failedAsExpected, 'empty result template should fail filled-result verification');
}

function main() {
  const argv = process.argv.slice(2);
  const resultFilePath = resolveResultFile(argv);
  const verifyFilled = Boolean(readOption(argv, '--result-file'));
  const options = {
    verifyFilledResult: verifyFilled,
    requireRealValues: hasFlag(argv, '--require-real-values')
  };

  if (hasFlag(argv, '--self-test')) {
    runSelfTest();
  }

  verifyResultFile(resultFilePath, options);
  console.log(`Target deployment result verified: ${path.relative(root, resultFilePath) || resultFilePath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
