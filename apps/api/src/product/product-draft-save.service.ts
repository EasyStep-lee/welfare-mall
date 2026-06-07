import { BadRequestException, Injectable } from '@nestjs/common';
import type { ProductDraftCommandInput, ProductDraftCommandValidationResult } from './product-draft-command';
import { validateProductDraftCommand } from './product-draft-command';
import { ProductDraftRepository } from './product-draft.repository';
import type { ProductDraftSnapshotSummary } from './product-draft.repository';
import { ProductMasterRepository } from './product-master.repository';
import type { ProductMasterWriteSummary } from './product-master.repository';

export type SaveProductDraftInput = {
  productId?: string | null;
  payload: ProductDraftCommandInput;
  actorUserId: string;
};

export type ProductDraftSaveResult = {
  product: ProductMasterWriteSummary;
  snapshot: ProductDraftSnapshotSummary;
  validation: ProductDraftCommandValidationResult;
};

@Injectable()
export class ProductDraftSaveService {
  constructor(
    private readonly productMasterRepository: ProductMasterRepository,
    private readonly productDraftRepository: ProductDraftRepository
  ) {}

  async saveDraft(input: SaveProductDraftInput): Promise<ProductDraftSaveResult> {
    const validation = validateProductDraftCommand(input.payload);
    if (!validation.valid) {
      throw new BadRequestException({ message: { validation } });
    }

    const product = await this.saveProductMaster(input);
    const snapshot = await this.productDraftRepository.saveSnapshot({
      productId: product.productId,
      payload: input.payload,
      createdBy: input.actorUserId
    });

    return {
      product,
      snapshot,
      validation
    };
  }

  private async saveProductMaster(input: SaveProductDraftInput) {
    try {
      return await this.productMasterRepository.saveFromDraft({
        productId: input.productId ?? null,
        payload: input.payload,
        actorUserId: input.actorUserId
      });
    } catch (error) {
      if (isPrismaForeignKeyError(error)) {
        throw new BadRequestException(`Product draft references missing master data: ${formatConstraintFields(error.meta?.constraint)}.`);
      }
      throw error;
    }
  }
}

function isPrismaForeignKeyError(error: unknown): error is { code: 'P2003'; meta?: { constraint?: unknown } } {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'P2003';
}

function formatConstraintFields(constraint: unknown): string {
  if (Array.isArray(constraint) && constraint.every((field) => typeof field === 'string')) {
    return constraint.join(', ');
  }
  if (typeof constraint === 'string' && constraint.length > 0) {
    return constraint;
  }
  return 'unknown field';
}
