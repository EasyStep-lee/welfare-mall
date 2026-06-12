import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../../src/main';

describe('Auth API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('issues a local development JWT and returns the authenticated user', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin-local', password: 'local-dev-password' })
      .expect(201);

    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        tokenType: 'Bearer',
        expiresIn: 3600,
        sessionId: expect.any(String),
        user: expect.objectContaining({
          username: 'admin-local',
          subjectType: 'platform',
          subjectId: 'platform',
          permissions: expect.arrayContaining(['product:audit'])
        })
      })
    );
    expect(typeof loginResponse.body.accessToken).toBe('string');

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toEqual(
      expect.objectContaining({
        username: 'admin-local',
        subjectType: 'platform',
        subjectId: 'platform',
        permissions: expect.arrayContaining(['product:audit'])
      })
    );
  });

  it('issues a local franchise JWT for the franchise workbench', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'franchise-local', password: 'local-dev-password' })
      .expect(201);

    expect(loginResponse.body).toEqual(
      expect.objectContaining({
        tokenType: 'Bearer',
        expiresIn: 3600,
        sessionId: expect.any(String),
        user: expect.objectContaining({
          username: 'franchise-local',
          subjectType: 'franchise',
          subjectId: 'franchise-local-review',
          permissions: expect.arrayContaining(['franchise:read', 'franchise:write', 'settlement:read'])
        })
      })
    );
    expect(typeof loginResponse.body.accessToken).toBe('string');

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(meResponse.body).toEqual(
      expect.objectContaining({
        username: 'franchise-local',
        subjectType: 'franchise',
        subjectId: 'franchise-local-review',
        permissions: expect.arrayContaining(['franchise:read', 'franchise:write', 'settlement:read'])
      })
    );
  });

  it('rejects protected requests without a Bearer token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('rejects protected requests with an invalid Bearer token', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', 'Bearer invalid-token').expect(401);
  });

  it('revokes the current JWT on logout', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'admin-local', password: 'local-dev-password' })
      .expect(201);

    const token = loginResponse.body.accessToken as string;

    await request(app.getHttpServer()).post('/api/auth/logout').set('Authorization', `Bearer ${token}`).expect(201);

    await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401);
  });
});
