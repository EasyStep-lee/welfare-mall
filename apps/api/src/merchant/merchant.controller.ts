import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MerchantStatusCatalog } from './merchant-status';

@ApiTags('merchants')
@Controller('merchants')
export class MerchantController {
  @Get('statuses')
  @ApiOkResponse({
    description: 'Merchant status catalog',
    schema: {
      example: [
        {
          code: 'pending_review',
          name: '待审核'
        }
      ]
    }
  })
  getStatuses() {
    return MerchantStatusCatalog;
  }
}
