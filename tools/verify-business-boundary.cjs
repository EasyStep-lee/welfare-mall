#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const constraintsPath = path.join(rootDir, 'docs/business-boundary-constraints.md');
const deviationsPath = path.join(rootDir, 'docs/business-boundary-known-deviations.json');

const requiredSnippets = [
  '平台 -> 加盟商 -> 商户 -> 商品/SKU -> 订单',
  '加盟商 is the real sales party, welfare-card issuer',
  '商户 publishes products, owns inventory/fulfillment work, and must have an actual address',
  '福利卡',
  '微信支付',
  '支付宝',
  'There is no offline-cash user payment path',
  '门店 and 商店 are not core subjects',
  'pickupStoreName',
  'Admin, Franchise, Merchant, and User login must drive business identity'
];

const riskyPatterns = [
  { name: 'store subject wording', regex: /门店|商店|本地自提点|\bpickupStoreName\b/u },
  { name: 'cash user-payment wording', regex: /\bcash\b|现金/u },
  { name: 'fixed local identity', regex: /\blocalBuyerUserId\b|\badminActorUserId\b|\bmerchantActorUserId\b|local-user-001|merchant-local-review/u }
];

const scanRoots = [
  'apps/api/src',
  'apps/admin/src',
  'apps/merchant/src',
  'apps/portal/src',
  'apps/user-miniprogram'
];

const failures = [];

const constraints = readTextIfExists(constraintsPath);
if (!constraints) {
  failures.push('Missing docs/business-boundary-constraints.md.');
} else {
  for (const snippet of requiredSnippets) {
    if (!constraints.includes(snippet)) {
      failures.push(`docs/business-boundary-constraints.md must include: ${snippet}`);
    }
  }
}

const deviations = readJsonIfExists(deviationsPath);
if (!deviations) {
  failures.push('Missing docs/business-boundary-known-deviations.json.');
} else if (!Array.isArray(deviations.deviations)) {
  failures.push('docs/business-boundary-known-deviations.json must contain a deviations array.');
}

const allowedDeviationFiles = new Set();
for (const deviation of deviations?.deviations ?? []) {
  if (!isNonEmptyString(deviation.file)) {
    failures.push('Each business-boundary deviation must include a file.');
    continue;
  }
  if (!isNonEmptyString(deviation.reason)) {
    failures.push(`${deviation.file} must include a non-empty reason.`);
  }
  if (!isNonEmptyString(deviation.nextAction)) {
    failures.push(`${deviation.file} must include a non-empty nextAction.`);
  }
  allowedDeviationFiles.add(normalizePath(deviation.file));
}

const riskyFiles = new Map();
for (const scanRoot of scanRoots) {
  const absoluteRoot = path.join(rootDir, scanRoot);
  if (!fs.existsSync(absoluteRoot)) {
    failures.push(`Business-boundary scan root is missing: ${scanRoot}`);
    continue;
  }

  for (const filePath of findSourceFiles(absoluteRoot)) {
    const contents = fs.readFileSync(filePath, 'utf8');
    const matchedPatterns = riskyPatterns.filter((pattern) => pattern.regex.test(contents)).map((pattern) => pattern.name);
    if (matchedPatterns.length === 0) {
      continue;
    }

    const relativePath = normalizePath(path.relative(rootDir, filePath));
    riskyFiles.set(relativePath, matchedPatterns);
    if (!allowedDeviationFiles.has(relativePath)) {
      failures.push(`${relativePath} contains business-boundary risk (${matchedPatterns.join(', ')}) but is not listed in docs/business-boundary-known-deviations.json.`);
    }
  }
}

for (const allowedFile of allowedDeviationFiles) {
  if (!riskyFiles.has(allowedFile)) {
    failures.push(`${allowedFile} is listed as a known business-boundary deviation but no longer contains a scanned risk. Remove or update the deviation entry.`);
  }
}

if (failures.length > 0) {
  console.error('Business boundary check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Business boundary check passed (${riskyFiles.size} known deviation files tracked).`);

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function findSourceFiles(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.vite', 'coverage'].includes(entry.name)) {
        continue;
      }
      results.push(...findSourceFiles(entryPath));
      continue;
    }
    if (/\.(ts|tsx|js|jsx|vue|mjs|wxml)$/u.test(entry.name)) {
      results.push(entryPath);
    }
  }
  return results;
}

function normalizePath(filePath) {
  return filePath.replaceAll(path.sep, '/');
}
