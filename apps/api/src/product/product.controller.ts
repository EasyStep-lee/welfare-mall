import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { ProductDraftCommandInput } from './product-draft-command';
import { validateProductDraftCommand } from './product-draft-command';
import { ProductMediaTypeCatalog } from './product-media-type';
import { ProductParameterValueTypeCatalog } from './product-parameter-value-type';
import { ProductQualificationTypeCatalog } from './product-qualification-type';
import { ProductReviewActionCatalog } from './product-review-action';
import { ProductSaleStatusCatalog } from './product-sale-status';
import { ProductStatusCatalog } from './product-status';
import { ProductStatusTransitionCatalog } from './product-status-transition';

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

  @Get('review-actions')
  @ApiOkResponse({
    description: 'Product review workflow action catalog',
    schema: { example: [{ code: 'submit_review', name: '提交审核', actor: 'merchant' }] }
  })
  getReviewActions() {
    return ProductReviewActionCatalog;
  }

  @Get('status-transitions')
  @ApiOkResponse({
    description: 'Product review status transition catalog',
    schema: { example: [{ actor: 'admin', fromStatus: 'pending_review', action: 'approve', toStatus: 'approved' }] }
  })
  getStatusTransitions() {
    return ProductStatusTransitionCatalog;
  }

  @Post('draft-validation')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Validate a merchant product draft command before saving or submitting for review',
    schema: {
      example: {
        valid: true,
        issues: [],
        submitReadiness: { ready: true, missingRequirements: [] }
      }
    }
  })
  validateDraft(@Body() input: ProductDraftCommandInput) {
    return validateProductDraftCommand(input);
  }
}
