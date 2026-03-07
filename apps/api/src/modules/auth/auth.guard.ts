import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { DatabaseService } from '../database/database.service.js'
import { AUTH_REQUEST_USER_KEY, IS_PUBLIC_ROUTE_KEY } from './auth.constants.js'
import { AuthService } from './auth.service.js'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string }
      [AUTH_REQUEST_USER_KEY]?: { id: string; email: string }
    }>()
    const authorizationHeader = request.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required.')
    }

    const token = authorizationHeader.slice('Bearer '.length)
    const payload = await this.authService.verifyToken(token)
    const user = await this.databaseService.db.query.users.findFirst({
      where: (table, { eq }) => eq(table.id, payload.sub),
      columns: {
        id: true,
        email: true,
      },
    })

    if (!user) {
      throw new UnauthorizedException('User no longer exists.')
    }

    request[AUTH_REQUEST_USER_KEY] = user
    return true
  }
}
