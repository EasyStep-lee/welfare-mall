const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { readOption } = require('./target-runtime-env.cjs');

const root = path.resolve(__dirname, '..');
const defaultAcceptanceTemplatePath = path.join(root, 'docs', 'deployment', 'target-runtime-acceptance-result-template.md');

const requiredSections = [
  '# Target Runtime Acceptance Result Template',
  '## Acceptance Metadata',
  '## Browser Acceptance Evidence',
  '## WeChat DevTools Evidence',
  '## True-Device Mini-Program Evidence',
  '## Real Payment And Refund Provider Evidence',
  '## Business Signoff',
  '## Verification Command',
  '## Forbidden Claims'
];

const requiredCommandSnippets = [
  'pnpm run target:acceptance:result:verify -- --acceptance-file',
  '--require-complete'
];

const requiredFields = [
  'Target environment',
  'Acceptance date',
  'Accepted deployment commit SHA',
  'Accepted by',
  'Deployment result file',
  'Admin browser acceptance status',
  'Admin browser acceptance timestamp',
  'Admin browser acceptance operator',
  'Admin browser acceptance evidence',
  'Merchant browser acceptance status',
  'Merchant browser acceptance timestamp',
  'Merchant browser acceptance operator',
  'Merchant browser acceptance evidence',
  'Portal browser acceptance status',
  'Portal browser acceptance timestamp',
  'Portal browser acceptance operator',
  'Portal browser acceptance evidence',
  'WeChat DevTools compilation status',
  'WeChat DevTools compilation timestamp',
  'WeChat DevTools compilation operator',
  'WeChat DevTools compilation evidence',
  'true-device mini-program acceptance status',
  'true-device mini-program acceptance timestamp',
  'true-device mini-program acceptance operator',
  'true-device mini-program acceptance evidence',
  'true-device covered flows',
  'real payment provider acceptance status',
  'real payment provider acceptance timestamp',
  'real payment provider acceptance operator',
  'real payment provider acceptance evidence',
  'real refund provider acceptance status',
  'real refund provider acceptance timestamp',
  'real refund provider acceptance operator',
  'real refund provider acceptance evidence',
  'business signoff status',
  'business signoff timestamp',
  'business signoff operator',
  'business signoff evidence'
];

const statusFields = requiredFields.filter((fieldName) => fieldName.endsWith(' status'));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasFlag(argv, flagName) {
  return argv.includes(flagName);
}

function resolveAcceptanceFile(argv) {
  const acceptanceFile = readOption(argv, '--acceptance-file');
  if (!acceptanceFile) {
    return defaultAcceptanceTemplatePath;
  }

  return path.resolve(root, acceptanceFile);
}

function readMarkdown(filePath) {
  assert(fs.existsSync(filePath), `Target acceptance result file does not exist: ${filePath}`);
  return fs.readFileSync(filePath, 'utf8');
}

function parseFieldMap(body) {
  const fields = new Map();
  for (const rawLine of body.split(/\r?\n/)) {
    const match = rawLine.match(/^- ([^:]+):\s*(.*)$/);
    if (match) {
      fields.set(match[1].trim(), match[2].trim());
    }
  }
  return fields;
}

function assertStaticTemplate(body, fileLabel) {
  for (const section of requiredSections) {
    assert(body.includes(section), `${fileLabel} is missing required section: ${section}`);
  }

  for (const snippet of requiredCommandSnippets) {
    assert(body.includes(snippet), `${fileLabel} is missing required command: ${snippet}`);
  }

  const fields = parseFieldMap(body);
  for (const fieldName of requiredFields) {
    assert(fields.has(fieldName), `${fileLabel} is missing field: ${fieldName}`);
  }
}

function requireField(fields, fieldName) {
  assert(fields.has(fieldName), `Missing acceptance result field: ${fieldName}`);
  const value = fields.get(fieldName);
  assert(value, `${fieldName} is required`);
  return value;
}

function assertConcrete(value, label) {
  assert(!/[<>{}]/.test(value), `${label} must not contain placeholder brackets`);
  assert(!/\b(tbd|todo|n\/a|pending)\b/i.test(value), `${label} must be concrete`);
  assert(!value.includes('example.com'), `${label} must not use example.com`);
}

function assertSha(value) {
  assert(/^[0-9a-f]{7,40}$/i.test(value), 'Accepted deployment commit SHA must look like a git SHA');
}

function verifyCompletedAcceptance(body) {
  const fields = parseFieldMap(body);
  for (const fieldName of requiredFields) {
    const value = requireField(fields, fieldName);
    assertConcrete(value, fieldName);
  }

  assertSha(requireField(fields, 'Accepted deployment commit SHA'));
  assert(
    requireField(fields, 'Deployment result file') === 'docs/deployment/target-runtime-deployment-result.md',
    'Deployment result file must be docs/deployment/target-runtime-deployment-result.md'
  );

  for (const fieldName of statusFields) {
    assert(requireField(fields, fieldName) === 'COMPLETE', `${fieldName} must be COMPLETE`);
  }

  const trueDeviceFlows = requireField(fields, 'true-device covered flows');
  for (const requiredFlow of ['browse', 'checkout', 'payment initiation', 'order detail', 'refund request']) {
    assert(trueDeviceFlows.includes(requiredFlow), `true-device covered flows must include ${requiredFlow}`);
  }
}

