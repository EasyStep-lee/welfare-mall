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

