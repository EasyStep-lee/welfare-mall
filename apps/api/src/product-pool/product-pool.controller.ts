import { BadRequestException, Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ProductPoolService } from './product-pool.service';
import { ProductPoolStatusCatalog } from './product-pool-status';

@ApiTags('product-pools')
@Controller('product-pools')
export class ProductPoolController {
  constructor(private readonly productPoolService: ProductPoolService) {}

  @Get('statuses')
  @ApiOkResponse({
    description: 'Product pool status catalog',
    schema: { example: [{ code: 'active', name: '启用' }] }
  })
  getStatuses() {
    return ProductPoolStatusCatalog;
  }

  @Post('items/publish')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Publish an approved product into a product pool',
    schema: {
      example: {
        productPool: {
          id: 'pool-001',
          code: 'FRANCHISE-franchise-001-DEFAULT',
          name: '默认商品池',
          status: 'active',
          franchiseId: 'franchise-001'
        },
        publishedItems: [
          {
            id: 'pool-item-001',
            productId: 'product-001',
            skuId: 'sku-001',
            displayName: '东北五常大米福利装',
            displaySkuCode: 'SKU-RICE-5KG',
            displayPriceAmount: 6990,
            displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
            sortOrder: 0
          }
        ]
      }
    }
  })
  async publishApprovedProduct(@Body() input: PublishProductPoolRequest) {
    assertPublishProductPoolRequest(input);

    return this.productPoolService.publishApprovedProduct({
      productId: input.productId.trim(),
      actorUserId: input.actorUserId.trim()
    });
  }

  @Get('catalog')
  @ApiOkResponse({
    description: 'Active product pool catalog',
    schema: {
      example: {
        productPools: [
          {
            id: 'pool-001',
            code: 'FRANCHISE-franchise-001-DEFAULT',
            name: '默认商品池',
            status: 'active',
            franchiseId: 'franchise-001',
            items: [
              {
                id: 'pool-item-001',
                productId: 'product-001',
                skuId: 'sku-001',
                displayName: '东北五常大米福利装',
                displaySkuCode: 'SKU-RICE-5KG',
                displayPriceAmount: 6990,
                displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
                sortOrder: 0
              }
            ]
          }
        ]
      }
    }
  })
  async listCatalog(@Query('franchiseId') franchiseId?: string) {
    return this.productPoolService.listCatalog({
      franchiseId: normalizeOptionalText(franchiseId)
    });
  }
}

type PublishProductPoolRequest = {
  productId: string;
  actorUserId: string;
};

function assertPublishProductPoolRequest(
  input: PublishProductPoolRequest | undefined
): asserts input is PublishProductPoolRequest {
  const messages: string[] = [];

  if (typeof input?.productId !== 'string' || input.productId.trim().length === 0) {
    messages.push('productId is required.');
  }

  if (typeof input?.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
    messages.push('actorUserId is required.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function normalizeOptionalText(value: string | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
