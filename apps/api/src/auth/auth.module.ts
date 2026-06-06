import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt-token.service';

@Module({
  controllers: [AuthController],
  providers: [AuthGuard, AuthService, JwtTokenService],
  exports: [AuthGuard, AuthService, JwtTokenService]
})
export class AuthModule {}
