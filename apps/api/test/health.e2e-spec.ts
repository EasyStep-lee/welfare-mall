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

