import { Body, Controller, Get, Post, Version } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'

import { CurrentUser } from './current-user.decorator.js'
import { ForgotPasswordDto } from './dto/forgot-password.dto.js'
import { LoginDto } from './dto/login.dto.js'
import { LogoutDto } from './dto/logout.dto.js'
import { RefreshTokenDto } from './dto/refresh-token.dto.js'
import { RegisterDto } from './dto/register.dto.js'
import { ResetPasswordDto } from './dto/reset-password.dto.js'
import { Public } from './public.decorator.js'
import type { AuthenticatedUser } from './auth.types.js'
import { AuthService } from './auth.service.js'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Version('1')
  @ApiOperation({ summary: 'Register a new user and receive a JWT.' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body)
  }

  @Public()
  @Post('login')
  @Version('1')
  @ApiOperation({ summary: 'Login with email and password.' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body)
  }

  @Public()
  @Post('forgot-password')
  @Version('1')
  @ApiOperation({ summary: 'Issue a password reset token for a user email.' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body)
  }

  @Public()
  @Post('reset-password')
  @Version('1')
  @ApiOperation({ summary: 'Reset a password using a valid reset token.' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body)
  }

  @Public()
  @Post('refresh')
  @Version('1')
  @ApiOperation({ summary: 'Rotate a refresh token and receive a new auth token pair.' })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body)
  }

  @Public()
  @Post('logout')
  @Version('1')
  @ApiOperation({ summary: 'Revoke a refresh token session.' })
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body)
  }

  @Get('me')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current authenticated user.' })
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id)
  }

  @Post('logout-all')
  @Version('1')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all refresh token sessions for the current user.' })
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id)
  }
}
