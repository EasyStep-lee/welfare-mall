import { PermissionCode } from '../iam/permissions';

export type AuthSubjectType = 'platform' | 'merchant' | 'buyer';

export type AuthenticatedUser = {
  sub: string;
  username: string;
  displayName: string;
  subjectType: AuthSubjectType;
  subjectId: string;
  permissions: PermissionCode[];
};

export type AccessTokenPayload = AuthenticatedUser & {
  sessionId: string;
  jti: string;
  iat: number;
  exp: number;
};
