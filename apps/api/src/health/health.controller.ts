import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HealthResponse = {
  status: 'ok';
  service: 'welfare-mall-api';
};

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    description: 'API health status',
    schema: {
      example: {
        status: 'ok',
        service: 'welfare-mall-api'
      }
    }
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'welfare-mall-api'
    };
  }
}

