import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AccessTokenPayload, AuthenticatedUser } from './authenticated-user';

const ACCESS_TOKEN_TTL_SECONDS = 3600;

@Injectable()
export class JwtTokenService {
  private readonly secret = process.env.JWT_SECRET ?? 'local-development-jwt-secret';

  signAccessToken(user: AuthenticatedUser, now = Math.floor(Date.now() / 1000)): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: AccessTokenPayload = {
      ...user,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SECONDS
    };
    const encodedHeader = encodeJson(header);
    const encodedPayload = encodeJson(payload);
    const signature = this.sign(`${encodedHeader}.${encodedPayload}`);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyAccessToken(token: string, now = Math.floor(Date.now() / 1000)): AccessTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid access token format.');
    }

    const encodedHeader = parts[0];
    const encodedPayload = parts[1];
    const signature = parts[2];
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new Error('Invalid access token format.');
    }

    const expectedSignature = this.sign(`${encodedHeader}.${encodedPayload}`);
    if (!constantTimeEquals(signature, expectedSignature)) {
      throw new Error('Invalid access token signature.');
    }

    const header = decodeJson<{ alg?: string; typ?: string }>(encodedHeader);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new Error('Invalid access token header.');
    }

    const payload = decodeJson<AccessTokenPayload>(encodedPayload);
    if (typeof payload.exp !== 'number' || payload.exp <= now) {
      throw new Error('Access token expired.');
    }

    return payload;
  }

  private sign(value: string): string {
    return base64UrlEncode(createHmac('sha256', this.secret).update(value).digest());
  }
}

export { ACCESS_TOKEN_TTL_SECONDS };

function encodeJson(value: unknown): string {
  return base64UrlEncode(Buffer.from(JSON.stringify(value), 'utf8'));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(base64UrlDecode(value)).toString('utf8')) as T;
}

function base64UrlEncode(value: Buffer): string {
  return value.toString('base64').replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function base64UrlDecode(value: string): Buffer {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return Buffer.from(padded.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
}

function constantTimeEquals(left: string | undefined, right: string): boolean {
  if (!left) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
