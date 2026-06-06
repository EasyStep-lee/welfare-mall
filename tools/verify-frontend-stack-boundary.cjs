#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const migrationStatusPath = path.join(rootDir, 'docs/frontend-stack-migration-status.json');
const reactDependencies = new Set(['react', 'react-dom', '@vitejs/plugin-react', 'lucide-react', '@testing-library/react']);
const requiredVueDependencies = {
  '@welfare-mall/admin': ['vue', 'element-plus', 'pinia', '@vitejs/plugin-vue'],
  '@welfare-mall/merchant': ['vue', 'element-plus', 'pinia', '@vitejs/plugin-vue'],
  '@welfare-mall/portal': ['vue', '@vitejs/plugin-vue']
};

const failures = [];

const migrationStatus = readJson(migrationStatusPath);
const allowedReactPackages = new Set(migrationStatus.allowedReactWorkspacePackages ?? []);
const packagePaths = findPackageJsonFiles(path.join(rootDir, 'apps'));

if (!['in_progress', 'enforced'].includes(migrationStatus.migrationStatus)) {
  failures.push('docs/frontend-stack-migration-status.json must set migrationStatus to in_progress or enforced.');
}

for (const packagePath of packagePaths) {
  const packageJson = readJson(packagePath);
  const packageName = packageJson.name;
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };
  const usedReactDependencies = Object.keys(dependencies).filter((dependency) => reactDependencies.has(dependency));

  if (usedReactDependencies.length > 0 && !allowedReactPackages.has(packageName)) {
    failures.push(`${relative(packagePath)} uses forbidden React dependencies: ${usedReactDependencies.join(', ')}`);
  }

  const requiredDependencies = requiredVueDependencies[packageName] ?? [];
  if (migrationStatus.migrationStatus === 'enforced' && requiredDependencies.length > 0) {
    const missingDependencies = requiredDependencies.filter((dependency) => dependencies[dependency] === undefined);
    if (missingDependencies.length > 0) {
      failures.push(`${relative(packagePath)} is missing required Vue stack dependencies: ${missingDependencies.join(', ')}`);
    }
    if (usedReactDependencies.length > 0) {
      failures.push(`${relative(packagePath)} must not use React dependencies after stack enforcement.`);
    }
  }
}

for (const packageName of Object.keys(requiredVueDependencies)) {
  const packageJson = packagePaths.map(readJson).find((candidate) => candidate.name === packageName);
  if (!packageJson) {
    failures.push(`Missing expected workspace package ${packageName}.`);
  }
}

if (migrationStatus.migrationStatus === 'enforced') {
  for (const sourcePath of findSourceFiles(path.join(rootDir, 'apps'))) {
    const contents = fs.readFileSync(sourcePath, 'utf8');
    if (/from\s+['"]react['"]|from\s+['"]lucide-react['"]|require\(['"]react['"]\)/u.test(contents)) {
      failures.push(`${relative(sourcePath)} imports a forbidden React runtime package.`);
    }
    if (sourcePath.endsWith('.tsx')) {
      failures.push(`${relative(sourcePath)} is TSX; Admin and Merchant must be Vue SFC/TS after enforcement.`);
    }
  }
}

if (failures.length > 0) {
  console.error('Frontend stack boundary check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Frontend stack boundary check passed (${migrationStatus.migrationStatus}).`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function findPackageJsonFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, 'package.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function findSourceFiles(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...findSourceFiles(entryPath));
      continue;
    }
    if (/\.(ts|tsx|js|jsx|vue)$/u.test(entry.name)) {
      results.push(entryPath);
    }
  }
  return results;
}

function relative(filePath) {
  return path.relative(rootDir, filePath).replaceAll(path.sep, '/');
}
