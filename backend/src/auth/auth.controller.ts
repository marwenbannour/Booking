import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentActor,
  type AuthenticatedActor,
} from '../common/current-actor.decorator.js';
import { Public } from '../common/public.decorator.js';
import { Throttle } from '../common/throttle.decorator.js';
import { AuthService, type SessionTokenResult } from './auth.service.js';
import {
  clearRefreshCookie,
  extractRefreshCookie,
  setRefreshCookie,
} from './auth-cookie.js';
import { AcceptEmployeeInvitationDto } from './dto/accept-employee-invitation.dto.js';
import { AcceptExistingEmployeeInvitationDto } from './dto/accept-existing-employee-invitation.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { CloseAccountDto } from './dto/close-account.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly refreshCookieSecure: boolean;
  private readonly refreshCookieSameSite: 'lax' | 'strict' | 'none';
  private readonly refreshTokenTtlSeconds: number;
  private readonly corsOrigins: Set<string>;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    this.refreshCookieSecure =
      config.get<string>('NODE_ENV') === 'production' ||
      config.get<string>('REFRESH_COOKIE_SECURE') === 'true';
    this.refreshTokenTtlSeconds = Number(
      config.get<string>('JWT_REFRESH_TTL_SECONDS') ?? '604800',
    );
    this.corsOrigins = new Set(
      (config.get<string>('CORS_ORIGINS') ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    );
    const sameSite = (
      config.get<string>('REFRESH_COOKIE_SAME_SITE') ?? 'lax'
    ).toLowerCase();
    if (!['lax', 'strict', 'none'].includes(sameSite)) {
      throw new Error('REFRESH_COOKIE_SAME_SITE must be lax, strict, or none');
    }
    this.refreshCookieSameSite = sameSite as 'lax' | 'strict' | 'none';
    if (this.refreshCookieSameSite === 'none') this.refreshCookieSecure = true;
  }

  private issueBrowserSession(
    response: Response,
    tokens: SessionTokenResult,
    transport?: string,
  ) {
    if (transport === 'body') return tokens;
    setRefreshCookie(
      response,
      tokens.refreshToken,
      this.refreshTokenTtlSeconds,
      this.refreshCookieSecure,
      this.refreshCookieSameSite,
    );
    return {
      accessToken: tokens.accessToken,
      tokenType: tokens.tokenType,
      expiresIn: tokens.expiresIn,
    };
  }

  private clearBrowserSession(response: Response) {
    clearRefreshCookie(
      response,
      this.refreshCookieSecure,
      this.refreshCookieSameSite,
    );
  }

  @Public()
  @Throttle({ limit: 5, windowSeconds: 60, name: 'auth-register' })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a professional and create an establishment',
  })
  async register(
    @Body() body: RegisterDto,
    @Headers('x-session-transport') transport: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(body);
    if (transport === 'body') return result;
    const { refreshToken: _refreshToken, ...account } = result;
    return {
      ...account,
      ...this.issueBrowserSession(response, result, transport),
    };
  }

  @Public()
  @Post('invitations/accept')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Accept an employee invitation and create an account',
  })
  async acceptEmployeeInvitation(
    @Body() body: AcceptEmployeeInvitationDto,
    @Headers('x-session-transport') transport: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.acceptEmployeeInvitation(body);
    if (transport === 'body') return result;
    const { refreshToken: _refreshToken, ...account } = result;
    return {
      ...account,
      ...this.issueBrowserSession(response, result, transport),
    };
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
  async login(
    @Body() body: LoginDto,
    @Headers('x-session-transport') transport: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(
      body.identifier,
      body.password,
    );
    return this.issueBrowserSession(response, result, transport);
  }

  @Public()
  @Throttle({ limit: 30, windowSeconds: 60, name: 'auth-refresh' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate a refresh token' })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() request: Request,
    @Headers('x-session-transport') transport: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const origin = request.headers.origin;
    if (origin && !this.corsOrigins.has(origin)) {
      throw new ForbiddenException('Origin is not allowed to refresh this session');
    }
    const token = body.refreshToken ?? extractRefreshCookie(request);
    if (!token) {
      throw new UnauthorizedException('No refresh session was provided');
    }
    try {
      const result = await this.authService.refresh(token);
      return this.issueBrowserSession(response, result, transport);
    } catch (error) {
      this.clearBrowserSession(response);
      throw error;
    }
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

  @Public()
  @Throttle({ limit: 10, windowSeconds: 300, name: 'auth-verify-email' })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a new email address using its token' })
  verifyEmail(@Body() body: ConfirmEmailChangeDto) {
    return this.authService.confirmEmailChange(body.token);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current refresh-token family' })
  async logout(
    @CurrentActor() actor: AuthenticatedActor,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(actor);
    this.clearBrowserSession(response);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated professional profile' })
  getMe(@CurrentActor() actor: AuthenticatedActor) {
    return this.authService.getMe(actor.userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Throttle({ limit: 10, windowSeconds: 300, name: 'auth-update-profile' })
  @ApiOperation({ summary: 'Update account contact details and locale' })
  updateMe(
    @Body() body: UpdateProfileDto,
    @CurrentActor() actor: AuthenticatedActor,
  ) {
    return this.authService.updateProfile(actor.userId, body);
  }

  @Patch('password')
  @ApiBearerAuth()
  @Throttle({ limit: 5, windowSeconds: 300, name: 'auth-change-password' })
  @ApiOperation({ summary: 'Change the password and revoke all sessions' })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentActor() actor: AuthenticatedActor,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(
      actor.userId,
      body.currentPassword,
      body.newPassword,
    );
    this.clearBrowserSession(response);
    return result;
  }

  @Delete('me')
  @ApiBearerAuth()
  @Throttle({ limit: 5, windowSeconds: 300, name: 'auth-close-account' })
  @ApiOperation({ summary: 'Close this account while retaining business records' })
  async closeAccount(
    @Body() body: CloseAccountDto,
    @CurrentActor() actor: AuthenticatedActor,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.closeAccount(
      actor.userId,
      body.currentPassword,
    );
    this.clearBrowserSession(response);
    return result;
  }
}
