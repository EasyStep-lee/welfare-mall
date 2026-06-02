import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProductPoolStatusCatalog } from './product-pool-status';

@ApiTags('product-pools')
@Controller('product-pools')
export class ProductPoolController {
  @Get('statuses')
  @ApiOkResponse({
    description: 'Product pool status catalog',
    schema: { example: [{ code: 'active', name: '启用' }] }
  })
  getStatuses() {
    return ProductPoolStatusCatalog;
  }
}
