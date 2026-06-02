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
import { ProductReviewActionCatalog, ProductReviewActions } from './product-review-action';
import { ProductReviewDecisionService } from './product-review-decision.service';
import type { ProductReviewDecisionSummary } from './product-review-decision.service';
import type { ProductReviewDecisionAction } from './product-review-decision.repository';
import { ProductReviewSubmissionService } from './product-review-submission.service';
import type { ProductReviewSubmissionSummary } from './product-review-submission.service';
import { ProductSaleStatusCatalog } from './product-sale-status';
import { ProductStatusCatalog } from './product-status';
import { ProductStatusTransitionCatalog } from './product-status-transition';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly productDraftRepository: ProductDraftRepository,
    private readonly productDraftSaveService: ProductDraftSaveService,
    private readonly productReviewDecisionService: ProductReviewDecisionService,
    private readonly productReviewSubmissionService: ProductReviewSubmissionService
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

  @Post(':productId/review-submissions')
  @HttpCode(201)
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiCreatedResponse({
    description: 'Submit a saved merchant product draft for review',
    schema: {
      example: {
        productId: 'product-001',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reviewLog: {
          id: 'review-log-001',
          productId: 'product-001',
          actorUserId: 'merchant-user-001',
          actorType: 'merchant',
          action: 'submit_review',
          fromStatus: 'draft',
          toStatus: 'pending_review',
          reason: null,
          createdAt: '2026-06-02T00:00:00.000Z'
        }
      }
    }
  })
  async submitForReview(@Param('productId') productId: string, @Body() input: SubmitProductReviewRequest) {
    assertSubmitProductReviewRequest(input);

    const result = await this.productReviewSubmissionService.submitForReview({
      productId,
      actorUserId: input.actorUserId
    });

    return toProductReviewSubmissionResponse(result);
  }

  @Post(':productId/review-decisions')
  @HttpCode(201)
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiCreatedResponse({
    description: 'Approve or reject a pending product review',
    schema: {
      example: {
        productId: 'product-001',
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved',
        reviewLog: {
          id: 'review-log-001',
          productId: 'product-001',
          actorUserId: 'admin-user-001',
          actorType: 'admin',
          action: 'approve',
          fromStatus: 'pending_review',
          toStatus: 'approved',
          reason: null,
          createdAt: '2026-06-02T00:00:00.000Z'
        }
      }
    }
  })
  async decideReview(@Param('productId') productId: string, @Body() input: DecideProductReviewRequest) {
    assertDecideProductReviewRequest(input);

    const result = await this.productReviewDecisionService.decide({
      productId,
      action: input.action,
      actorUserId: input.actorUserId,
      reason: normalizeOptionalText(input.reason)
    });

    return toProductReviewDecisionResponse(result);
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

type SubmitProductReviewRequest = {
  actorUserId: string;
};

type DecideProductReviewRequest = {
  action: ProductReviewDecisionAction;
  actorUserId: string;
  reason?: string | null;
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

type ProductReviewSubmissionResponse = Omit<ProductReviewSubmissionSummary, 'allowed' | 'reviewLog'> & {
  reviewLog: Omit<ProductReviewSubmissionSummary['reviewLog'], 'createdAt'> & {
    createdAt: string;
  };
};

type ProductReviewDecisionResponse = Omit<ProductReviewDecisionSummary, 'allowed' | 'reviewLog'> & {
  reviewLog: Omit<ProductReviewDecisionSummary['reviewLog'], 'createdAt'> & {
    createdAt: string;
  };
};

function toProductDraftSaveResponse(result: ProductDraftSaveResult): ProductDraftSaveResponse {
  return {
    product: result.product,
    snapshot: toProductDraftSnapshotResponse(result.snapshot),
    validation: result.validation
  };
}

function toProductReviewSubmissionResponse(result: ProductReviewSubmissionSummary): ProductReviewSubmissionResponse {
  return {
    productId: result.productId,
    action: result.action,
    fromStatus: result.fromStatus,
    toStatus: result.toStatus,
    reviewLog: {
      ...result.reviewLog,
      createdAt: result.reviewLog.createdAt.toISOString()
    }
  };
}

function toProductReviewDecisionResponse(result: ProductReviewDecisionSummary): ProductReviewDecisionResponse {
  return {
    productId: result.productId,
    action: result.action,
    fromStatus: result.fromStatus,
    toStatus: result.toStatus,
    reviewLog: {
      ...result.reviewLog,
      createdAt: result.reviewLog.createdAt.toISOString()
    }
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

function assertSubmitProductReviewRequest(
  input: SubmitProductReviewRequest | undefined
): asserts input is SubmitProductReviewRequest {
  const messages: string[] = [];

  if (typeof input?.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
    messages.push('actorUserId is required.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function assertDecideProductReviewRequest(
  input: DecideProductReviewRequest | undefined
): asserts input is DecideProductReviewRequest {
  const messages: string[] = [];

  if (input?.action !== ProductReviewActions.Approve && input?.action !== ProductReviewActions.Reject) {
    messages.push('action must be approve or reject.');
  }

  if (typeof input?.actorUserId !== 'string' || input.actorUserId.trim().length === 0) {
    messages.push('actorUserId is required.');
  }

  if (input?.action === ProductReviewActions.Reject && !normalizeOptionalText(input.reason)) {
    messages.push('reason is required for reject.');
  }

  if (messages.length > 0) {
    throw new BadRequestException(messages);
  }
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
