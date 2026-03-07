import { SetMetadata } from '@nestjs/common'

import { IS_PUBLIC_ROUTE_KEY } from './auth.constants.js'

export const Public = () => SetMetadata(IS_PUBLIC_ROUTE_KEY, true)
