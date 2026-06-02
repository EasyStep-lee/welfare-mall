import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProductMediaTypeCatalog } from './product-media-type';
import { ProductParameterValueTypeCatalog } from './product-parameter-value-type';
import { ProductQualificationTypeCatalog } from './product-qualification-type';
import { ProductSaleStatusCatalog } from './product-sale-status';
import { ProductStatusCatalog } from './product-status';

@ApiTags('products')
@Controller('products')
export class ProductController {
  @Get('statuses')
  @ApiOkResponse({
    description: 'Product review status catalog',
    schema: { example: [{ code: 'draft', name: '草稿' }] }
  })
  getStatuses() {
    return ProductStatusCatalog;
  }

  @Get('sale-statuses')
  @ApiOkResponse({
    description: 'Product sale status catalog',
    schema: { example: [{ code: 'on_sale', name: '上架' }] }
  })
  getSaleStatuses() {
    return ProductSaleStatusCatalog;
  }

  @Get('media-types')
  @ApiOkResponse({
    description: 'Product media type catalog',
    schema: { example: [{ code: 'detail_image', name: '详情图' }] }
  })
  getMediaTypes() {
    return ProductMediaTypeCatalog;
  }

  @Get('qualification-types')
  @ApiOkResponse({
    description: 'Product qualification type catalog',
    schema: { example: [{ code: 'origin_certificate', name: '产地证明' }] }
  })
  getQualificationTypes() {
    return ProductQualificationTypeCatalog;
  }

  @Get('parameter-value-types')
  @ApiOkResponse({
    description: 'Product parameter value type catalog',
    schema: { example: [{ code: 'text', name: '文本' }] }
  })
  getParameterValueTypes() {
    return ProductParameterValueTypeCatalog;
  }
}
