# API Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable NestJS API foundation for Welfare Mall V2 with health check, Prisma schema shell, Docker services, Jest smoke test, and OpenAPI document generation.

**Architecture:** `apps/api` becomes an independently runnable NestJS service inside the pnpm workspace. The API exposes a public health endpoint, generates OpenAPI JSON for future client generation, and prepares Prisma/MySQL/Redis infrastructure without implementing business domains yet.

**Tech Stack:** NestJS, TypeScript, Prisma, MySQL 8, Redis, Swagger/OpenAPI, Jest, Supertest, Docker Compose, pnpm workspace.

---

## File Structure

Create API files:

- `apps/api/package.json`: API package scripts and dependencies.
- `apps/api/tsconfig.json`: API TypeScript config.
- `apps/api/tsconfig.build.json`: build config.
- `apps/api/jest.config.ts`: Jest config.
- `apps/api/eslint.config.mjs`: ESLint flat config.
- `apps/api/nest-cli.json`: Nest build config.
- `apps/api/src/main.ts`: Nest bootstrap.
- `apps/api/src/app.module.ts`: root module.
- `apps/api/src/health/health.module.ts`: health module.
- `apps/api/src/health/health.controller.ts`: health endpoint.
- `apps/api/src/openapi/generate-openapi.ts`: OpenAPI JSON generator.
- `apps/api/test/health.e2e-spec.ts`: health endpoint e2e test.
- `apps/api/prisma/schema.prisma`: initial Prisma schema shell.
- `apps/api/.env.example`: local API env example.

Modify root files:

- `package.json`: add workspace-aware scripts.
- `pnpm-workspace.yaml`: already includes `apps/*`.
- `docker-compose.yml`: local MySQL and Redis services for the API foundation.
- `.github/workflows/project-docs-check.yml`: include API verify command after API exists.

## Task 1: Verify Branch Baseline

**Files:**
- Read: `package.json`
- Read: `docs/superpowers/plans/2026-06-02-project-foundation.md`

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/api-foundation
codex/api-foundation
```

- [x] **Step 2: Run existing root verify**

Run:

```powershell
pnpm run verify
```

Expected: baseline root verification exits 0.

## Task 2: Add API Package and Dependencies

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/tsconfig.build.json`
- Create: `apps/api/jest.config.ts`
- Create: `apps/api/eslint.config.mjs`
- Create: `apps/api/nest-cli.json`
- Modify: `package.json`

- [x] **Step 1: Add API package manifest**

Create `apps/api/package.json`:

```json
{
  "name": "@welfare-mall/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "lint": "eslint \"src/**/*.ts\" \"test/**/*.ts\"",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "jest --config jest.config.ts",
    "test:e2e": "jest --config jest.config.ts --runInBand",
    "openapi:generate": "tsx src/openapi/generate-openapi.ts"
  },
  "dependencies": {
    "@nestjs/common": "11.1.3",
    "@nestjs/core": "11.1.3",
    "@nestjs/platform-express": "11.1.3",
    "@nestjs/swagger": "11.2.0",
    "@prisma/client": "6.9.0",
    "reflect-metadata": "0.2.2",
    "rxjs": "7.8.2"
  },
  "devDependencies": {
    "@nestjs/cli": "11.0.7",
    "@nestjs/testing": "11.1.3",
    "@types/express": "5.0.3",
    "@types/jest": "30.0.0",
    "@types/node": "24.0.0",
    "@types/supertest": "6.0.3",
    "@typescript-eslint/eslint-plugin": "8.33.1",
    "@typescript-eslint/parser": "8.33.1",
    "eslint": "9.28.0",
    "jest": "30.0.0",
    "prisma": "6.9.0",
    "source-map-support": "0.5.21",
    "supertest": "7.1.1",
    "ts-jest": "29.4.0",
    "ts-loader": "9.5.2",
    "ts-node": "10.9.2",
    "tsx": "4.19.4",
    "typescript": "5.8.3"
  },
  "prisma": {
    "schema": "prisma/schema.prisma"
  }
}
```

- [x] **Step 2: Add API TypeScript config**

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "outDir": "dist",
    "rootDir": ".",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "types": ["node", "jest"]
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "jest.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

Create `apps/api/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["test", "dist", "node_modules", "**/*.spec.ts", "**/*.e2e-spec.ts"]
}
```

- [x] **Step 3: Add Jest config**

Create `apps/api/jest.config.ts`:

```ts
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  testEnvironment: 'node'
};

export default config;
```

- [x] **Step 4: Add root workspace scripts**

Modify root `package.json` scripts:

```json
{
  "verify": "pnpm run lint && pnpm run typecheck && pnpm run test",
  "lint": "pnpm --filter @welfare-mall/api run lint",
  "typecheck": "pnpm --filter @welfare-mall/api run typecheck",
  "test": "pnpm --filter @welfare-mall/api run test",
  "build": "pnpm --filter @welfare-mall/api run build",
  "openapi:generate": "pnpm --filter @welfare-mall/api run openapi:generate",
  "verify:api": "pnpm --filter @welfare-mall/api run typecheck && pnpm --filter @welfare-mall/api run test && pnpm --filter @welfare-mall/api run openapi:generate"
}
```

