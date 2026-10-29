import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { Public } from '../common/public.decorator.js';
import { Throttle } from '../common/throttle.decorator.js';
import { AuthService, type SessionTokenResult } from './auth.service.js';
import { AcceptEmployeeInvitationDto } from './dto/accept-employee-invitation.dto.js';
import { AcceptExistingEmployeeInvitationDto } from './dto/accept-existing-employee-invitation.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ limit: 5, windowSeconds: 60, name: 'auth-register' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a professional and create an establishment',
  })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Accept an employee invitation and create an account',
  })
  acceptEmployeeInvitation(@Body() body: AcceptEmployeeInvitationDto) {
    return this.authService.acceptEmployeeInvitation(body);
  }

  @Post('invitations/accept-existing')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Accept an employee invitation with an existing account',
  })
  acceptEmployeeInvitationForExistingUser(
    @Body() body: AcceptExistingEmployeeInvitationDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.authService.acceptEmployeeInvitationForExistingUser(
      actor.userId,
      body.token,
    );
  }

  @Public()
  @Throttle({ limit: 10, windowSeconds: 60, name: 'auth-login' })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email or phone and password' })
  login(@Body() body: LoginDto): Promise<SessionTokenResult> {
    return this.authService.login(body.identifier, body.password);
  }

  @Public()
  @Throttle({ limit: 30, windowSeconds: 60, name: 'auth-refresh' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token' })
  refresh(@Body() body: RefreshTokenDto): Promise<SessionTokenResult> {
    return this.authService.refresh(body.refreshToken);
  }

  @Public()
  @Throttle({ limit: 5, windowSeconds: 300, name: 'auth-forgot-password' })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(body.email);
  }

  @Public()
  @Throttle({ limit: 10, windowSeconds: 300, name: 'auth-reset-password' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current refresh-token family' })
  async logout(@CurrentActor() actor: AuthenticatedActor) {
    await this.authService.logout(actor);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated professional profile' })
  getMe(@CurrentActor() actor: AuthenticatedActor) {
    return this.authService.getMe(actor.userId);
  }
}
