import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { AUTH_REQUEST_USER_KEY } from './auth.constants.js'
import type { AuthenticatedUser } from './auth.types.js'

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ [AUTH_REQUEST_USER_KEY]: AuthenticatedUser }>()
    return request[AUTH_REQUEST_USER_KEY]
  },
)
