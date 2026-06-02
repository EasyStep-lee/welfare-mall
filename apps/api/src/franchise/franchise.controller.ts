import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FranchiseStatusCatalog } from './franchise-status';

@ApiTags('franchises')
@Controller('franchises')
export class FranchiseController {
  @Get('statuses')
  @ApiOkResponse({
    description: 'Franchise status catalog',
    schema: {
      example: [
        {
          code: 'active',
          name: '正常'
        }
      ]
    }
  })
  getStatuses() {
    return FranchiseStatusCatalog;
  }
}
