import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ProductDraftCommandInput } from './product-draft-command';
import { validateProductDraftCommand } from './product-draft-command';
import { ProductDraftRepository } from './product-draft.repository';
import type { ProductDraftSnapshotSummary } from './product-draft.repository';
import { ProductDraftSaveService } from './product-draft-save.service';
import type { ProductDraftSaveResult } from './product-draft-save.service';
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
  constructor(
    private readonly productDraftRepository: ProductDraftRepository,
    private readonly productDraftSaveService: ProductDraftSaveService
  ) {}

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

  @Post('drafts/save')
  @HttpCode(201)
  @ApiCreatedResponse({
    description: 'Validate and save product master data plus a draft snapshot',
    schema: {
      example: {
        product: {
          productId: 'product-001',
          mode: 'created',
          skuCount: 1,
          mediaCount: 2,
          qualificationCount: 1,
          parameterCount: 1,
          detailSectionCount: 1
        },
        snapshot: {
          id: 'snapshot-001',
          productId: 'product-001',
          versionNo: 1,
          payload: { code: 'P-RICE-001', name: '东北五常大米福利装' },
          createdBy: 'merchant-user-001',
          createdAt: '2026-06-02T00:00:00.000Z'
        },
        validation: {
          valid: true,
          issues: [],
          submitReadiness: { ready: true, missingRequirements: [] }
        }
      }
    }
  })
  async saveDraft(@Body() input: SaveProductDraftRequest) {
    assertSaveProductDraftRequest(input);

    const result = await this.productDraftSaveService.saveDraft({
      productId: input.productId ?? null,
      payload: input.payload,
      actorUserId: input.actorUserId
    });

    return toProductDraftSaveResponse(result);
  }

  @Post(':productId/draft-snapshots')
  @HttpCode(201)
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiCreatedResponse({
    description: 'Save a product draft snapshot',
    schema: {
      example: {
        id: 'snapshot-001',
        productId: 'product-001',
        versionNo: 1,
        payload: { code: 'P-RICE-001', name: '东北五常大米福利装' },
        createdBy: 'merchant-user-001',
        createdAt: '2026-06-02T00:00:00.000Z'
      }
    }
  })
  async saveDraftSnapshot(@Param('productId') productId: string, @Body() input: SaveProductDraftSnapshotRequest) {
    assertSaveProductDraftSnapshotRequest(input);

    const snapshot = await this.productDraftRepository.saveSnapshot({
      productId,
      payload: input.payload,
      createdBy: input.createdBy
    });

    return toProductDraftSnapshotResponse(snapshot);
  }

  @Get(':productId/draft-snapshots/latest')
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiOkResponse({
    description: 'Get the latest product draft snapshot',
    schema: {
      example: {
        snapshot: {
          id: 'snapshot-004',
          productId: 'product-001',
          versionNo: 4,
          payload: { code: 'P-RICE-001', name: '东北五常大米福利装' },
          createdBy: 'merchant-user-001',
          createdAt: '2026-06-02T00:00:00.000Z'
        }
      }
    }
  })
  async getLatestDraftSnapshot(@Param('productId') productId: string) {
    const snapshot = await this.productDraftRepository.findLatestSnapshot(productId);

    return {
      snapshot: snapshot ? toProductDraftSnapshotResponse(snapshot) : null
    };
  }
}

type SaveProductDraftSnapshotRequest = {
  payload: ProductDraftCommandInput;
  createdBy: string;
};

type SaveProductDraftRequest = {
  productId?: string | null;
  payload: ProductDraftCommandInput;
  actorUserId: string;
};

type ProductDraftSnapshotResponse = {
  id: string;
  productId: string;
  versionNo: number;
  payload: ProductDraftCommandInput;
  createdBy: string;
  createdAt: string;
};

type ProductDraftSaveResponse = {
  product: ProductDraftSaveResult['product'];
  snapshot: ProductDraftSnapshotResponse;
  validation: ProductDraftSaveResult['validation'];
};

function toProductDraftSaveResponse(result: ProductDraftSaveResult): ProductDraftSaveResponse {
  return {
    product: result.product,
    snapshot: toProductDraftSnapshotResponse(result.snapshot),
    validation: result.validation
  };
}

function toProductDraftSnapshotResponse(snapshot: ProductDraftSnapshotSummary): ProductDraftSnapshotResponse {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    versionNo: snapshot.versionNo,
    payload: snapshot.payload,
    createdBy: snapshot.createdBy,
    createdAt: snapshot.createdAt.toISOString()
  };
}

function assertSaveProductDraftSnapshotRequest(input: SaveProductDraftSnapshotRequest | undefined): asserts input is SaveProductDraftSnapshotRequest {
  const messages: string[] = [];

  if (!input?.payload || typeof input.payload !== 'object') {
    messages.push('payload is required.');
  }

  if (typeof input?.createdBy !== 'string' || input.createdBy.trim().length === 0) {
    messages.push('createdBy is required.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertSaveProductDraftRequest(input: SaveProductDraftRequest | undefined): asserts input is SaveProductDraftRequest {
  const messages: string[] = [];

  if (!input?.payload || typeof input.payload !== 'object') {
    messages.push('payload is required.');
  }

  if (typeof input?.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
    messages.push('actorUserId is required.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}
