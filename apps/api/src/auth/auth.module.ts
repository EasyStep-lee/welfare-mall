import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthSessionStore } from './auth-session.store';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';
import { OptionalAuthGuard } from './optional-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthGuard, OptionalAuthGuard, AuthService, AuthSessionStore, JwtTokenService],
  exports: [AuthGuard, OptionalAuthGuard, AuthService, AuthSessionStore, JwtTokenService]
})
export class AuthModule {}
