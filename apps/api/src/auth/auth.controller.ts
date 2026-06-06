import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AccessTokenPayload } from './authenticated-user';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

type RequestWithUser = Request & {
  user: AccessTokenPayload;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOkResponse({
    description: 'Local development JWT login',
    schema: {
      example: {
        tokenType: 'Bearer',
        accessToken: 'jwt-token',
        expiresIn: 3600,
        user: {
          username: 'admin-local',
          subjectType: 'platform',
          subjectId: 'platform'
        }
      }
    }
  })
  login(@Body() input: { username: string; password: string }) {
    return this.authService.login(input);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  logout(@Req() request: RequestWithUser) {
    return this.authService.logout(request.user);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getCurrentUser(@Req() request: RequestWithUser) {
    return request.user;
  }
}
