import { randomUUID } from 'node:crypto';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { ACCESS_TOKEN_TTL_SECONDS } from './jwt-token.service';

export type AuthSessionRecord = {
  sessionId: string;
  userSub: string;
  username: string;
  createdAt: number;
  expiresAt: number;
};

type MemoryRecord<T> = {
  value: T;
  expiresAt: number;
};

@Injectable()
export class AuthSessionStore implements OnModuleDestroy {
  private readonly redisUrl = process.env.REDIS_URL;
  private redisClient: RedisClientType | null = null;
  private redisConnectPromise: Promise<RedisClientType> | null = null;
  private readonly memorySessions = new Map<string, MemoryRecord<AuthSessionRecord>>();
  private readonly memoryRevokedTokens = new Map<string, MemoryRecord<true>>();

  createSessionRecord(input: { userSub: string; username: string }, now = currentUnixSeconds()): AuthSessionRecord {
    return {
      sessionId: randomUUID(),
      userSub: input.userSub,
      username: input.username,
      createdAt: now,
      expiresAt: now + ACCESS_TOKEN_TTL_SECONDS
    };
  }

  async saveSession(record: AuthSessionRecord) {
    const ttlSeconds = ttlFromExpiry(record.expiresAt);
    const client = await this.getRedisClient();
    if (client) {
      await client.set(sessionKey(record.sessionId), JSON.stringify(record), { EX: ttlSeconds });
      return;
    }

    this.memorySessions.set(record.sessionId, { value: record, expiresAt: record.expiresAt });
  }

  async getSession(sessionId: string): Promise<AuthSessionRecord | null> {
    const client = await this.getRedisClient();
    if (client) {
      const value = await client.get(sessionKey(sessionId));
      return value ? (JSON.parse(value) as AuthSessionRecord) : null;
    }

    const record = this.memorySessions.get(sessionId);
    if (!record || record.expiresAt <= currentUnixSeconds()) {
      this.memorySessions.delete(sessionId);
      return null;
    }

    return record.value;
  }

  async revokeSession(sessionId: string) {
    const client = await this.getRedisClient();
    if (client) {
      await client.del(sessionKey(sessionId));
      return;
    }

    this.memorySessions.delete(sessionId);
  }

  async revokeToken(jti: string, expiresAt: number) {
    const ttlSeconds = ttlFromExpiry(expiresAt);
    const client = await this.getRedisClient();
    if (client) {
      await client.set(revokedTokenKey(jti), '1', { EX: ttlSeconds });
      return;
    }

    this.memoryRevokedTokens.set(jti, { value: true, expiresAt });
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const client = await this.getRedisClient();
    if (client) {
      return (await client.exists(revokedTokenKey(jti))) === 1;
    }

    const record = this.memoryRevokedTokens.get(jti);
    if (!record || record.expiresAt <= currentUnixSeconds()) {
      this.memoryRevokedTokens.delete(jti);
      return false;
    }

    return record.value;
  }

  async onModuleDestroy() {
    if (this.redisClient?.isOpen) {
      await this.redisClient.quit();
    }
  }

  private async getRedisClient(): Promise<RedisClientType | null> {
    if (!this.redisUrl) {
      return null;
    }
    if (this.redisClient?.isOpen) {
      return this.redisClient;
    }
    if (!this.redisConnectPromise) {
      const client = createClient({ url: this.redisUrl }) as RedisClientType;
      this.redisClient = client;
      this.redisConnectPromise = client.connect().then(() => client);
    }

    return this.redisConnectPromise;
  }
}

function currentUnixSeconds() {
  return Math.floor(Date.now() / 1000);
}

function ttlFromExpiry(expiresAt: number) {
  return Math.max(1, expiresAt - currentUnixSeconds());
}

function sessionKey(sessionId: string) {
  return `auth:session:${sessionId}`;
}

function revokedTokenKey(jti: string) {
  return `auth:revoked:${jti}`;
}