function buildCompletedFixture() {
  return `# Target Runtime Acceptance Result Template

## Acceptance Metadata

- Target environment: staging
- Acceptance date: 2026-06-04T09:00:00Z
- Accepted deployment commit SHA: abcdef1234567890abcdef1234567890abcdef12
- Accepted by: business-owner
- Deployment result file: docs/deployment/target-runtime-deployment-result.md

## Browser Acceptance Evidence

- Admin browser acceptance status: COMPLETE
- Admin browser acceptance timestamp: 2026-06-04T09:05:00Z
- Admin browser acceptance operator: admin-operator
- Admin browser acceptance evidence: order management walkthrough recorded
- Merchant browser acceptance status: COMPLETE
- Merchant browser acceptance timestamp: 2026-06-04T09:10:00Z
- Merchant browser acceptance operator: merchant-operator
- Merchant browser acceptance evidence: fulfillment walkthrough recorded
- Portal browser acceptance status: COMPLETE
- Portal browser acceptance timestamp: 2026-06-04T09:15:00Z
- Portal browser acceptance operator: portal-operator
- Portal browser acceptance evidence: catalog inspection recorded

## WeChat DevTools Evidence

- WeChat DevTools compilation status: COMPLETE
- WeChat DevTools compilation timestamp: 2026-06-04T09:20:00Z
- WeChat DevTools compilation operator: mini-program-operator
- WeChat DevTools compilation evidence: DevTools compile log recorded

## True-Device Mini-Program Evidence

- true-device mini-program acceptance status: COMPLETE
- true-device mini-program acceptance timestamp: 2026-06-04T09:25:00Z
- true-device mini-program acceptance operator: device-operator
- true-device mini-program acceptance evidence: true-device video and order numbers recorded
- true-device covered flows: browse, checkout, payment initiation, order detail, refund request

## Real Payment And Refund Provider Evidence

- real payment provider acceptance status: COMPLETE
- real payment provider acceptance timestamp: 2026-06-04T09:30:00Z
- real payment provider acceptance operator: finance-operator
- real payment provider acceptance evidence: provider payment transaction recorded
- real refund provider acceptance status: COMPLETE
- real refund provider acceptance timestamp: 2026-06-04T09:35:00Z
- real refund provider acceptance operator: finance-operator
- real refund provider acceptance evidence: provider refund transaction recorded

## Business Signoff

- business signoff status: COMPLETE
- business signoff timestamp: 2026-06-04T09:40:00Z
- business signoff operator: business-owner
- business signoff evidence: signed acceptance record stored

## Verification Command

\`\`\`powershell
pnpm run target:acceptance:result:verify -- --acceptance-file .\\docs\\deployment\\target-runtime-acceptance-result.md --require-complete
\`\`\`

## Forbidden Claims

- Admin browser accepted
- Merchant browser accepted
- Portal browser accepted
- WeChat DevTools accepted
- true-device accepted
- real payment accepted
- real refund accepted
- formal business acceptance completed
`;
}

function verifyAcceptanceFile(filePath, options) {
  const fileLabel = path.relative(root, filePath) || filePath;
  const body = readMarkdown(filePath);
  assertStaticTemplate(body, fileLabel);

  if (options.requireComplete) {
    verifyCompletedAcceptance(body);
  }
}

function runSelfTest() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'welfare-mall-acceptance-'));
  const completedPath = path.join(tmpDir, 'target-runtime-acceptance-result.md');
  fs.writeFileSync(completedPath, buildCompletedFixture(), 'utf8');
  verifyAcceptanceFile(completedPath, { requireComplete: true });

  let failedAsExpected = false;
  try {
    verifyAcceptanceFile(defaultAcceptanceTemplatePath, { requireComplete: true });
  } catch (error) {
    failedAsExpected = error.message.includes('Target environment is required');
  }
  assert(failedAsExpected, 'empty acceptance template should fail completed acceptance verification');
}

function main() {
  const argv = process.argv.slice(2);
  if (hasFlag(argv, '--self-test')) {
    runSelfTest();
  }

  const acceptanceFilePath = resolveAcceptanceFile(argv);
  verifyAcceptanceFile(acceptanceFilePath, {
    requireComplete: Boolean(readOption(argv, '--acceptance-file')) && hasFlag(argv, '--require-complete')
  });
  console.log(`Target acceptance result verified: ${path.relative(root, acceptanceFilePath) || acceptanceFilePath}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
