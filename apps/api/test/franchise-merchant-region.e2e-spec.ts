import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

describe('Franchise, merchant, and region catalogs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns franchise statuses', async () => {
    const response = await request(app.getHttpServer()).get('/api/franchises/statuses').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'active'
        })
      ])
    );
  });

  it('returns merchant statuses', async () => {
    const response = await request(app.getHttpServer()).get('/api/merchants/statuses').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'pending_review'
        })
      ])
    );
  });

  it('returns region levels', async () => {
    const response = await request(app.getHttpServer()).get('/api/regions/levels').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'province'
        })
      ])
    );
  });
});
