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

    const product = await this.productMasterRepository.saveFromDraft({
      productId: input.productId ?? null,
      payload: input.payload,
      actorUserId: input.actorUserId
    });
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
}
