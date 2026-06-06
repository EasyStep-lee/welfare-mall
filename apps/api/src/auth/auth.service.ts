import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PermissionCodes } from '../iam/permissions';
import { AuthenticatedUser } from './authenticated-user';
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
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  login(input: LocalLoginInput) {
    const user = localUsers.find((candidate) => candidate.username === input.username.trim());
    if (!user || input.password !== localDevelopmentPassword()) {
      throw new UnauthorizedException('Invalid username or password.');
    }

    return {
      tokenType: 'Bearer',
      accessToken: this.jwtTokenService.signAccessToken(user),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user
    };
  }
}

function localDevelopmentPassword() {
  return process.env.LOCAL_AUTH_PASSWORD ?? 'local-dev-password';
}