## Task 3: Add Minimal Health API

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/health.e2e-spec.ts`

- [x] **Step 1: Add root module**

Create `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule]
})
export class AppModule {}
```

- [x] **Step 2: Add health module**

Create `apps/api/src/health/health.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
```

- [x] **Step 3: Add health controller**

Create `apps/api/src/health/health.controller.ts`:

```ts
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'welfare-mall-api';
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'API health status',
    schema: {
      example: {
        status: 'ok',
        service: 'welfare-mall-api'
      }
    }
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'welfare-mall-api'
    };
  }
}
```

- [x] **Step 4: Add bootstrap**

Create `apps/api/src/main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

export async function createApp() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Welfare Mall API')
    .setDescription('Welfare Mall V2 API contract')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  return app;
}

async function bootstrap() {
  const app = await createApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

if (require.main === module) {
  void bootstrap();
}
```

- [x] **Step 5: Add health e2e test**

Create `apps/api/test/health.e2e-spec.ts`:

```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

describe('Health API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns API health status', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({
        status: 'ok',
        service: 'welfare-mall-api'
      });
  });
});
```

## Task 4: Add Prisma and Docker Foundation

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/.env.example`
- Create: `docker-compose.yml`

- [x] **Step 1: Add Prisma schema shell**

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model SystemMigrationMarker {
  id        String   @id @default(cuid())
  marker    String   @unique
  createdAt DateTime @default(now())

  @@map("system_migration_marker")
}
```

- [x] **Step 2: Add API env example**

Create `apps/api/.env.example`:

```text
PORT=3000
DATABASE_URL="mysql://welfare_mall:welfare_mall_password@127.0.0.1:3306/welfare_mall_v2"
REDIS_URL="redis://127.0.0.1:6379/0"
```

- [x] **Step 3: Add Docker services**

Create `docker-compose.yml`. The top-level `name` is required because this workspace path can contain non-ASCII characters and Docker Compose must not derive an invalid empty project name from the directory.

```yaml
name: welfare-mall-v2

services:
  mysql:
    image: mysql:8.4
    container_name: welfare-mall-v2-mysql
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: welfare_mall_v2
      MYSQL_USER: welfare_mall
      MYSQL_PASSWORD: welfare_mall_password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-proot_password"]
      interval: 10s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7.4
    container_name: welfare-mall-v2-redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 10

volumes:
  mysql-data:
```

## Task 5: Add OpenAPI Generation

**Files:**
- Create: `apps/api/src/openapi/generate-openapi.ts`
- Create directory through script output: `packages/contracts/openapi`

- [x] **Step 1: Add OpenAPI generator**

Create `apps/api/src/openapi/generate-openapi.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createApp } from '../main';

async function generateOpenApi() {
  const app = await createApp();
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('Welfare Mall API')
    .setDescription('Welfare Mall V2 API contract')
    .setVersion('0.0.1')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const outputDir = resolve(__dirname, '../../../../packages/contracts/openapi');
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    resolve(outputDir, 'welfare-mall-api.openapi.json'),
    `${JSON.stringify(document, null, 2)}\n`,
    'utf8'
  );

  await app.close();
}

void generateOpenApi();
```

- [x] **Step 2: Verify OpenAPI generation**

Run:

```powershell
pnpm run openapi:generate
Test-Path packages/contracts/openapi/welfare-mall-api.openapi.json
```

Expected:

```text
True
```

## Task 6: Verification and PR

**Files:**
- All files in this plan

- [x] **Step 1: Install dependencies**

Run:

```powershell
pnpm install
```

Expected: dependencies install and `pnpm-lock.yaml` updates.

- [x] **Step 2: Run local API verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
```

Expected:

- Typecheck exits 0.
- Health e2e test passes.
- OpenAPI JSON is generated.
- Build exits 0.

- [x] **Step 3: Run root verification**

Run:

```powershell
pnpm run verify
```

Expected: root verification exits 0.

- [x] **Step 4: Commit and push**

Run:

```powershell
git status -sb
git add apps/api packages/contracts package.json pnpm-lock.yaml docker-compose.yml .github/workflows/project-docs-check.yml docs/superpowers/plans/2026-06-02-api-foundation.md
git commit -m "feat: add api foundation"
git push -u origin codex/api-foundation
```

Expected: branch is pushed and ready for a draft PR.

## Self-Review

Spec coverage:

- The API foundation creates a runnable service before adding business domains.
- Health endpoint provides the first runtime smoke target.
- OpenAPI output prepares future generated clients.
- Prisma and Docker are introduced without business schema churn.

Placeholder scan:

- This file avoids unresolved placeholder markers by not using forbidden placeholder words.

Type consistency:

- Health endpoint path is `/api/health` because `main.ts` sets the global prefix to `api`.
- OpenAPI output path is `packages/contracts/openapi/welfare-mall-api.openapi.json`.
- API package name is `@welfare-mall/api`, matching root filter scripts.
