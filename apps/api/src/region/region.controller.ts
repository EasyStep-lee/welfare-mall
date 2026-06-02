import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { RegionLevelCatalog } from './region-level';

@ApiTags('regions')
@Controller('regions')
export class RegionController {
  @Get('levels')
  @ApiOkResponse({
    description: 'Region level catalog',
    schema: {
      example: [
        {
          code: 'province',
          name: '省'
        }
      ]
    }
  })
  getLevels() {
    return RegionLevelCatalog;
  }
}
