import { JwtTokenService } from '../../src/auth/jwt-token.service';

describe('JwtTokenService', () => {
  it('verifies a signed access token payload', () => {
    const service = new JwtTokenService();

    const token = service.signAccessToken(
      {
        sub: 'user-admin-local',
        username: 'admin-local',
        displayName: '本地平台管理员',
        subjectType: 'platform',
        subjectId: 'platform',
        permissions: ['product:audit']
      },
      {
        sessionId: 'session-001',
        jti: 'jti-001'
      }
    );

    expect(service.verifyAccessToken(token)).toEqual(
      expect.objectContaining({
        sub: 'user-admin-local',
        username: 'admin-local',
        subjectType: 'platform',
        subjectId: 'platform',
        sessionId: 'session-001',
        jti: 'jti-001',
        permissions: ['product:audit']
      })
    );
  });

  it('rejects a tampered access token', () => {
    const service = new JwtTokenService();
    const token = service.signAccessToken({
      sub: 'user-admin-local',
      username: 'admin-local',
      displayName: '本地平台管理员',
      subjectType: 'platform',
      subjectId: 'platform',
      permissions: ['product:audit']
    });

    const tamperedToken = `${token.slice(0, -1)}x`;

    expect(() => service.verifyAccessToken(tamperedToken)).toThrow('Invalid access token signature.');
  });
});
