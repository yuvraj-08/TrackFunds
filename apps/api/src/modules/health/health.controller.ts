import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

import { Public } from '../auth/public.decorator.js'
import { HealthService } from './health.service.js'

@ApiTags('health')
@Controller({
  path: 'health',
  version: '1',
})
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check whether the API process is healthy.' })
  getHealth() {
    return this.healthService.getHealth()
  }
}
