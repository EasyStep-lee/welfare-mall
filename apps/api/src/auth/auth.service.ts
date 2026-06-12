import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionCodes } from '../iam/permissions';
import { AccessTokenPayload, AuthenticatedUser } from './authenticated-user';
import { AuthSessionStore } from './auth-session.store';
import { ACCESS_TOKEN_TTL_SECONDS, JwtTokenService } from './jwt-token.service';

type LocalLoginInput = {
  username: string;
  password: string;
};

const localUsers: AuthenticatedUser[] = [
  {
    sub: 'user-admin-local',
    username: 'admin-local',
    displayName: '本地平台管理员',
    subjectType: 'platform',
    subjectId: 'platform',
    permissions: Object.values(PermissionCodes)
  },
  {
    sub: 'user-merchant-local',
    username: 'merchant-local',
    displayName: '本地商户操作员',
    subjectType: 'merchant',
    subjectId: 'merchant-local-review',
    permissions: [
      PermissionCodes.ProductRead,
      PermissionCodes.ProductWrite,
      PermissionCodes.MerchantRead,
      PermissionCodes.SettlementRead
    ]
  },
  {
    sub: 'user-franchise-local',
    username: 'franchise-local',
    displayName: '本地加盟商操作员',
    subjectType: 'franchise',
    subjectId: 'franchise-local-review',
    permissions: [PermissionCodes.FranchiseRead, PermissionCodes.FranchiseWrite, PermissionCodes.SettlementRead]
  },
  {
    sub: 'user-buyer-local',
    username: 'buyer-local',
    displayName: '本地用户',
    subjectType: 'buyer',
    subjectId: 'user-001',
    permissions: []
  }
];

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly authSessionStore: AuthSessionStore
  ) {}

  async login(input: LocalLoginInput) {
    const user = localUsers.find((candidate) => candidate.username === input.username.trim());
    if (!user || input.password !== localDevelopmentPassword()) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    const session = this.authSessionStore.createSessionRecord({
      userSub: user.sub,
      username: user.username
    });
    await this.authSessionStore.saveSession(session);
    const jti = randomUUID();

    return {
      tokenType: 'Bearer',
      accessToken: this.jwtTokenService.signAccessToken(user, {
        sessionId: session.sessionId,
        jti
      }),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      sessionId: session.sessionId,
      user
    };
  }

  async authenticateAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = this.jwtTokenService.verifyAccessToken(token);
    const [session, revoked] = await Promise.all([
      this.authSessionStore.getSession(payload.sessionId),
      this.authSessionStore.isTokenRevoked(payload.jti)
    ]);
    if (revoked || !session || session.userSub !== payload.sub) {
      throw new UnauthorizedException('Invalid Bearer token.');
    }

    return payload;
  }

  async logout(user: AccessTokenPayload) {
    await Promise.all([this.authSessionStore.revokeToken(user.jti, user.exp), this.authSessionStore.revokeSession(user.sessionId)]);

    return { revoked: true };
  }
}

function localDevelopmentPassword() {
  return process.env.LOCAL_AUTH_PASSWORD ?? 'local-dev-password';
}
